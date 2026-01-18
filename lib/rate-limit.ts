/**
 * Rate Limiting Implementation
 * 
 * Multi-layer rate limiting system using token bucket algorithm
 * with Redis for distributed rate limiting across instances.
 */

import { NextRequest } from "next/server";

// Rate limit tiers
export const RATE_LIMIT_TIERS = {
  anonymous: {
    requests: 10,
    window: 60, // seconds
    burst: 20,
  },
  authenticated: {
    requests: 100,
    window: 60,
    burst: 150,
  },
  premium: {
    requests: 1000,
    window: 60,
    burst: 1500,
  },
  admin: {
    requests: 10000,
    window: 60,
    burst: 15000,
  },
} as const;

// Endpoint-specific rate limits
export const ENDPOINT_LIMITS: Record<string, { requests: number; window: number }> = {
  "/api/auth/signin": { requests: 5, window: 900 }, // 5 per 15 min
  "/api/auth/signup": { requests: 3, window: 3600 }, // 3 per hour
  "/api/auth/reset-password": { requests: 3, window: 3600 },
  "/api/ai/generate": { requests: 10, window: 3600 }, // 10 per hour
  "/api/ai/resume": { requests: 5, window: 3600 },
  "/api/projects": { requests: 100, window: 60 },
  "/api/blog/create": { requests: 10, window: 3600 },
  "/api/upload": { requests: 20, window: 3600 },
};

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Token bucket algorithm implementation
 * Allows burst traffic while maintaining average rate
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number,
    private refillInterval: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * (this.refillRate / this.refillInterval);

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  consume(tokens = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  getRemaining(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  getResetTime(): number {
    const tokensNeeded = this.capacity - this.tokens;
    const timeToRefill = (tokensNeeded / this.refillRate) * this.refillInterval;
    return Math.ceil(Date.now() / 1000 + timeToRefill);
  }
}

// In-memory store for development (use Redis in production)
const rateLimitStore = new Map<string, TokenBucket>();

/**
 * Get identifier for rate limiting (IP or user ID)
 */
function getIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Get real IP address (considering proxies)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  return `ip:${ip}`;
}

/**
 * Get rate limit tier based on user authentication status
 */
function getRateLimitTier(isAuthenticated: boolean, isPremium: boolean, isAdmin: boolean) {
  if (isAdmin) return RATE_LIMIT_TIERS.admin;
  if (isPremium) return RATE_LIMIT_TIERS.premium;
  if (isAuthenticated) return RATE_LIMIT_TIERS.authenticated;
  return RATE_LIMIT_TIERS.anonymous;
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  request: NextRequest,
  options: {
    userId?: string;
    isAuthenticated?: boolean;
    isPremium?: boolean;
    isAdmin?: boolean;
    endpoint?: string;
  } = {}
): Promise<RateLimitResult> {
  const identifier = getIdentifier(request, options.userId);
  const endpoint = options.endpoint || request.nextUrl.pathname;

  // Check endpoint-specific limits first
  const endpointLimit = ENDPOINT_LIMITS[endpoint];
  if (endpointLimit) {
    const key = `${identifier}:${endpoint}`;
    return checkEndpointLimit(key, endpointLimit);
  }

  // Fall back to tier-based limits
  const tier = getRateLimitTier(
    options.isAuthenticated || false,
    options.isPremium || false,
    options.isAdmin || false
  );

  return checkTierLimit(identifier, tier);
}

/**
 * Check endpoint-specific rate limit
 */
function checkEndpointLimit(
  key: string,
  limit: { requests: number; window: number }
): RateLimitResult {
  let bucket = rateLimitStore.get(key);

  if (!bucket) {
    bucket = new TokenBucket(limit.requests, limit.requests, limit.window);
    rateLimitStore.set(key, bucket);
  }

  const success = bucket.consume();
  const remaining = bucket.getRemaining();
  const reset = bucket.getResetTime();

  return {
    success,
    limit: limit.requests,
    remaining,
    reset,
    retryAfter: success ? undefined : reset - Math.floor(Date.now() / 1000),
  };
}

