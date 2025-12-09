# Quick Reference - Gemini Rate Limit Implementation

## 📋 Files Created/Modified

### New Services (2)

```
services/gemini.service.js          → Retry + Cache logic
services/gemini.queue.js            → Request queueing (optional)
```

### New Middlewares (1)

```
common/middlewares/gemini.rateLimit.middleware.js  → Rate limiter
```

### New Routes (1)

```
routes/gemini.advanced.route.js     → Advanced queueing endpoint (optional)
```

### Modified Routes (1)

```
routes/gemini.route.js              → Uses new service + middleware
```

### Documentation (5)

```
docs/GEMINI_ERROR_HANDLING.ts       → Frontend utilities
docs/GEMINI_RATE_LIMIT_GUIDE.md     → Complete guide
docs/ARCHITECTURE.md                → System diagrams
GEMINI_IMPLEMENTATION.md            → Quick start
GEMINI_FIX_SUMMARY.md               → Summary
```

---

## 🚀 Quick Start

### Backend (Already Done ✅)

```bash
# All code is already in place
# No npm install needed (no new dependencies)
# Just restart your server

npm run dev    # Restarts development server
```

### Frontend (TODO)

```bash
# 1. Copy error handler to frontend utils
cp docs/GEMINI_ERROR_HANDLING.ts ../frontend/src/utils/

# 2. Update AddItemDrawer.tsx component (see examples below)
```

---

## 📝 Code Examples

### Frontend: Basic Usage

```typescript
import { retryWithExponentialBackoff } from "@/utils/geminiErrorHandler";

async function generateDescription(prompt: string) {
  try {
    const response = await retryWithExponentialBackoff(
      () => apiClient.post("/api/gemini", { prompt, useCache: true }),
      { maxRetries: 3, initialDelay: 1000 }
    );
    return response.data.content;
  } catch (error) {
    console.error("Failed to generate:", error.message);
  }
}
```

### Frontend: With Error Handling

```typescript
import { handleGeminiError, isGeminiRequest } from "@/utils/geminiErrorHandler";

try {
  const response = await apiClient.post("/api/gemini", { prompt });
  setDescription(response.data.content);
} catch (error) {
  if (isGeminiRequest(error)) {
    const handler = handleGeminiError(error);

    if (handler.shouldRetry) {
      showToast.info(handler.userMessage);
      // Auto-retry after delay
      setTimeout(
        () => generateDescription(prompt),
        handler.suggestedRetryDelay
      );
    } else {
      showToast.error(handler.userMessage);
    }
  }
}
```

### Frontend: With Loading State

```typescript
const [isGenerating, setIsGenerating] = useState(false);
const [error, setError] = useState<string | null>(null);

async function handleGenerateDescription() {
  setIsGenerating(true);
  setError(null);

  try {
    const description = await generateDescription(prompt);
    setDescription(description);
  } catch (error) {
    if (error?.response?.status === 429) {
      setError("Service busy. Retrying automatically...");
    } else {
      setError("Failed to generate description.");
    }
  } finally {
    setIsGenerating(false);
  }
}

return (
  <>
    <button onClick={handleGenerateDescription} disabled={isGenerating}>
      {isGenerating ? "Generating..." : "Generate Description"}
    </button>
    {error && <div className="error">{error}</div>}
  </>
);
```

---

## 🧪 Testing Commands

### Test Rate Limiting

```bash
# Send 25 requests rapidly (limit is 20/min)
for i in {1..25}; do
  curl -X POST http://localhost:5000/api/gemini \
    -H "Content-Type: application/json" \
    -d '{"prompt":"Test '$i'"}' &
done

# Expected: First 20 succeed, remaining 5 get 429
```

### Test Caching

```bash
# Same prompt twice
curl -X POST http://localhost:5000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Butter Chicken"}'
# Response: "cached": false

curl -X POST http://localhost:5000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Butter Chicken"}'
# Response: "cached": true
```

### Test Retries

```bash
# Disable Gemini API
# Send request - watch logs for retries
# Re-enable API - request succeeds

# In logs you should see:
# [Gemini] Error on attempt 1: 429 Too Many Requests
# [Gemini] Retrying in 2345ms...
# [Gemini] Success on attempt 2
```

---

## 🔧 Configuration

### Rate Limit (requests per minute)

**File**: `common/middlewares/gemini.rateLimit.middleware.js`

```javascript
max: 20,  // Change this number
```

**Recommended values**:

- Conservative: `10` (for limited quota)
- Default: `20` (recommended)
- Aggressive: `30` (for high quota)

### Retry Attempts

**File**: `services/gemini.service.js`

```javascript
maxRetries = 3; // Change this number
```

**Recommended values**:

- Low: `2` (fast fail)
- Default: `3` (recommended)
- High: `5` (aggressive retry)

### Cache TTL

**File**: `services/gemini.service.js`

```javascript
stdTTL: 86400; // 24 hours in seconds
```

