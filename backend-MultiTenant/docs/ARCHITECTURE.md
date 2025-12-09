# Gemini Rate Limit Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (React/Frontend)                       │
│  AddItemDrawer.tsx: "Generate Description" button clicked       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ POST /api/gemini
                 │ { prompt: "Butter Chicken", useCache: true }
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              LAYER 1: RATE LIMIT MIDDLEWARE                      │
│         gemini.rateLimit.middleware.js                           │
│                                                                   │
│  ✓ Per-tenant + IP rate limiter (20 req/min)                    │
│  ✓ Check: X-RateLimit-Limit, X-RateLimit-Remaining             │
│  ✗ 429: Too Many Requests → Return immediately                  │
│  ✓ Pass through: Continue to route                              │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                 ROUTE: POST /api/gemini                          │
│              gemini.route.js (updated)                           │
│                                                                   │
│  ✓ Validate prompt (not empty, string)                          │
│  ✓ Call: generateContent(prompt, { useCache: true })            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│          LAYER 3: RESPONSE CACHING                               │
│            gemini.service.js (SimpleCache)                       │
│                                                                   │
│  ✓ Cache key = MD5(prompt)                                      │
│  ✓ Check cache (24h TTL)                                        │
│  ✓ Cache HIT → Return cached content (100ms)                    │
│  ✗ Cache MISS → Continue to retry logic                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│        LAYER 2: EXPONENTIAL BACKOFF RETRY LOGIC                  │
│          generateContentWithRetry() in gemini.service.js         │
│                                                                   │
│  Attempt 1                                                       │
│  ├─ Call: model.generateContent(prompt)                         │
│  ├─ ✓ Success → Cache & return content                          │
│  ├─ ✗ 429 Rate Limited → Sleep 2-3s, retry                      │
│  ├─ ✗ 5xx Server Error → Sleep 2-3s, retry                      │
│  └─ ✗ 400/4xx Client Error → Throw immediately                  │
│                                                                   │
│  Attempt 2 (after 2-3s)                                          │
│  ├─ Retry...                                                     │
│  ├─ ✓ Success → Return content                                  │
│  ├─ ✗ 429/5xx → Sleep 4-6s, retry                               │
│  └─ ✗ 4xx → Throw immediately                                   │
│                                                                   │
│  Attempt 3 (after 4-6s)                                          │
│  ├─ Final attempt                                               │
│  ├─ ✓ Success → Return content                                  │
│  └─ ✗ Any error → Throw (max retries exceeded)                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              GEMINI API (Google)                                  │
│                                                                   │
│  Rate Limit: 60 requests/minute globally                        │
│                                                                   │
│  Responses:                                                      │
│  ✓ 200 OK → { content: "..." }                                  │
│  ✗ 429 → Rate limited (retry with backoff)                      │
│  ✗ 5xx → Server error (retry with backoff)                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              ROUTE RESPONSE                                      │
│          Return to client with JSON                              │
│                                                                   │
│  Success (200):                                                  │
│  {                                                               │
│    "content": "Tender chicken pieces in creamy sauce...",       │
│    "cached": false,                                             │
│    "timestamp": "2025-12-09T12:34:56Z"                          │
│  }                                                               │
│                                                                   │
│  Rate Limited (429):                                            │
│  {                                                               │
│    "error": "Rate limit exceeded",                              │
│    "retryAfter": 60,                                            │
│    "retryable": true                                            │
│  }                                                               │
│                                                                   │
│  Server Error (503):                                            │
│  {                                                               │
│    "error": "Service temporarily unavailable",                  │
│    "retryable": true                                            │
│  }                                                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              CLIENT ERROR HANDLING                               │
│      docs/GEMINI_ERROR_HANDLING.ts (Frontend utilities)          │
│                                                                   │
│  ✓ Cache hit → Show description instantly                       │
│  ✓ 200 Success → Show generated description                     │
│  ✗ 429 Rate Limited → Show "Service busy, retrying..."          │
│  ✗ 503 Server Down → Show "Service unavailable"                 │
│  ✗ Network Error → Show "Connection error"                      │
│                                                                   │
│  Retry Logic:                                                    │
│  → retryWithExponentialBackoff() handles retries               │
│  → Auto-retry with increasing delays                           │
│  → Max 3 attempts by default                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Decision Tree - What Happens?

