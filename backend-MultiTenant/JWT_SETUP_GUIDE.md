# 🔧 JWT Configuration & Token Authentication Fix

## Problem Identified

**Error**: `GET http://localhost:5000/api/bliss-bay-8665/calls/active 400 (Bad Request)`  
**Message**: `Failed to fetch active calls: Error: Invalid token`

**Root Cause**: JWT_SECRET is not configured in `.env` file or is empty.

---

## Quick Fix (5 minutes)

### Step 1: Generate JWT Secret

```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### Step 2: Add to .env File

```bash
# Open .env in your backend directory
# Add or update this line:
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# Save the file
```

### Step 3: Restart Server

```bash
# Stop current server (Ctrl+C)
# Restart with:
npm run dev
```

---

## Verification

Check the logs after restart:

```
✅ Configuration validation passed
✅ JWT_SECRET is configured
✅ Server running on port 5000
```

If you see:

```
❌ JWT_SECRET is required
```

Then the .env file wasn't loaded or JWT_SECRET is still empty.

---

## What Changed

### 1. Enhanced JWT Library (`common/libs/jwt.js`)

- ✅ Added JWT_SECRET validation
- ✅ Better error messages (expired, signature, malformed)
- ✅ Token expiration detection
- ✅ Debug information for troubleshooting

### 2. Improved Auth Middleware (`common/middlewares/auth.middleware.js`)

- ✅ Configuration error handling (500 response)
- ✅ Specific error codes (NO_TOKEN, INVALID_TOKEN, TOKEN_EXPIRED, etc.)
- ✅ Better error messages for frontend
- ✅ Improved logging for debugging

---

## Error Codes Reference

### Configuration Errors (500)

```json
{
  "error": "Server configuration error",
  "code": "JWT_CONFIG_ERROR",
  "message": "JWT secret is not configured..."
}
```

### Authentication Errors (400/401)

**No Token**:

```json
{
  "error": "Access denied. No token provided.",
  "code": "NO_TOKEN"
}
```

**Invalid Token**:

```json
{
  "error": "Invalid token",
  "code": "INVALID_TOKEN",
  "message": "Malformed token. Token format is invalid."
}
```

**Expired Token**:

```json
{
  "error": "Invalid token",
  "code": "TOKEN_EXPIRED",
  "message": "Token expired at 2025-12-09T12:00:00.000Z"
}
Status: 401
```

**Signature Mismatch**:

```json
{
  "error": "Invalid token",
  "code": "INVALID_TOKEN",
  "message": "Invalid token signature. Token may have been tampered with or generated with different secret."
}
```

### Authorization Errors (403)

```json
{
  "error": "Forbidden (cross-tenant access attempted)",
  "code": "CROSS_TENANT_DENIED"
}
```

---

## .env Configuration Examples

### Development (Local)

```env
# Database
MONGO_URI=mongodb://127.0.0.1:27017/swadsetu

# Authentication
JWT_SECRET=your-super-secret-key-here-minimum-32-chars

# Redis (optional for development)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Server
PORT=5000
NODE_ENV=development
```

### Production

```env
# Database
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/swadsetu

# Authentication (MUST be strong and unique)
JWT_SECRET=use-generated-random-32-char-string-from-secure-source

# Redis (required)
REDIS_URL=redis://localhost:6379

# Server
PORT=5000
NODE_ENV=production
LOG_LEVEL=error
```

### Generate Secure JWT Secret

**Option 1: Node.js**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: OpenSSL**

```bash
openssl rand -hex 32
```

**Option 3: Online Tool**
Visit: https://www.random.org/bytes/ (select hex format, 32 bytes)

---

## Troubleshooting

### Issue: Still Getting "Invalid token"

**Check 1: JWT_SECRET is set**

```bash
# On Linux/Mac:
grep JWT_SECRET .env

# On Windows:
findstr JWT_SECRET .env
```

Expected output:

```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**Check 2: .env is in correct location**

```bash
# Should be in backend-MultiTenant directory
ls -la .env

# If not found, create it
touch .env
```

**Check 3: Server was restarted**

```bash
# Stop server (Ctrl+C)
# Restart with:
npm run dev

# Should see in logs:
# ✅ Configuration validation passed
```

**Check 4: Token matches secret**

```
If you recently changed JWT_SECRET:
- Old tokens won't work
- Users need to re-login to get new tokens
- Clear browser localStorage/cookies
```

