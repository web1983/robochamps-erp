# Reset Admin Password

## Quick Method: Use API Endpoint

### Option 1: Using curl (from terminal)

```bash
curl -X POST https://robochamps-erp.vercel.app/api/admin/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "web@robowunder.com",
    "newPassword": "Robochamps",
    "secretKey": "robochamps-admin-reset-2024"
  }'
```

### Option 2: Using Browser Console

1. Open your browser's Developer Console (F12)
2. Go to the Console tab
3. Paste and run:

```javascript
fetch('https://robochamps-erp.vercel.app/api/admin/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'web@robowunder.com',
    newPassword: 'Robochamps',
    secretKey: 'robochamps-admin-reset-2024'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error('Error:', err));
```

### Option 3: Using Postman or similar tool

1. Method: POST
2. URL: `https://robochamps-erp.vercel.app/api/admin/reset-password`
3. Headers: `Content-Type: application/json`
4. Body (JSON):
```json
{
  "email": "web@robowunder.com",
  "newPassword": "Robochamps",
  "secretKey": "robochamps-admin-reset-2024"
}
```

## Local Method: Using Node.js Script

1. Make sure you have `.env.local` with `MONGODB_URI`
2. Run:
```bash
node scripts/reset-admin-password.js
```

## Security Note

⚠️ **Important**: After resetting the password, you should:
1. Change the `ADMIN_RESET_SECRET` in Vercel environment variables
2. Or remove/disable this endpoint in production

To change the secret:
1. Go to Vercel → Settings → Environment Variables
2. Add: `ADMIN_RESET_SECRET` = `your-new-secret-key`
3. Redeploy

## Expected Response

Success:
```json
{
  "success": true,
  "message": "Password updated successfully for web@robowunder.com"
}
```

Error:
```json
{
  "error": "User not found"
}
```

## After Reset

1. Go to: `https://robochamps-erp.vercel.app/login`
2. Email: `web@robowunder.com`
3. Password: `Robochamps`
4. Login should work!
