# NEXUS Security Architecture

**Document Owner:** CISO  
**Last Updated:** 2026-01-18  
**Classification:** Internal

## Executive Summary

This document outlines the comprehensive security architecture for the NEXUS platform, implementing a zero-trust security model designed to protect against sophisticated attackers, automated bots, and abusive users.

## Table of Contents

1. [Zero-Trust Security Model](#zero-trust-security-model)
2. [API Gateway Architecture](#api-gateway-architecture)
3. [Rate Limiting & Bot Protection](#rate-limiting--bot-protection)
4. [Authentication & Authorization](#authentication--authorization)
5. [Secrets Management](#secrets-management)
6. [Data Protection](#data-protection)
7. [Security Monitoring](#security-monitoring)
8. [Incident Response](#incident-response)

---

## Zero-Trust Security Model

### Principles

1. **Never Trust, Always Verify** - All requests are authenticated and authorized
2. **Least Privilege Access** - Minimal permissions granted by default
3. **Assume Breach** - Design with the assumption that perimeter is compromised
4. **Verify Explicitly** - Use all available data points for authorization decisions
5. **Micro-segmentation** - Isolate workloads and limit lateral movement

### Implementation Strategy

#### Network Layer
```
Internet → Cloudflare WAF → Load Balancer → API Gateway → Services
           ↓                    ↓              ↓
        DDoS Protection    TLS Termination   mTLS (Service Mesh)
```

#### Identity Verification
- Multi-factor authentication (MFA) required for sensitive operations
- Continuous authentication via session tokens with short TTL
- Device fingerprinting and geolocation analysis
- Behavioral biometrics for anomaly detection

#### Access Control
- Role-Based Access Control (RBAC) with fine-grained permissions
- Attribute-Based Access Control (ABAC) for complex scenarios
- Just-In-Time (JIT) access for administrative operations
- Regular access reviews and automatic privilege expiration

### Security Boundaries

```
┌─────────────────────────────────────────────────────────┐
│                     Public Zone                          │
│  ┌──────────────────────────────────────────────┐       │
│  │ Cloudflare (CDN, WAF, DDoS Protection)       │       │
│  └────────────────────┬─────────────────────────┘       │
└───────────────────────┼─────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────┐
│                  DMZ Zone                                 │
│  ┌────────────────────▼─────────────────────────┐       │
│  │ Load Balancer (TLS Termination)              │       │
│  └────────────────────┬─────────────────────────┘       │
│  ┌────────────────────▼─────────────────────────┐       │
│  │ API Gateway (Authentication, Rate Limiting)   │       │
│  └────────────────────┬─────────────────────────┘       │
└───────────────────────┼─────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────┐
│               Application Zone                            │
│  ┌────────────────────▼─────────────────────────┐       │
│  │ Next.js Application (Business Logic)         │       │
│  └────────────────────┬─────────────────────────┘       │
└───────────────────────┼─────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────┐
│                  Data Zone                                │
│  ┌────────────────────▼─────────────────────────┐       │
│  │ Supabase (PostgreSQL, Row-Level Security)    │       │
│  │ Redis (Session Store, Rate Limit Counters)   │       │
│  │ S3 (File Storage with Encryption)            │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## API Gateway Architecture

### Design Overview

The API Gateway acts as a single entry point for all client requests, implementing:
- Request routing and load balancing
- Authentication and authorization
- Rate limiting and throttling
- Request/response transformation
- Caching
- Security policy enforcement
- Analytics and monitoring

### Technology Stack

**Primary Gateway:** Next.js Middleware + Edge Functions  
**Backup Gateway:** Kong or Tyk (for advanced scenarios)

### Gateway Layers

#### 1. Edge Layer (Cloudflare Workers)
```typescript
// Executes at the edge, closest to users
- DDoS mitigation
- Bot detection (Cloudflare Bot Management)
- WAF rules
- Geographic filtering
- TLS enforcement (TLS 1.3+)
```

#### 2. Application Layer (Next.js Middleware)
```typescript
// middleware.ts
- JWT validation
- Session verification
- Rate limiting
- Request sanitization
- CORS policy enforcement
- Security headers injection
```

#### 3. Service Layer (API Routes)
```typescript
// app/api/*/route.ts
- Business logic authorization
- Input validation (Zod schemas)
- Database query optimization
- Response formatting
```

### Request Flow

```
1. Client Request
   ↓
2. Cloudflare Edge (Bot Detection, WAF)
   ↓
3. Next.js Middleware (Auth, Rate Limit)
   ↓
4. API Route Handler (Business Logic)
   ↓
5. Database (Row-Level Security)
   ↓
6. Response (+ Security Headers)
```

### Security Headers

```typescript
// Automatically injected by middleware
{
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
}
```

---

## Rate Limiting & Bot Protection

### Multi-Layer Defense Strategy

#### Layer 1: Cloudflare (Edge)
- **DDoS Protection:** Automatic mitigation of volumetric attacks
- **Bot Management:** ML-based bot detection and challenge
- **Rate Limiting:** 100 req/sec per IP at edge

#### Layer 2: Application (Next.js)
- **Token Bucket Algorithm:** Smooth rate limiting per user
- **Sliding Window:** Prevent burst attacks
- **Distributed Rate Limiting:** Redis-based counters

#### Layer 3: API Endpoints
- **Per-Endpoint Limits:** Customized limits based on operation cost
- **User-Based Throttling:** Different limits for free/paid tiers

### Rate Limit Configuration

```typescript
// Rate limit tiers
interface RateLimitTier {
  anonymous: {
    requests: 10,
    window: '1m',
    burst: 20
  },
  authenticated: {
    requests: 100,
    window: '1m',
    burst: 150
  },
  premium: {
    requests: 1000,
    window: '1m',
    burst: 1500
  }
}

// Endpoint-specific limits
const RATE_LIMITS = {
  '/api/auth/signin': { requests: 5, window: '15m' },
  '/api/auth/signup': { requests: 3, window: '1h' },
  '/api/ai/generate': { requests: 10, window: '1h' },
  '/api/projects': { requests: 100, window: '1m' },
  '/api/blog/create': { requests: 10, window: '1h' },
}
```

### Bot Protection Strategies

#### 1. Challenge-Based Protection
- **CAPTCHA:** hCaptcha or Cloudflare Turnstile for suspicious requests
- **Proof of Work:** Client must solve computational puzzle
- **Device Attestation:** Verify client device integrity

#### 2. Behavioral Analysis
- **Mouse Movement Tracking:** Detect automated tools
- **Keystroke Dynamics:** Identify bot patterns
- **Time-Based Analysis:** Flag unrealistic interaction speeds

#### 3. Fingerprinting
```typescript
// Device fingerprint components
const fingerprint = {
  userAgent: string,
  screenResolution: string,
  timezone: string,
  language: string,
  canvas: string,        // Canvas fingerprinting
  webgl: string,         // WebGL fingerprinting
  fonts: string[],       // Font enumeration
  plugins: string[],     // Browser plugins
  audioContext: string,  // Audio fingerprinting
}
```

#### 4. Reputation Scoring
```typescript
// Real-time reputation calculation
const reputationScore = calculateScore({
  ipReputation: checkIPBlacklists(),
  accountAge: user.createdAt,
  activityPattern: analyzeUserBehavior(),
  deviceTrust: verifyDeviceFingerprint(),
  geolocation: checkGeolocationAnomaly(),
})

if (reputationScore < THRESHOLD) {
  requireAdditionalVerification();
}
```

---

## Authentication & Authorization

### OAuth 2.0 + OIDC Implementation

#### Supported Providers
1. **GitHub OAuth** - Primary for developers
2. **Google OAuth** - General users
3. **Email Magic Links** - Passwordless authentication
4. **WebAuthn/Passkeys** - Phishing-resistant MFA

### Token Strategy

#### Access Tokens
- **Format:** JWT (signed with RS256)
- **Lifetime:** 15 minutes
- **Storage:** Memory only (never localStorage)
- **Claims:**
  ```json
  {
    "sub": "user_id",
    "email": "user@example.com",
    "role": "user|admin|premium",
    "permissions": ["read:projects", "write:projects"],
    "iat": 1234567890,
    "exp": 1234568790,
    "jti": "unique_token_id"
  }
  ```

#### Refresh Tokens
- **Format:** Opaque random string (256-bit)
- **Lifetime:** 30 days (sliding window)
- **Storage:** HttpOnly, Secure, SameSite=Strict cookie
- **Rotation:** New refresh token issued on every use
- **Revocation:** Stored in Redis with TTL

#### Token Rotation Flow

```typescript
// Automatic token rotation
1. Client makes request with expired access token
2. Middleware detects expiration
3. Middleware uses refresh token to get new access token
4. New refresh token issued (old one invalidated)
5. Response includes new tokens
6. Client updates tokens transparently
```

### Session Management

```typescript
// Session security features
const session = {
  id: crypto.randomUUID(),
  userId: user.id,
  deviceFingerprint: hash(deviceInfo),
  ipAddress: request.ip,
  userAgent: request.userAgent,
  lastActivity: Date.now(),
  expiresAt: Date.now() + SESSION_TIMEOUT,
  
  // Security flags
  requiresMFA: false,
  suspiciousActivity: false,
  concurrentSessions: 3,  // Max allowed
}

// Session validation on every request
if (isSessionExpired(session) || 
    hasDeviceChanged(session) || 
    hasGeolocationAnomalies(session)) {
  requireReauthentication();
}
```

### Authorization Model

#### Row-Level Security (RLS)
```sql
-- PostgreSQL RLS policies
CREATE POLICY "Users can only see their own data"
ON projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only update their own data"
ON projects FOR UPDATE
USING (auth.uid() = user_id);
```

#### Permission Matrix
```typescript
const PERMISSIONS = {
  'read:own_profile': ['user', 'premium', 'admin'],
  'write:own_profile': ['user', 'premium', 'admin'],
  'read:any_profile': ['admin'],
  'write:any_profile': ['admin'],
  'use:ai_features': ['premium', 'admin'],
  'access:hack_lab': ['user', 'premium', 'admin'],
  'manage:users': ['admin'],
  'view:analytics': ['premium', 'admin'],
}
```

---

## Secrets Management

### Strategy Overview

**Primary:** HashiCorp Vault (self-hosted or HCP Vault)  
**Backup:** GitHub Secrets + Environment Variables (encrypted at rest)

### Secret Classification

#### Tier 1: Critical Secrets (Vault + HSM)
- Database credentials
- API keys for payment processors
- Encryption keys for PII
- OAuth client secrets
- Signing keys for JWT

#### Tier 2: Sensitive Secrets (Vault)
- Third-party API keys (OpenAI, GitHub)
- Email service credentials
- Monitoring service tokens
- CI/CD tokens

#### Tier 3: Configuration (Environment Variables)
- Feature flags
- Non-sensitive URLs
- Public API endpoints
- Log levels

### Vault Architecture

```
┌─────────────────────────────────────────────┐
│            HashiCorp Vault                   │
│                                              │
│  ┌────────────────────────────────────┐    │
│  │  Key-Value Secrets Engine          │    │
│  │  - Database credentials            │    │
│  │  - API keys                        │    │
│  └────────────────────────────────────┘    │
│                                              │
│  ┌────────────────────────────────────┐    │
│  │  Dynamic Secrets Engine            │    │
│  │  - PostgreSQL (rotated hourly)     │    │
│  │  - AWS credentials (temporary)     │    │
│  └────────────────────────────────────┘    │
│                                              │
│  ┌────────────────────────────────────┐    │
│  │  Transit Engine (Encryption)       │    │
│  │  - Encrypt/decrypt PII             │    │
│  │  - Sign/verify tokens              │    │
│  └────────────────────────────────────┘    │
│                                              │
│  ┌────────────────────────────────────┐    │
│  │  PKI Engine                        │    │
│  │  - Issue TLS certificates          │    │
│  │  - Service-to-service mTLS         │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Secret Rotation Policy

| Secret Type | Rotation Frequency | Automated | Grace Period |
|-------------|-------------------|-----------|--------------|
| Database Passwords | Daily | Yes | 1 hour |
| API Keys (critical) | 30 days | Yes | 7 days |
| OAuth Secrets | 90 days | Manual | 14 days |
| JWT Signing Keys | 90 days | Yes | 30 days |
| Encryption Keys | 1 year | Yes | 90 days |
| TLS Certificates | 90 days | Yes | 30 days |

### Access Control

```typescript
// Vault policy for application
path "secret/data/nexus/prod/*" {
  capabilities = ["read"]
}

path "database/creds/nexus-app" {
  capabilities = ["read"]
}

path "transit/encrypt/nexus-pii" {
  capabilities = ["update"]
}

path "transit/decrypt/nexus-pii" {
  capabilities = ["update"]
}
```

### Emergency Procedures

#### Break-Glass Scenario
1. **Detection:** Vault unavailable or compromised
2. **Failover:** Switch to encrypted backup secrets in AWS Secrets Manager
3. **Alert:** Page on-call security team immediately
4. **Audit:** Log all secret accesses during incident
5. **Recovery:** Rotate all secrets after Vault restoration

---

## Data Protection

### Encryption Standards

#### Data at Rest
- **Algorithm:** AES-256-GCM
- **Key Management:** AWS KMS or Vault Transit Engine
- **Scope:**
  - All database columns containing PII
  - File uploads in S3
  - Backup archives
  - Log files containing sensitive data

#### Data in Transit
- **TLS 1.3** for all connections
- **Certificate Pinning** for mobile apps
- **mTLS** for service-to-service communication

### PII Protection

```typescript
// Automatic PII detection and encryption
interface PIIField {
  email: string;        // Encrypted + hashed for lookup
  phone: string;        // Encrypted
  ssn: string;          // Encrypted + redacted in logs
  address: string;      // Encrypted
  creditCard: string;   // Tokenized (never stored)
}

// Field-level encryption
const encryptedData = await vault.encrypt('transit/nexus-pii', {
  plaintext: Buffer.from(sensitiveData).toString('base64')
});
```

### Data Minimization
- Collect only necessary data
- Automatic deletion after retention period
- Pseudonymization where possible
- Data masking in non-production environments

### Compliance

| Regulation | Status | Controls |
|------------|--------|----------|
| GDPR | Planned | Data portability, right to erasure, consent management |
| CCPA | Planned | Data sale opt-out, data access requests |
| SOC 2 | Planned | Access controls, encryption, monitoring |
| ISO 27001 | Future | ISMS, risk management, security policies |

---

## Security Monitoring

### Logging Strategy

#### Log Levels
```typescript
const LOG_LEVELS = {
  ERROR: 'Critical failures requiring immediate attention',
  WARN: 'Potential security issues',
  INFO: 'Normal operations',
  DEBUG: 'Detailed troubleshooting (dev only)',
  AUDIT: 'Security-relevant events (always logged)'
}
```

#### Audit Events
- Authentication attempts (success/failure)
- Authorization decisions
- Data access (read/write PII)
- Configuration changes
- Admin actions
- API key usage
- Rate limit violations
- Suspicious activities

#### Log Format (Structured JSON)
```json
{
  "timestamp": "2026-01-18T12:00:00.000Z",
  "level": "AUDIT",
  "event_type": "authentication",
  "event_action": "login_success",
  "user_id": "user_123",
  "session_id": "sess_abc",
  "ip_address": "203.0.113.1",
  "user_agent": "Mozilla/5.0...",
  "geolocation": { "country": "US", "city": "San Francisco" },
  "mfa_verified": true,
  "request_id": "req_xyz",
  "response_time_ms": 45
}
```

### Monitoring Stack

```
┌──────────────────────────────────────────────────┐
│                Application                        │
│  ┌────────────────────────────────────────────┐ │
│  │ Next.js + OpenTelemetry SDK                │ │
│  └─────────────────┬──────────────────────────┘ │
└────────────────────┼───────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│              Collection Layer                     │
│  ┌────────────────────────────────────────────┐ │
│  │ Vector.dev (Log Aggregation)               │ │
│  │ OpenTelemetry Collector (Traces/Metrics)   │ │
│  └─────────────────┬──────────────────────────┘ │
└────────────────────┼───────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌────────────┐ ┌──────────┐ ┌─────────────┐
│   Logs     │ │  Traces  │ │   Metrics   │
│            │ │          │ │             │
│ Loki       │ │ Tempo    │ │ Prometheus  │
│ (Grafana)  │ │(Grafana) │ │  (Grafana)  │
└──────┬─────┘ └────┬─────┘ └──────┬──────┘
       │            │               │
       └────────────┼───────────────┘
                    ▼
          ┌──────────────────┐
          │   Grafana        │
          │  (Visualization) │
          └──────────────────┘
```

### Alert Rules

#### Critical Alerts (Page Immediately)
```yaml
- alert: DatabaseDown
  expr: up{job="postgresql"} == 0
  for: 1m
  
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 5m

- alert: BruteForceDetected
  expr: rate(failed_login_attempts[5m]) > 10
  for: 2m

- alert: DataExfiltration
  expr: rate(data_egress_bytes[5m]) > 1000000000  # 1GB/5min
  for: 5m
```

#### Warning Alerts (Slack Notification)
```yaml
- alert: HighLatency
  expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
  for: 10m

- alert: RateLimitThresholdReached
  expr: rate_limit_hits > 80_percent_of_limit
  for: 15m

- alert: DiskSpaceRunningLow
  expr: disk_free_percent < 20
  for: 30m
```

### Security Dashboards

#### 1. Real-Time Security Dashboard
- Authentication success/failure rate
- Active sessions map (geolocation)
- Rate limit violations
- Bot detection metrics
- API error rates by endpoint

#### 2. Threat Intelligence Dashboard
- IP reputation scores
- Known attack patterns detected
- CVE exposure monitoring
- Dependency vulnerabilities

#### 3. Compliance Dashboard
- Audit log completeness
- Encryption coverage
- Access reviews status
- Data retention compliance

---

## Incident Response

### Incident Classification

| Severity | Description | Response Time | Escalation |
|----------|-------------|---------------|------------|
| P0 - Critical | Data breach, service down | 15 minutes | CEO, CISO |
| P1 - High | Security vulnerability exploited | 1 hour | CISO, CTO |
| P2 - Medium | Potential security issue | 4 hours | Security Team |
| P3 - Low | Minor issue, no immediate threat | 24 hours | On-call Engineer |

### Incident Response Playbooks

#### 1. Data Breach Response
```
1. Detect & Contain (0-1 hour)
   - Isolate affected systems
   - Preserve evidence (logs, snapshots)
   - Block attacker IP/accounts
   
2. Investigate (1-4 hours)
   - Determine scope of breach
   - Identify compromised data
   - Root cause analysis
   
3. Remediate (4-24 hours)
   - Patch vulnerabilities
   - Rotate all secrets
   - Reset affected user sessions
   
4. Communicate (24-48 hours)
   - Notify affected users
   - Regulatory reporting (if required)
   - Public disclosure (if necessary)
   
5. Post-Incident (1 week)
   - Full incident report
   - Update security controls
   - Team training
```

#### 2. DDoS Attack Response
```
1. Detection (automated)
   - Cloudflare alerts on traffic spike
   
2. Mitigation (automated)
   - Enable "Under Attack" mode
   - Activate rate limiting rules
   - Challenge suspicious requests
   
3. Analysis (manual)
   - Identify attack vectors
   - Block malicious patterns
   
4. Recovery
   - Monitor for follow-up attacks
   - Adjust WAF rules
```

#### 3. Compromised Credentials
```
1. Immediate Actions
   - Revoke all tokens for affected user
   - Force password reset
   - Lock account temporarily
   
2. Investigation
   - Check for unauthorized access
   - Review audit logs for suspicious activity
   - Identify other affected accounts
   
3. User Communication
   - Email notification
   - SMS alert (if available)
   - Security recommendations
```

### Security Tools Inventory

| Category | Tool | Purpose |
|----------|------|---------|
| SIEM | Grafana + Loki | Log aggregation and analysis |
| Vulnerability Scanning | Snyk, Dependabot | Dependency vulnerabilities |
| Container Security | Trivy | Container image scanning |
| Secret Scanning | GitGuardian | Prevent secret leaks |
| Penetration Testing | Burp Suite, OWASP ZAP | Manual security testing |
| Bug Bounty | HackerOne | Crowdsourced security testing |

---

## Appendix

### Security Checklist

- [ ] All secrets stored in Vault
- [ ] Database uses RLS policies
- [ ] API routes have rate limiting
- [ ] All endpoints require authentication (except public)
- [ ] HTTPS enforced everywhere
- [ ] Security headers configured
- [ ] Audit logging enabled
- [ ] Monitoring dashboards created
- [ ] Incident response playbooks documented
- [ ] Regular security training scheduled
- [ ] Backup and recovery tested
- [ ] Disaster recovery plan documented

### References

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- CIS Controls: https://www.cisecurity.org/controls
- Zero Trust Architecture: NIST SP 800-207

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-18 | CISO | Initial security architecture |