**Examples**:

- `3600` = 1 hour
- `86400` = 24 hours (recommended)
- `604800` = 7 days

### Disable Cache

```javascript
// On specific request
await generateContent(prompt, { useCache: false });

// Or modify service default
```

---

## 📊 Monitoring

### Check Cache Stats

```javascript
// In any route or middleware
const { getCacheStats } = require("./services/gemini.service");
const stats = getCacheStats();
console.log(stats);
// { hits: 100, misses: 50, ksize: 25, vsize: 3500 }
```

### Monitor Queue Status (if using advanced)

```javascript
const { geminiQueue } = require("./services/gemini.queue");
const status = geminiQueue.getStatus("tenant-123");
console.log(status);
// { queueLength: 5, isProcessing: true, estimatedWaitTime: 10 }
```

### View Request Rate

```
Check headers in response:
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1702145670
```

---

## 🐛 Troubleshooting

### Problem: Still getting 429 errors

```
Cause: Rate limit is too high
Solution: Lower max in middleware
  max: 20  →  max: 10
```

### Problem: Slow responses

```
Cause: Low cache hit rate
Solution:
  1. Check if prompts are too varied
  2. Standardize prompt format
  3. Pre-generate common descriptions
```

### Problem: "Gemini API key not configured"

```
Solution: Set environment variable
export GOOGLE_GENERATIVE_AI_API_KEY="your-key-here"
# Or add to .env file
```

### Problem: Queue not processing

```
Solution:
  1. Check Gemini API status
  2. Clear queue: geminiQueue.clearAll()
  3. Check logs for detailed error
  4. Restart server
```

---

## 📚 Documentation Files

| File                              | Read For          |
| --------------------------------- | ----------------- |
| `GEMINI_IMPLEMENTATION.md`        | Quick start guide |
| `GEMINI_FIX_SUMMARY.md`           | Executive summary |
| `docs/GEMINI_RATE_LIMIT_GUIDE.md` | Complete details  |
| `docs/ARCHITECTURE.md`            | System diagrams   |
| `docs/GEMINI_ERROR_HANDLING.ts`   | Frontend code     |

---

## ✅ Implementation Checklist

### Backend (Already Done)

- [x] Rate limiter middleware created
- [x] Service with retry + cache created
- [x] Queue system created
- [x] Gemini route updated
- [x] Documentation created

### Frontend (TODO)

- [ ] Copy error handler utilities
- [ ] Update AddItemDrawer.tsx
- [ ] Add loading states
- [ ] Add error messages
- [ ] Test in browser

### Testing (TODO)

- [ ] Test rate limiting locally
- [ ] Test caching behavior
- [ ] Test retry logic
- [ ] Monitor performance
- [ ] Check user feedback

### Deployment (TODO)

- [ ] Deploy to staging
- [ ] Run integration tests
- [ ] Monitor metrics
- [ ] Deploy to production
- [ ] Watch for errors

---

## 🎯 Success Criteria

After implementation, you should see:

✅ No more 429 errors in console  
✅ Descriptions generate within 2-5 seconds  
✅ Repeated descriptions instant (<100ms)  
✅ Automatic retry on errors  
✅ User-friendly error messages  
✅ Cache hit rate >60%

---

## 🔗 Quick Links

**Backend Code**:

- Rate Limiter: `common/middlewares/gemini.rateLimit.middleware.js`
- Service: `services/gemini.service.js`
- Route: `routes/gemini.route.js`

**Frontend Code**:

- Error Handler: `docs/GEMINI_ERROR_HANDLING.ts`

**Documentation**:

- Full Guide: `docs/GEMINI_RATE_LIMIT_GUIDE.md`
- Architecture: `docs/ARCHITECTURE.md`

---

## 💡 Pro Tips

### 1. Cache Hit Optimization

Same prompt = cache hit. Standardize your prompts:

```
// Bad (different each time)
`Describe ${itemName} with ingredients`
`Tell about ${itemName}`

// Good (consistent)
`Write a menu description for ${itemName}`
```

### 2. Batch Requests Wisely

Don't call all at once:

```
// Bad
Promise.all(items.map(item => generateDescription(item)))

// Good
for (const item of items) {
  await generateDescription(item);  // Sequential
  await sleep(500);  // Small delay
}
```

### 3. Monitor Cache Growth

Cache has no size limit. For millions of items:

```javascript
// Clear old cache periodically
setInterval(() => {
  geminiService.clearCache();
}, 7 * 24 * 60 * 60 * 1000); // Weekly
```

### 4. User Feedback

Always show something:

```
Generating... (loading)
Service busy, please wait... (429)
Failed, please try again (error)
Done! (success)
```

---

## 📞 Need Help?

1. **Check logs**: `npm run dev` shows all Gemini operations
2. **Read docs**: Each file has inline comments
3. **Test endpoints**: Use curl commands above
4. **Review code**: Well-commented, easy to follow

---

Last Updated: December 9, 2025
