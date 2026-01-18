# Monitoring & Observability Stack

**Document Owner:** DevOps Lead  
**Last Updated:** 2026-01-18

## Overview

This document describes the comprehensive monitoring, logging, and observability stack for the NEXUS platform implementing the "three pillars of observability": Logs, Metrics, and Traces.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Applications                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Next.js App + OpenTelemetry SDK                        │ │
│  │ - Logs (console, structured JSON)                      │ │
│  │ - Metrics (counters, gauges, histograms)              │ │
│  │ - Traces (spans, baggage, context)                    │ │
│  └─────────────────┬──────────────────────────────────────┘ │
└────────────────────┼─────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Collection & Processing                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ OpenTelemetry Collector                                │ │
│  │ - Receives telemetry data                              │ │
│  │ - Processes and transforms                             │ │
│  │ - Routes to backends                                   │ │
│  └──────┬───────────────────┬──────────────────┬──────────┘ │
└─────────┼───────────────────┼──────────────────┼────────────┘
          │                   │                  │
          ▼                   ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Grafana    │   │   Grafana    │   │  Prometheus  │
│     Loki     │   │     Tempo    │   │              │
│   (Logs)     │   │   (Traces)   │   │  (Metrics)   │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                   │
       └──────────────────┼───────────────────┘
                          ▼
                 ┌──────────────────┐
                 │     Grafana      │
                 │  (Visualization) │
                 └──────────────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │   Alertmanager   │
                 │  (Alerting)      │
                 └──────────────────┘
```

---

## 1. Logging (Grafana Loki)

### Log Levels
```typescript
enum LogLevel {
  ERROR = 'error',    // Critical failures requiring immediate attention
  WARN = 'warn',      // Potential issues that should be investigated
  INFO = 'info',      // Normal operational messages
  DEBUG = 'debug',    // Detailed diagnostic information (dev/staging only)
  AUDIT = 'audit',    // Security-relevant events (always logged)
}
```

### Structured Logging Format
```typescript
interface LogEntry {
  timestamp: string;        // ISO 8601 format
  level: LogLevel;
  message: string;
  service: string;          // 'nexus-web', 'nexus-api', etc.
  environment: string;      // 'production', 'staging', 'development'
  
  // Request context
  request_id?: string;      // Unique request identifier
  user_id?: string;         // Authenticated user ID
  session_id?: string;      // Session identifier
  ip_address?: string;      // Client IP
  
  // Performance
  duration_ms?: number;     // Request/operation duration
  
  // Error context
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  
  // Additional context
  metadata?: Record<string, any>;
}
```

### Example Implementation
```typescript
// lib/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'nexus-platform',
    environment: process.env.NODE_ENV,
  },
});

export default logger;

// Usage
logger.info({ request_id: '123', user_id: 'user_456' }, 'User logged in');
logger.error({ error: err, user_id: 'user_456' }, 'Payment processing failed');
```

### Log Queries (LogQL)
```logql
# Find all errors in last hour
{service="nexus-platform", level="error"} |= "" | json

# Find slow requests (>1s)
{service="nexus-platform"} | json | duration_ms > 1000

# Failed authentication attempts
{service="nexus-platform", level="audit"} |= "authentication_failed"

# Rate limit violations by IP
{service="nexus-platform"} |= "rate_limit_exceeded" | json | count_over_time(ip_address[5m])

# Search for specific user activity
{service="nexus-platform"} | json | user_id="user_123"
```

---

## 2. Metrics (Prometheus)

### Core Metrics

#### HTTP Metrics
```typescript
// Request counter
http_requests_total{
  method="GET",
  path="/api/projects",
  status="200",
  environment="production"
}

// Request duration histogram
http_request_duration_seconds{
  method="POST",
  path="/api/projects",
  quantile="0.95"
}

// Active connections gauge
http_active_connections{
  environment="production"
}
```

#### Application Metrics
```typescript
// User registrations
user_registrations_total{environment="production"}

// AI API calls
ai_api_calls_total{
  operation="resume_generation",
  status="success"
}

// Database connection pool
database_connections{
  state="active",
  pool="main"
}

// Cache hit rate
cache_hits_total{cache="redis"}
cache_misses_total{cache="redis"}
```

#### Business Metrics
```typescript
// Revenue tracking
revenue_total{
  plan="premium",
  currency="USD"
}

// Feature usage
feature_usage_total{
  feature="ai_resume_generator",
  user_tier="premium"
}

// Conversion funnel
funnel_events_total{
  stage="signup_started",
  source="landing_page"
}
```

### Prometheus Queries (PromQL)
```promql
# Error rate (%) over 5 minutes
100 * (
  rate(http_requests_total{status=~"5.."}[5m])
  /
  rate(http_requests_total[5m])
)

# p95 latency
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m])
)

# Request rate per second
rate(http_requests_total[1m])

