# Scaling & Production Guide

## Horizontal Scaling Strategy

### 1. Backend API (`api` service)
- **Stateless design**: The API is completely stateless. Auth uses JWTs; no sessions are stored in memory.
- **Scaling**: Increase replica count in Docker Swarm / K8s / AWS ECS.
- **Load Balancing**: Put a load balancer (Nginx, ALB, Traefik) in front of the API instances.
- **Limit**: Database connection limits. Use connection pooling (PgBouncer) if scaling beyond ~50 instances.

### 2. Background Workers (`worker` service)
- **Decoupled**: Workers are separate from the API. They consume jobs from Redis.
- **Scaling**: Increase replica count to process more courses in parallel.
- **Concurrency**: Each worker instance processes jobs based on CPU cores. Adjust `concurrency` setting in `course.worker.js` if needed.
- **Rate Limits**: Be careful not to scale workers so high that they hit the Gemini/YouTube API rate limits.

### 3. Redis
- **Role**: Job queue (BullMQ), caching, rate limiting.
- **Scaling**:
  - Use a managed Redis (AWS ElastiCache, Redis Cloud) for high availability.
  - If memory fills up, upgrade instance size.
  - Redis Cluster is supported by BullMQ for massive scale.

### 4. Database (PostgreSQL)
- **Role**: Permanent data storage.
- **Scaling**:
  - Vertical scaling (bigger instance) is easiest first step.
  - Read Replicas: For heavy read traffic (dashboard/listing), configure Prisma to read from replicas.
  - Connection Pooling: Mandatory at scale. Use PgBouncer.

---

## Bottlenecks & Limits

### 1. External APIs (The Hard Limit)
- **Gemini AI**: Tier-based rate limits (RPM/TPM).
  - *Solution*: Use multiple API keys (rotating) or request quota increase. Implement exponential backoff (already in `ai.service.js`).
- **YouTube Data API**: Strict daily quota (10,000 units/day free).
  - *Solution*: Cache results heavily. Fallback to `search:` format without API call (implemented).

### 2. PDF Parsing
- **CPU Bound**: `pdf-parse` is CPU intensive.
- *Solution*: Run significantly more worker instances than API instances.

### 3. PDF Export
- **Memory Bound**: Generating large PDFs (`pdfkit`) consumes RAM.
- *Solution*: Export generation is currently synchronous in the API. Move export generation to a background job if PDFs become very large (>100 pages).

---

## Cost Control

1. **User Quotas**:
   - Strict token limits per user (stored in DB).
   - Prevents abuse of Gemini API.
2. **Rate Limiting**:
   - API rate limits (express-rate-limit) prevent DDoS.
   - Redis-backed rate limiting ensures limits persist across API replicas.
3. **Idempotency**:
   - Workers check `if (course.status === 'PUBLISHED')` before running. Saves tokens on retries.

---

## Failure Scenarios

| Scenario | Impact | Auto-Recovery? |
|----------|--------|----------------|
| **API Crash** | 500 errors for users | Yes (Docker restarts) |
| **Worker Crash** | Job stalls, retried later | Yes (BullMQ handles retry) |
| **Redis Down** | Queues/Cache fail, API 503 | No (Critical dependency) |
| **DB Down** | API 503 | No (Critical dependency) |
| **Gemini Down** | Course generation fails | Yes (Worker retries with backoff) |
