The logs you provided conclusively confirm that the "Forbidden (cross-tenant)" error is occurring exactly as intended by the backend security logic.

Here's what the logs show:
*   **URL `rid` (from your request):** `'dominos-aadarsh-nagar-5635'`
*   **Token `restaurantId` (from the JWT you sent):** `'1111'`

Since `'dominos-aadarsh-nagar-5635'` is not equal to `'1111'`, the authentication middleware (`auth.middleware.js`) correctly identifies this as a tenant mismatch and returns a `403 Forbidden` error.

The backend code is correctly enforcing tenant isolation. It is protecting the data of tenant '1111' from being accessed by a request that claims to be for 'dominos-aadarsh-nagar-5635' but is sending a token belonging to '1111'.

**Regarding your comment about "1111" being a PIN:**

Our investigation into the backend code (`controllers/admin.controller.js`, `common/libs/jwt.js`, and `models/admin.model.js`) confirms the following:
*   The `restaurantId` is explicitly a required, unique string field in the `Admin` database model, designed to identify a restaurant/tenant.
*   PINs are stored as *hashed* values in separate fields (`hashedPin`, `staffHashedPin`) and are distinct from the `restaurantId`.
*   When a JWT token is generated during admin or staff login, the `restaurantId` from the URL parameters (`req.params.rid`) is directly inserted into the token's payload as the `restaurantId` claim.

Therefore, if your token contains `restaurantId: '1111'`, it means that the token was generated for an `Admin` entry where the `restaurantId` was indeed '1111'. The backend is not mistaking a PIN for a `restaurantId`; rather, it's processing the `restaurantId` claim that was put into the token when it was created. It's possible that '1111' was configured as a `restaurantId` in your database, perhaps for testing purposes.

**The problem is therefore in your frontend application's state management.** It is sending a JWT token for one tenant (`1111`) while attempting to access resources for a different tenant (`dominos-aadarsh-nagar-5635`) via the URL.

You need to ensure that your frontend application:
1.  **Clears old tokens:** When you log in as a new tenant or switch tenants, any previously stored authentication tokens (e.g., in local storage, session storage, or a global state variable) must be invalidated or removed.
2.  **Uses the correct token:** The authentication token sent with each API request must correspond to the `restaurantId` in the URL of that request.

I have removed the debugging logs from `common/middlewares/auth.middleware.js` as they are no longer needed. The backend is working as expected.