### Issue: "Invalid token signature"

**Cause**: Token was generated with different JWT_SECRET

**Solution**:

1. Find what JWT_SECRET was used originally
2. Either:
   - Update .env to use original JWT_SECRET, OR
   - Tell users to login again for new tokens

### Issue: "Token expired"

**Cause**: Token TTL (time to live) has passed

**Solution**: Users need to login again to get fresh token

**Check token TTL**:

```javascript
// In admin.controller.js or auth logic
const token = generateToken(payload, { expiresIn: "1h" }); // Default 1 hour
```

To change TTL:

```javascript
{
  expiresIn: "24h";
} // 24 hours
{
  expiresIn: "7d";
} // 7 days
```

---

## How Tokens Are Generated

**During Admin Login** (`/api/:rid/admin/login`):

```javascript
// In admin.controller.js
const payload = {
  id: admin._id,
  restaurantId: admin.restaurantId,
  role: "admin",
};

const token = generateToken(payload, { expiresIn: "1h" });
// Returns: eyJhbGc...kQxQM (JWT token string)
```

**Frontend Usage**:

```javascript
// Store token
localStorage.setItem("token", token);

// Send with requests
axios.get("/api/:rid/calls/active", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

**Backend Verification**:

```javascript
// Auth middleware extracts and verifies token
const token = header("Authorization").replace("Bearer ", "");
const decoded = verifyToken(token); // Uses JWT_SECRET
// Returns: { id: "...", restaurantId: "bliss-bay-8665", role: "admin" }
```

---

## Testing Token Generation

### Create a test token (development only)

```bash
# Start Node REPL in backend directory
node

# Then run:
const { generateToken } = require('./common/libs/jwt');
const token = generateToken({
  id: 'test-user-123',
  restaurantId: 'bliss-bay-8665',
  role: 'admin'
});
console.log(token);

# Copy the output token
# Exit REPL: .exit
```

### Test token with curl

```bash
# Get calls
curl -X GET http://localhost:5000/api/bliss-bay-8665/calls/active \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Should now work and return calls list
```

---

## Frontend Integration

### Update API Client

```typescript
// In your API client setup (e.g., api.ts or axios.config.ts)

const token = localStorage.getItem("token");

const apiClient = axios.create({
  baseURL: "http://localhost:5000",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

// Handle 401 on token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

### Error Handling

```typescript
try {
  const calls = await apiClient.get("/calls/active");
} catch (error) {
  const errorCode = error.response?.data?.code;

  if (errorCode === "NO_TOKEN") {
    showMessage("Please login to access this feature");
    redirectToLogin();
  } else if (errorCode === "TOKEN_EXPIRED") {
    showMessage("Your session has expired. Please login again.");
    redirectToLogin();
  } else if (errorCode === "INVALID_TOKEN") {
    showMessage("Invalid authentication token. Please login again.");
    redirectToLogin();
  } else if (errorCode === "CROSS_TENANT_DENIED") {
    showError("You do not have access to this restaurant.");
  }
}
```

---

## Security Best Practices

1. **Never share JWT_SECRET**

   - Keep it secret and secure
   - Use strong random values (32+ characters)
   - Rotate periodically in production

2. **Store token securely on frontend**

   - Use localStorage or sessionStorage (not cookies for SPA)
   - OR use httpOnly cookies (more secure but requires backend support)

3. **Set appropriate token expiration**

   - Development: 1-24 hours
   - Production: 1-8 hours

4. **Validate on backend**

   - Always verify token signature
   - Check tenant match (rid vs token.restaurantId)
   - Verify required claims exist

5. **Handle expiration gracefully**
   - Implement refresh token mechanism (optional)
   - Auto-redirect to login on 401
   - Clear local storage on logout

---

## Summary

| Step | Action              | Time  |
| ---- | ------------------- | ----- |
| 1    | Generate JWT_SECRET | 1 min |
| 2    | Add to .env file    | 1 min |
| 3    | Restart server      | 1 min |
| 4    | Verify with logs    | 1 min |
| 5    | Test API endpoints  | 1 min |

**Total Fix Time**: ~5 minutes

---

## References

- JWT Documentation: https://jwt.io
- Node.js JWT: https://github.com/auth0/node-jsonwebtoken
- Environment Variables: dotenv package

---

**Status**: ✅ Authentication System Enhanced  
**Impact**: Better error messages, easier debugging, secure JWT handling