# Cache hit ratio
sum(rate(cache_hits_total[5m])) 
/ 
(sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))

# Active users (unique sessions in last 5m)
count(
  count by (session_id) (
    http_requests_total{path!="/api/health"}
  )
)
```

---

## 3. Distributed Tracing (Grafana Tempo)

### Trace Context
```typescript
interface Span {
  trace_id: string;         // Unique trace identifier
  span_id: string;          // Unique span identifier
  parent_span_id?: string;  // Parent span (if nested)
  name: string;             // Operation name
  kind: 'SERVER' | 'CLIENT' | 'INTERNAL';
  start_time: number;       // Unix timestamp (nanoseconds)
  end_time: number;
  status: 'OK' | 'ERROR';
  
  attributes: {
    'http.method'?: string;
    'http.url'?: string;
    'http.status_code'?: number;
    'db.statement'?: string;
    'user.id'?: string;
  };
  
  events?: Array<{
    name: string;
    timestamp: number;
    attributes: Record<string, any>;
  }>;
}
```

### OpenTelemetry Setup
```typescript
// lib/telemetry.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'nexus-platform',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().then(
    () => console.log('Tracing terminated'),
    (err) => console.log('Error terminating tracing', err)
  );
});
```

### Manual Instrumentation
```typescript
// app/api/projects/route.ts
import { trace } from '@opentelemetry/api';

export async function POST(request: Request) {
  const tracer = trace.getTracer('nexus-api');
  
  return await tracer.startActiveSpan('create_project', async (span) => {
    try {
      span.setAttribute('user.id', userId);
      span.setAttribute('project.title', title);
      
      // Database operation
      const project = await tracer.startActiveSpan('db.insert_project', async (dbSpan) => {
        dbSpan.setAttribute('db.system', 'postgresql');
        dbSpan.setAttribute('db.statement', 'INSERT INTO projects...');
        
        const result = await db.projects.create({ ... });
        
        dbSpan.end();
        return result;
      });
      
      // AI operation
      await tracer.startActiveSpan('ai.generate_thumbnail', async (aiSpan) => {
        aiSpan.setAttribute('ai.model', 'dall-e-3');
        
        await generateThumbnail(project.id);
        
        aiSpan.end();
      });
      
      span.setStatus({ code: 0 }); // OK
      span.end();
      
      return Response.json({ project });
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message }); // ERROR
      span.end();
      
      throw error;
    }
  });
}
```

---

## 4. Dashboards

### 1. Overview Dashboard
```yaml
Panels:
  - Request Rate (req/s)
  - Error Rate (%)
  - p50, p95, p99 Latency
  - Active Users
  - Database Connections
  - Cache Hit Rate
  - Deployment Timeline
```

### 2. Application Performance Dashboard
```yaml
Panels:
  - API Endpoint Performance (heatmap)
  - Slow Queries (>1s)
  - Background Job Queue Length
  - Memory Usage
  - CPU Usage
  - Network I/O
```

### 3. Business Metrics Dashboard
```yaml
Panels:
  - New User Registrations (time series)
  - Active Users (daily/weekly/monthly)
  - Revenue (MRR, ARR)
  - Feature Adoption Rates
  - Conversion Funnel
  - Churn Rate
```

### 4. Security Dashboard
```yaml
Panels:
  - Failed Login Attempts
  - Rate Limit Violations
  - Suspicious IP Addresses
  - API Key Usage
  - Anomaly Detection Alerts
  - Data Exfiltration Monitoring
```

### 5. Infrastructure Dashboard
```yaml
Panels:
  - Server Health (CPU, Memory, Disk)
  - Database Performance
  - Cache Performance
  - CDN Hit Rate
  - SSL Certificate Expiry
  - Backup Status
```

---

## 5. Alerting Rules

### Critical Alerts (Page Immediately)
```yaml
# High error rate
- alert: HighErrorRate
  expr: |
    100 * (
      rate(http_requests_total{status=~"5.."}[5m])
      /
      rate(http_requests_total[5m])
    ) > 5
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }}% (threshold: 5%)"

