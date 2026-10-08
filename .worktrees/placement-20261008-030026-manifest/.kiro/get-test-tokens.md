# 🔐 How to Get Test Tokens for RBAC Testing

## Step 1: Create Test Users (If Not Already Created)

You need 3 test users with different roles:

1. **Basic User** - role: `["user"]`
2. **Student** - role: `["student"]`  
3. **Invalid Role User** - role: `["hacker"]` or `["invalid"]`

## Step 2: Get Tokens from Browser

For each test user:

1. **Open your live site** in browser
2. **Login** with the test user credentials
3. **Open DevTools** (F12 or Right-click → Inspect)
4. **Go to Application tab** (Chrome) or Storage tab (Firefox)
5. **Click on Cookies** in the left sidebar
6. **Find your domain** in the cookies list
7. **Look for `accessToken` cookie**
8. **Copy the entire token value**

## Step 3: Set Environment Variables

### Option A: Set in PowerShell (Recommended)
```powershell
$env:TEST_DOMAIN = "your-domain.com"
$env:BASIC_USER_TOKEN = "paste_basic_user_token_here"
$env:STUDENT_TOKEN = "paste_student_token_here"
$env:INVALID_ROLE_TOKEN = "paste_invalid_role_token_here"

node test-rbac-live.js
```

### Option B: Edit the Script Directly
Open `test-rbac-live.js` and update the CONFIG section:
```javascript
const CONFIG = {
  domain: 'your-actual-domain.com',
  protocol: 'https',
  
  tokens: {
    basicUser: 'paste_basic_user_token_here',
    student: 'paste_student_token_here',
    invalidRole: 'paste_invalid_role_token_here',
  }
};
```

## Step 4: Run the Test

```bash
node test-rbac-live.js
```

## Expected Output

The script will test 5 scenarios and show you:
- ✅ Which tests passed
- ❌ Which tests failed
- 🎯 Final verdict on RBAC enforcement

## Critical Success Criteria

**RBAC is REAL if:**
- ❌ Basic User PATCH → HTTP 403 (denied)
- ❌ Invalid Role GET → HTTP 403 (denied)
- ✅ Student GET → HTTP 200 (allowed)
- ✅ Student PATCH → HTTP 200 (allowed)

**If ANY invalid user gets HTTP 200, RBAC is fake.**

## Troubleshooting

### "Cannot connect to domain"
- Check your domain is correct
- Verify the protocol (http vs https)
- Ensure your server is running

### "401 Unauthorized"
- Token may have expired - get a fresh token
- Token may be incorrect - copy the full value
- User may not exist - verify login works

### "All tests return 200"
- RBAC is not working - the fix didn't apply
- Check the build was successful
- Verify the profile route has the RBAC code

### "All tests return 403"
- Tokens may be invalid
- Auth system may be broken
- Check existing auth still works