```
┌─ Request arrives
│
├─ Rate Limiter Check
│  ├─ ✗ Exceeded limit (>20 req/min) → Return 429 immediately
│  └─ ✓ Within limit → Continue
│
├─ Validate Prompt
│  ├─ ✗ Invalid (empty, not string) → Return 400
│  └─ ✓ Valid → Continue
│
├─ Check Cache
│  ├─ ✓ Found & valid → Return cached result (100ms)
│  └─ ✗ Not found or expired → Continue
│
├─ Retry Loop (max 3 attempts)
│  │
│  ├─ Attempt 1
│  │  ├─ ✓ Success → Cache & return
│  │  ├─ ✗ 429/5xx → Wait 2-3s, retry
│  │  └─ ✗ 400/4xx → Throw error
│  │
│  ├─ Attempt 2 (after 2-3s)
│  │  ├─ ✓ Success → Cache & return
│  │  ├─ ✗ 429/5xx → Wait 4-6s, retry
│  │  └─ ✗ 400/4xx → Throw error
│  │
│  └─ Attempt 3 (after 4-6s)
│     ├─ ✓ Success → Cache & return
│     └─ ✗ Any error → Throw 429 or 503
│
└─ Return response to client
```

---

## Request Timeline Example

### Scenario: Generate 3 descriptions, cache hits for 2nd request

```
TIME    EVENT                                    LAYER
────────────────────────────────────────────────────────
T=0ms   Request 1: "Butter Chicken"             Client
        └─ Middleware check: OK (1/20)           Limiter
        └─ Cache check: MISS                     Cache
        └─ Gemini API call                       API
        └─ Attempt 1 success                     Retry

T=2500  Response 1: "Tender chicken in sauce"    Client
        └─ Cached for 24 hours

────────────────────────────────────────────────────────

T=3000  Request 2: "Butter Chicken"             Client
        └─ Middleware check: OK (2/20)           Limiter
        └─ Cache check: HIT ✓                    Cache
        └─ Return cached result immediately

T=3100  Response 2: "Tender chicken in sauce"    Client
        └─ Instant response! (<100ms)

────────────────────────────────────────────────────────

T=5000  Request 3: "Paneer Tikka"              Client
        └─ Middleware check: OK (3/20)           Limiter
        └─ Cache check: MISS                     Cache
        └─ Gemini API call                       API
        └─ Attempt 1: 429 Rate Limited
        └─ Wait 2-3s

T=7500  Attempt 2: Success ✓                    Retry
        └─ Cached for 24 hours

T=7600  Response 3: "Marinated paneer cubes"    Client
```

---

## Performance Comparison

### Before Implementation

```
Request 1: 0ms → 2000ms → 429 Error ✗
Request 2: 0ms → 2000ms → 429 Error ✗
Request 3: 0ms → 2000ms → 429 Error ✗

Total: 6000ms, 0 successes
User: See errors, frustrated
```

### After Implementation

```
Request 1: 0ms → 2500ms → Success ✓ (cached)
Request 2: 0ms → 100ms  → Success ✓ (cache hit)
Request 3: 0ms → 7500ms → Success ✓ (auto-retry)

Total: 10100ms, 3 successes
User: See results, happy
```

---

## Multi-Tenant Isolation

```
Tenant A (restaurant-1)
├─ Rate limit: 20 req/min
├─ Cache: Private (MD5 prompts)
└─ Queue: Separate queue per tenant

Tenant B (restaurant-2)
├─ Rate limit: 20 req/min (independent)
├─ Cache: Separate cache instance
└─ Queue: Separate queue per tenant

Tenant C (restaurant-3)
├─ Rate limit: 20 req/min (independent)
├─ Cache: Separate cache instance
└─ Queue: Separate queue per tenant

✓ No interference between tenants
✓ Each tenant has own resource limits
✓ Fair allocation
```

---

## Cache State Machine

```
                ┌─────────────────┐
                │   NO CACHE      │
                │   (First call)  │
                └────────┬────────┘
                         │
                         │ generateContent(prompt)
                         │
                ┌────────▼────────┐
                │  CALL GEMINI    │
                │  API            │
                └────────┬────────┘
                         │
                    ┌────┴────┐
                    │          │
              ✓ Success    ✗ Error
                    │          │
         ┌──────────▼──────┐   │
         │  STORE IN CACHE │   │
         │  (24h TTL)      │   │
         └──────────┬──────┘   │
                    │          │
          ┌─────────▼──────────▼──────┐
          │   SEND TO CLIENT          │
          │   "cached": true/false    │
          └──────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
   Next Same Prompt         Different Prompt
        │                       │
        ▼                       ▼
   ┌─────────────┐         ┌──────────────┐
   │CACHE HIT    │         │CACHE MISS    │
   │Return in    │         │Call Gemini   │
   │<100ms       │         │Cache result  │
   └─────────────┘         └──────────────┘
```

---

## Error Recovery Flow

