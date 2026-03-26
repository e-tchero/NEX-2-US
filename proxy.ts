import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, detectBot, getRequestCost } from "@/lib/rate-limit";

/**
 * Security Proxy (Next.js 16)
 * 
 * Implements:
 * - Rate limiting
 * - Bot detection
 * - Security headers
 * - CORS policy
 * - Request sanitization
 */

// Public routes that don't require authentication
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PUBLIC_ROUTES = [
  "/",
  "/api/health",
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/callback",
];

// Routes that should skip rate limiting
const RATE_LIMIT_EXEMPT_ROUTES = [
  "/api/health",
  "/_next",
  "/favicon.ico",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Create response
  let response = NextResponse.next();

  // 1. Security Headers
  response = addSecurityHeaders(response);

  // 2. CORS Policy
  response = handleCORS(request, response);

  // 3. Bot Detection
  const botCheck = detectBot(request);
  if (botCheck.isBot && botCheck.score > 70) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
                request.headers.get("x-real-ip") || "unknown";
    
    console.warn("[Security] Bot detected:", {
      ip,
      userAgent: request.headers.get("user-agent"),
      score: botCheck.score,
      reasons: botCheck.reasons,
    });

    // Challenge suspicious bots with 429
    if (botCheck.score > 90) {
      return new NextResponse("Too many requests", {
        status: 429,
        headers: {
          "Retry-After": "3600",
          "Content-Type": "text/plain",
        },
      });
    }
  }

  // 4. Rate Limiting
  if (!RATE_LIMIT_EXEMPT_ROUTES.some((route) => pathname.startsWith(route))) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cost = getRequestCost(pathname, request.method);
    
    // TODO: Get user info from session/token
    const rateLimitResult = await checkRateLimit(request, {
      endpoint: pathname,
      isAuthenticated: false, // Get from session
      isPremium: false,       // Get from user data
      isAdmin: false,         // Get from user data
    });

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());

    if (!rateLimitResult.success) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
                  request.headers.get("x-real-ip") || "unknown";
      
      console.warn("[Security] Rate limit exceeded:", {
        ip,
        path: pathname,
        remaining: rateLimitResult.remaining,
      });

      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }
  }

  // 5. Request Logging (for audit trail)
  if (pathname.startsWith("/api/")) {
    logRequest(request);
  }

  return response;
}

/**
 * Add comprehensive security headers
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // HSTS - Force HTTPS
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // XSS Protection (legacy but still good to have)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  );

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://vercel.live",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'self' https://vercel.live",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // Additional security headers
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Download-Options", "noopen");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  return response;
}

/**
 * Handle CORS policy
 */
function handleCORS(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");

  // Allowed origins (update for production)
  const allowedOrigins = [
    "http://localhost:3000",
    "https://nexus-platform.vercel.app",
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean);

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    response.headers.set("Access-Control-Max-Age", "86400");

    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  return response;
}

/**
 * Log requests for security audit
 */
function logRequest(request: NextRequest): void {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
              request.headers.get("x-real-ip") || "unknown";
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: request.method,
    path: request.nextUrl.pathname,
    ip,
    userAgent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
  };

  // TODO: Send to logging service (Grafana Loki, CloudWatch, etc.)
  // For now, just console.log in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Audit]", logEntry);
  }
}

// Configure which paths the proxy runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
