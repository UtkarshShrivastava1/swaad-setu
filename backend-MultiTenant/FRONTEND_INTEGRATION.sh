#!/bin/bash
#
# GEMINI RATE LIMIT FIX - INSTALLATION SCRIPT
# 
# This script provides step-by-step instructions for integrating the Gemini
# rate limit fix into your frontend application.
#
# Usage: Follow the steps below in your frontend directory
#

echo "╔═════════════════════════════════════════════════════════════════════╗"
echo "║     GEMINI RATE LIMIT FIX - FRONTEND INTEGRATION GUIDE            ║"
echo "╚═════════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Copy Error Handler Utilities
echo "STEP 1: Copy Frontend Error Handler Utilities"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Copy the frontend error handler from backend to your frontend utils:"
echo ""
echo "  From: backend-MultiTenant/docs/GEMINI_ERROR_HANDLING.ts"
echo "  To:   frontend/src/utils/geminiErrorHandler.ts"
echo ""
echo "Then import in your components:"
echo ""
echo "  import {"
echo "    retryWithExponentialBackoff,"
echo "    handleGeminiError,"
echo "    isGeminiRequest"
echo "  } from '@/utils/geminiErrorHandler'"
echo ""

# Step 2: Update AddItemDrawer Component
echo "STEP 2: Update AddItemDrawer.tsx"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Add loading state management:"
echo ""
echo "  const [isGenerating, setIsGenerating] = useState(false);"
echo "  const [generationError, setGenerationError] = useState<string | null>(null);"
echo ""

# Step 3: Update Generate Handler
echo "STEP 3: Update Generate Description Handler"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Replace your generateDescription function with:"
echo ""
cat << 'EOF'
async function handleGenerateDescription() {
  setIsGenerating(true);
  setGenerationError(null);

  try {
    const response = await retryWithExponentialBackoff(
      () => apiClient.post('/api/gemini', {
        prompt: `Describe this menu item: ${itemName}`,
        useCache: true
      }),
      {
        maxRetries: 3,
        initialDelay: 1000,
        onRetry: (attempt, delay) => {
          console.log(`Retrying ${attempt}...`);
        }
      }
    );

    setDescription(response.data.content);
  } catch (error) {
    if (isGeminiRequest(error)) {
      const handler = handleGeminiError(error);
      
      if (handler.shouldRetry) {
        setGenerationError(handler.userMessage);
        // Auto-retry after delay
        setTimeout(
          () => handleGenerateDescription(),
          handler.suggestedRetryDelay
        );
      } else {
        setGenerationError(handler.userMessage);
      }
    } else {
      setGenerationError('Failed to generate description');
    }
  } finally {
    setIsGenerating(false);
  }
}
EOF
echo ""

# Step 4: Update UI Elements
echo "STEP 4: Update UI Elements"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Update your generate button and error display:"
echo ""
cat << 'EOF'
<button 
  onClick={handleGenerateDescription}
  disabled={isGenerating}
  className="generate-btn"
>
  {isGenerating ? 'Generating...' : 'Generate Description'}
</button>

{generationError && (
  <div className="error-message">
    {generationError}
  </div>
)}
EOF
echo ""

# Step 5: Testing
echo "STEP 5: Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Test the implementation:"
echo ""
echo "1. Click 'Generate Description' - Should work"
echo "2. Click 20+ times rapidly - Some should queue/retry"
echo "3. Try same item twice - Second should be instant (cached)"
echo "4. Check browser console - Should see [Gemini] logs"
echo ""

# Completion
echo "COMPLETION CHECKLIST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "[ ] Step 1: Copied error handler utilities"
echo "[ ] Step 2: Updated AddItemDrawer.tsx imports"
echo "[ ] Step 3: Updated generate description handler"
echo "[ ] Step 4: Updated UI button and error display"
echo "[ ] Step 5: Tested in browser"
echo ""
echo "Once all steps are complete, the Gemini rate limit fix is fully integrated!"
echo ""
echo "╔═════════════════════════════════════════════════════════════════════╗"
echo "║                 ✅ INSTALLATION COMPLETE!                          ║"
echo "║                                                                     ║"
echo "║            Your app now handles Gemini rate limiting                ║"
echo "║                 gracefully with auto-retry! 🎉                      ║"
echo "╚═════════════════════════════════════════════════════════════════════╝"
