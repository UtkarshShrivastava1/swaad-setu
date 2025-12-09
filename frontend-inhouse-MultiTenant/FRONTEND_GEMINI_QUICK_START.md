# Frontend Gemini Rate Limiting - Quick Start

## What's New?

Your frontend now handles Gemini API rate limiting gracefully:

- **No more HTTP 429 errors** - Requests are queued automatically
- **Fast responses** - 24-hour cache prevents redundant API calls
- **User-friendly feedback** - Clear messages about queue position and status
- **Multi-tenant support** - Each restaurant has isolated 20 req/min limit

## How It Works (In Plain English)

### Scenario 1: Single Description Generation

```
User clicks "Generate" button
↓
Checks cache first
↓
If cached: Shows result instantly (⚡ indicator)
If not cached: Calls API
↓
If successful: Shows description
If rate limited: Adds to queue, shows "Position: 3"
↓
When rate limit resets: Processes queue automatically
```

### Scenario 2: Bulk Generation (Many Items)

```
User generates 25 descriptions at once
↓
Manager sends first 20 immediately
↓
Rate limit reached (20/min)
↓
Remaining 5 items go to queue
↓
Queue shows: "5 items waiting... position 3/5"
↓
60 seconds later: Rate limit resets
↓
Queue auto-processes remaining items
↓
All 25 done, no user intervention needed
```

## UI Indicators

### While Generating

```
🔄 Generating description...
```

### Rate Limited & Queued

```
🔄 Your request is queued. You'll be notified when it's ready. (3 ahead)
```

### From Cache

```
⚡ Description loaded from cache
```

### Error

```
❌ Invalid request. Please describe the item manually.
```

## Quick Test

### Test 1: Click "Generate" once

**Expected**: Description appears (either from cache or new)

### Test 2: Click "Generate" rapidly 25 times

**Expected**:

- First 20 succeed quickly
- Next 5 show "Queued"
- After 60 seconds, queued items complete
- Check console: `[Gemini]` logs show rate limiting

### Test 3: Describe same item twice

**Expected**:

- First time: ~1-2 seconds
- Second time: Instant with "⚡ From cache"

## Console Logs

Open browser DevTools (F12) → Console tab

Look for logs starting with `[Gemini]`:

```
[Gemini] Cache HIT for prompt: "describe appetizer"
[Gemini] Request count for rid-123: 15/20 (5 remaining)
[Gemini] Rate limited for tenant: rid-123, retry after: 45s
[Gemini] Request queued for tenant: rid-123, queue size: 3
```

If you don't see these logs, check:

1. Console shows all message levels (not filtered to errors)
2. You're on the correct restaurant page

## Rate Limit Rules

- **Limit**: 20 requests per minute **per restaurant**
- **Window**: 60 seconds (rolling)
- **Per Tenant**: Restaurant A and Restaurant B have separate limits
- **Cache**: Prompt responses cached for 24 hours

Example:

```
Time 0:00 → Send request 1 (cache miss) ✓
Time 0:05 → Send request 2 (cache hit) ✓
...
Time 0:55 → Send request 20 ✓
Time 1:00 → Send request 21 → QUEUED (rate limited)
Time 1:00 → Window resets
Time 1:05 → Process queued request 21 ✓
```

## Error Messages & What They Mean

| Message                                        | Cause                                  | Solution                       |
| ---------------------------------------------- | -------------------------------------- | ------------------------------ |
| "🔄 Your request is queued..."                 | Rate limited, waiting for window reset | Wait, system will auto-process |
| "⏳ Restaurant is busy..."                     | Direct rate limit hit                  | Try again after X seconds      |
| "🔧 Google AI service temporarily unavailable" | Google API down                        | Try again in a few moments     |
| "❌ Invalid request..."                        | Bad prompt format                      | Describe manually              |
| "📡 Network error..."                          | No internet or CORS issue              | Check connection               |
| "❌ Authentication error..."                   | JWT token issue                        | Log out and back in            |

## Code Examples

### For Component Developers

If you're building a component that generates descriptions:

```typescript
import { generateContentWithRateLimit } from "@/api/gemini.api";
import { handleGeminiError } from "@/utils/geminiErrorHandler";

const myComponent = () => {
  const handleGenerate = async () => {
    const response = await generateContentWithRateLimit(restaurantId, itemName);

    if (response.success) {
      // Show the generated description
      console.log("Description:", response.content);

      // Optional: Show cache indicator
      if (response.fromCache) {
        console.log("This was from cache!");
      }
    } else {
      // Show user-friendly error
      const feedback = handleGeminiError(response);
      console.log(feedback.userMessage); // Show this to user

      // Optional: Offer retry
      if (feedback.isRetryable) {
        // Show retry button
      }
    }
  };
};
```

### For Bulk Operations

```typescript
import { useBulkGenerateDescriptions } from "@/pages/AdminDashboard/hooks/useBulkGenerateDescriptions";

const MyBulkComponent = () => {
  const { addItems, processQueue, getResults } =
    useBulkGenerateDescriptions(restaurantId);

  const handleBulkGenerate = async () => {
    // Add items to queue
    addItems(["Item 1", "Item 2", "Item 3", ...]);

    // Process with automatic rate limiting
    await processQueue();

    // Get results
    const results = getResults();
    console.log(results); // { "Item 1": "description 1", ... }
  };
};
```

## Troubleshooting

### "I don't see any [Gemini] logs"

1. Make sure console shows "All Levels" (not filtered)
2. Check DevTools → Console tab
3. If you see nothing, rate limiting might be working silently (cache hit)
4. Try with a new/random item name to force API call

### "Description generating but never shows"

1. Check browser console for errors
2. Look for `[Gemini]` logs with `Rate limited` messages
3. Wait 60 seconds for rate limit window reset
4. If still stuck, try refreshing page

### "Same description twice is slow both times"

1. Cache is per-prompt, not per-item name
2. "Paneer Butter Masala" and "paneer butter masala" are different (case-sensitive)
3. Check console: `[Gemini] Cache HIT` should appear on second call
4. If not, prompt text might be different

### "Getting '❌ Authentication error'"

1. **Cause**: JWT token expired or invalid
2. **Solution**: Log out and log back in
3. Check backend is running with JWT_SECRET configured
4. Check network tab for `401` or `403` errors

## Performance Tips

1. **Don't rapidly click generate**: Each click counts toward rate limit
2. **Let cache work**: Same description = instant response
3. **Use bulk when possible**: More efficient queue management
4. **Monitor queue size**: If queue > 20, might want to wait

## What's Different from Before?

| Before                         | After                           |
| ------------------------------ | ------------------------------- |
| HTTP 429 error on 21st request | Request queued silently         |
| No feedback on rate limiting   | Shows queue position            |
| Every description calls API    | 24h cache for duplicates        |
| UI broken on rate limit        | Seamless auto-processing        |
| Generic error messages         | Helpful, user-friendly feedback |
| No multi-tenant isolation      | Per-tenant rate limits          |

## Need Help?

1. Check browser console (`F12` → Console)
2. Look for `[Gemini]` or `[authMiddleware]` logs
3. See detailed docs: `FRONTEND_GEMINI_RATE_LIMITING.md`
4. Check backend status and JWT_SECRET is configured

---

**Last Updated**: December 9, 2025  
**Status**: Ready for Production  
**Backward Compatible**: Yes (no breaking changes)
