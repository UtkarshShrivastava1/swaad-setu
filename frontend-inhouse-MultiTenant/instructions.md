
## Issue: GEMINI_API_KEY is not defined

The error message `installHook.js:1 GEMINI_API_KEY is not defined. Auto-description will not work.` indicates that the `GEMINI_API_KEY` environment variable is not set in your development environment. This key is likely required for a feature that generates descriptions automatically, possibly using the Google Gemini API.

### Solution: Set the GEMINI_API_KEY

To resolve this, you need to add your Gemini API key to your project's environment variables. For a Vite project, client-side environment variables must be prefixed with `VITE_`.

1.  **Open or Create `.env` file:**
    In the root of your `frontend-inhouse-MultiTenant` directory, open the `.env` file. If it doesn't exist, create a new file named `.env`.

2.  **Add the API Key:**
    Add the following line to your `.env` file, replacing `<YOUR_GEMINI_API_KEY_HERE>` with your actual Gemini API key:

    ```
    VITE_GEMINI_API_KEY=<YOUR_GEMINI_API_KEY_HERE>
    ```

    **Important Note:** Ensure there are no spaces around the `=` sign.

3.  **Restart Development Server:**
    After saving the `.env` file, you must restart your development server for the changes to take effect. If you're running `npm run dev`, stop it (`Ctrl+C`) and run it again.

By following these steps, the `GEMINI_API_KEY` will be available to your application, and the auto-description functionality should work as expected.