```
Request → Rate Limiter → OK → Validation → OK → Cache → MISS
                                                         │
                                                         ▼
                                                    ┌─────────────┐
                                                    │  Attempt 1  │
                                                    └──────┬──────┘
                                                           │
                                    ┌──────────────┬───────┴────────┬───────────────┐
                                    │              │                │               │
                                  Success         429              5xx            4xx
                                    │           Rate Limit       Server Err    Client Err
                                    │              │                │               │
                                    ▼              ▼                ▼               ▼
                                ┌─────┐      ┌──────────┐     ┌──────────┐    ┌────────┐
                                │Cache│      │ Wait 2s  │     │ Wait 2s  │    │Throw   │
                                │      │      │ Retry    │     │ Retry    │    │Error   │
                                │      │      │ Attempt2 │     │ Attempt2 │    │        │
                                │      │      └──────────┘     └──────────┘    └────────┘
                                │      │           │                │
                                │      │      ┌────┴────┐      ┌────┴────┐
                                │      │      │          │      │          │
                                │      │    Success      429    Success    429
                                │      │      │          │      │          │
                                │      │      ▼          ▼      ▼          ▼
                                │      │    ┌──┐    ┌────────┐┌──┐   ┌────────┐
                                │      │    │✓ │    │Wait 4s ││✓ │   │Wait 4s │
                                │      │    │  │    │Attempt3││  │   │Attempt3│
                                │      │    └──┘    └────────┘└──┘   └────────┘
                                │      │                │
                                │      │           Success
                                │      │                │
                                ▼      ▼                ▼
                            ┌──────────────────────────────┐
                            │   Return to Client           │
                            │   { content: "...",          │
                            │     cached: true/false }     │
                            └──────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                         │
└─────────────────────────────────────────────────────────────┘

Backend Instance 1        Backend Instance 2        Backend Instance 3
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│              │          │              │          │              │
│ Gemini Route │          │ Gemini Route │          │ Gemini Route │
│              │          │              │          │              │
├──────────────┤          ├──────────────┤          ├──────────────┤
│              │          │              │          │              │
│ Rate Limiter │──┐       │ Rate Limiter │──┐       │ Rate Limiter │──┐
│ (per tenant) │  │       │ (per tenant) │  │       │ (per tenant) │  │
└──────────────┘  │       └──────────────┘  │       └──────────────┘  │
│              │  │       │              │  │       │              │  │
│ Cache (24h)  │  │       │ Cache (24h)  │  │       │ Cache (24h)  │  │
└──────────────┘  │       └──────────────┘  │       └──────────────┘  │
                  │                         │                         │
     ┌────────────┴─────────────┬───────────┴───────────┬─────────────┘
     │                          │                       │
     │ Each cache is local      │ Not shared            │ Not distributed
     │ 60-70% hit rate          │                       │
     │                          │                       │
     └──────────────┬───────────┴───────────┬───────────┘
                    │                       │
                    └──────────┬────────────┘
                               │
                    ┌──────────▼──────────┐
                    │                     │
                    │  Gemini API         │
                    │  (Global limit:     │
                    │   60 req/min)       │
                    │                     │
                    └─────────────────────┘

NOTE: Cache is per-instance (not distributed)
      This is OK because:
      - Each backend can generate descriptions
      - High hit rate within each instance
      - Simple, no Redis dependency
      - Works for multi-tenant setup
```

---

## Monitoring Dashboard (What to Watch)

```
GEMINI API MONITORING DASHBOARD
────────────────────────────────────────────────────────

Rate Limit Status
  ├─ Current: 15/20 requests (75% used)
  ├─ Reset in: 45 seconds
  └─ Tenant breakdown:
     ├─ restaurant-1: 8/20
     ├─ restaurant-2: 5/20
     └─ restaurant-3: 2/20

Cache Performance
  ├─ Hit rate: 68%
  ├─ Cache size: 150 entries
  ├─ Memory used: 2.3 MB
  └─ Most cached:
     ├─ "Butter Chicken" (24 hits)
     ├─ "Paneer Tikka" (18 hits)
     └─ "Samosa" (15 hits)

Retry Statistics
  ├─ Attempts:
  │  ├─ Success on attempt 1: 85%
  │  ├─ Success on attempt 2: 12%
  │  └─ Success on attempt 3: 3%
  ├─ 429 errors caught: 47
  ├─ Auto-recovered: 45/47 (96%)
  └─ User-visible failures: 2

Performance
  ├─ Cache hit latency: 95ms (avg)
  ├─ API call latency: 2.3s (avg)
  ├─ Retry success rate: 96%
  └─ User satisfaction: ⭐⭐⭐⭐⭐

Alerts
  ├─ ⚠️  High error rate (>10%) - Last 5 min: 0
  ├─ ⚠️  Rate limit exceeded - Last 5 min: 3 times
  └─ ✓ All systems normal
```