# Database down
- alert: DatabaseDown
  expr: up{job="postgresql"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Database is down"

# API latency
- alert: HighLatency
  expr: |
    histogram_quantile(0.95,
      rate(http_request_duration_seconds_bucket[5m])
    ) > 2
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "API latency is too high"
    description: "p95 latency is {{ $value }}s"

# Disk space
- alert: DiskSpaceLow
  expr: |
    (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Disk space is running low"

# SSL expiring
- alert: SSLCertificateExpiring
  expr: |
    (ssl_certificate_expiry_seconds - time()) / 86400 < 7
  for: 1h
  labels:
    severity: critical
  annotations:
    summary: "SSL certificate expires in {{ $value }} days"
```

### Warning Alerts (Slack Notification)
```yaml
# Elevated error rate
- alert: ElevatedErrorRate
  expr: |
    100 * (
      rate(http_requests_total{status=~"5.."}[5m])
      /
      rate(http_requests_total[5m])
    ) > 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Error rate is elevated"

# High memory usage
- alert: HighMemoryUsage
  expr: |
    (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
    / node_memory_MemTotal_bytes * 100 > 80
  for: 10m
  labels:
    severity: warning

# Backup failed
- alert: BackupFailed
  expr: |
    time() - backup_last_success_timestamp > 86400
  for: 1h
  labels:
    severity: warning
```

---

## 6. SLI/SLO Monitoring

### Service Level Indicators (SLIs)
```yaml
Availability:
  - Metric: up{job="nexus-platform"}
  - Target: 99.9%
  - Measurement: Percentage of successful health checks

Latency:
  - Metric: histogram_quantile(0.95, http_request_duration_seconds)
  - Target: p95 < 500ms
  - Measurement: 95th percentile response time

Error Rate:
  - Metric: rate(http_requests_total{status=~"5.."}[5m])
  - Target: < 0.1%
  - Measurement: Percentage of 5xx errors

Throughput:
  - Metric: rate(http_requests_total[1m])
  - Target: > 100 req/s
  - Measurement: Requests per second
```

### Error Budget
```yaml
Monthly Availability Target: 99.9%
Allowed Downtime: 43.2 minutes/month

Error Budget Burn Rate Alerts:
  - Fast Burn (2h): 14.4x normal rate
  - Slow Burn (24h): 6x normal rate

Actions When Budget Exhausted:
  - Pause non-critical deployments
  - Focus on reliability
  - Conduct incident review
```

---

## 7. Log Retention

```yaml
Production Logs:
  - Hot tier: 7 days (Loki)
  - Warm tier: 30 days (S3)
  - Cold tier: 1 year (S3 Glacier)
  - Compliance logs: 7 years (S3 Glacier Deep Archive)

Metrics:
  - Raw: 15 days (Prometheus)
  - Aggregated (5m): 90 days
  - Aggregated (1h): 1 year

Traces:
  - Sampled: 7 days (Tempo)
  - Full traces for errors: 30 days
```

---

## 8. Monitoring Tools

### Stack Components
| Component | Tool | Purpose |
|-----------|------|---------|
| Logs | Grafana Loki | Log aggregation and querying |
| Metrics | Prometheus | Time-series metrics storage |
| Traces | Grafana Tempo | Distributed tracing |
| Visualization | Grafana | Unified dashboard |
| Alerting | Alertmanager | Alert routing and deduplication |
| Collection | OpenTelemetry | Telemetry collection |
| Uptime | Better Uptime | External monitoring |

### Access & Setup
```bash
# Grafana
URL: https://monitoring.nexus-platform.com
Auth: SSO (GitHub/Google)
MFA: Required

# Prometheus
URL: https://prometheus.nexus-platform.com
Auth: Basic Auth + IP Whitelist

# Alert destinations
- PagerDuty: Critical alerts
- Slack: #alerts channel
- Email: ops-team@nexus-platform.com
```

---

## 9. Runbooks

### High Error Rate
```markdown
1. Check Grafana error dashboard
2. Identify affected endpoints
3. Review recent deployments
4. Check error logs in Loki
5. Investigate traces for failed requests
6. Rollback if needed
7. Create post-mortem
```

### High Latency
```markdown
1. Identify slow endpoints
2. Check database query performance
3. Review cache hit rates
4. Analyze trace flamegraphs
5. Check external API latency
6. Scale resources if needed
7. Optimize queries/code
```

### Database Issues
```markdown
1. Check connection pool metrics
2. Review slow query log
3. Check replication lag
4. Monitor disk I/O
5. Investigate long-running queries
6. Consider read replica failover
7. Optimize/kill problematic queries
```

---

## 10. Best Practices

### Logging
✅ Use structured logging (JSON)  
✅ Include request context (ID, user, session)  
✅ Log at appropriate levels  
✅ Redact sensitive data (passwords, tokens)  
✅ Use correlation IDs across services  
❌ Don't log excessively in hot paths  
❌ Don't log PII without encryption  

### Metrics
✅ Use meaningful metric names  
✅ Include relevant labels (but not too many)  
✅ Use histograms for latency  
✅ Use counters for events  
✅ Use gauges for current values  
❌ Don't create high-cardinality metrics  
❌ Don't include timestamps in labels  

### Tracing
✅ Propagate context across boundaries  
✅ Add meaningful span attributes  
✅ Sample intelligently (100% for errors)  
✅ Keep spans focused and concise  
❌ Don't create too many spans  
❌ Don't add sensitive data to attributes  

---

**Document Version:** 1.0  
**Next Review:** 2026-04-18
