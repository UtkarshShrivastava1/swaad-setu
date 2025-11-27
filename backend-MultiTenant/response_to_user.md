The logs you provided conclusively confirm that the "Forbidden (cross-tenant)" error is occurring exactly as intended by the backend security logic.

Here's what the logs show:
*   **URL `rid` (from your request):** `'dominos-aadarsh-nagar-5635'`
*   **Token `restaurantId` (from the JWT you sent):** `'1111'`

Since `'dominos-aadarsh-nagar-5635'` is not equal to `'1111'`, the authentication middleware (`auth.middleware.js`) correctly identifies this as a tenant mismatch and returns a `403 Forbidden` error.

The backend code is correctly enforcing tenant isolation. It is protecting the data of tenant '1111' from being accessed by a request that claims to be for 'dominos-aadarsh-nagar-5635' but is sending a token belonging to '1111'.

**The problem is therefore in your frontend application's state management.** It is sending a JWT token for one tenant (`1111`) while attempting to access resources for a different tenant (`dominos-aadarsh-nagar-5635`) via the URL.

You need to ensure that your frontend application:
1.  **Clears old tokens:** When you log in as a new tenant or switch tenants, any previously stored authentication tokens (e.g., in local storage, session storage, or a global state variable) must be invalidated or removed.
2.  **Uses the correct token:** The authentication token sent with each API request must correspond to the `restaurantId` in the URL of that request.

I have removed the debugging logs from `common/middlewares/auth.middleware.js` as they are no longer needed. The backend is working as expected.