/**
 * Check tier-based rate limit
 */
function checkTierLimit(
  identifier: string,
  tier: typeof RATE_LIMIT_TIERS[keyof typeof RATE_LIMIT_TIERS]
): RateLimitResult {
  let bucket = rateLimitStore.get(identifier);

  if (!bucket) {
    bucket = new TokenBucket(tier.burst, tier.requests, tier.window);
    rateLimitStore.set(identifier, bucket);
  }

  const success = bucket.consume();
  const remaining = bucket.getRemaining();
  const reset = bucket.getResetTime();

  return {
    success,
    limit: tier.requests,
    remaining,
    reset,
    retryAfter: success ? undefined : reset - Math.floor(Date.now() / 1000),
  };
}

/**
 * Sliding window counter implementation (more accurate for strict limits)
 */
export class SlidingWindowCounter {
  private windows = new Map<string, Array<{ timestamp: number; count: number }>>();

  async increment(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; current: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Get or create window
    let window = this.windows.get(key) || [];

    // Remove old entries
    window = window.filter((entry) => entry.timestamp > windowStart);

    // Count requests in current window
    const current = window.reduce((sum, entry) => sum + entry.count, 0);

    if (current >= limit) {
      // Rate limit exceeded
      const oldestEntry = window[0];
      const resetTime = oldestEntry
        ? Math.ceil((oldestEntry.timestamp + windowSeconds * 1000) / 1000)
        : Math.ceil(now / 1000);

      return { allowed: false, current, resetTime };
    }

    // Add current request
    window.push({ timestamp: now, count: 1 });
    this.windows.set(key, window);

    return {
      allowed: true,
      current: current + 1,
      resetTime: Math.ceil((now + windowSeconds * 1000) / 1000),
    };
  }
}

/**
 * Bot detection based on request patterns
 */
export function detectBot(request: NextRequest): {
  isBot: boolean;
  score: number;
  reasons: string[];
} {
  const userAgent = request.headers.get("user-agent") || "";
  const reasons: string[] = [];
  let score = 0;

  // Check for common bot user agents
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
  ];

  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      score += 50;
      reasons.push(`Bot user agent detected: ${pattern}`);
      break;
    }
  }

  // Check for missing common browser headers
  const hasAcceptLanguage = request.headers.has("accept-language");
  const hasAccept = request.headers.has("accept");

  if (!hasAcceptLanguage) {
    score += 20;
    reasons.push("Missing accept-language header");
  }

  if (!hasAccept) {
    score += 20;
    reasons.push("Missing accept header");
  }

  // Check for suspicious header combinations
  const hasReferer = request.headers.has("referer");
  const hasCookie = request.headers.has("cookie");

  if (!hasReferer && !hasCookie && request.method === "POST") {
    score += 30;
    reasons.push("POST request without referer or cookies");
  }

  return {
    isBot: score >= 50,
    score,
    reasons,
  };
}

/**
 * Calculate request cost based on operation
 * Some operations are more expensive and should count more toward rate limits
 */
export function getRequestCost(pathname: string, method: string): number {
  // High-cost operations
  if (pathname.includes("/api/ai/") || pathname.includes("/api/generate")) {
    return 10; // AI operations are expensive
  }

  if (pathname.includes("/api/upload")) {
    return 5; // File uploads are costly
  }

  if (method === "POST" || method === "PUT" || method === "DELETE") {
    return 2; // Write operations cost more
  }

  return 1; // Default cost for GET requests
}

/**
 * Clean up old entries periodically (call from cron job)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();

  for (const [key, bucket] of rateLimitStore.entries()) {
    // Remove buckets that haven't been accessed in 1 hour
    const resetTime = bucket.getResetTime() * 1000;
    if (now - resetTime > 3600000) {
      rateLimitStore.delete(key);
    }
  }
}
