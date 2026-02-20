# Reset Admin Password - Simple Steps

## Step 1: Allow Pasting in Browser Console

When you see the warning:
```
Warning: Don't paste code into the DevTools Console...
```

**Type this first:**
```
allow pasting
```

Then press Enter. Now you can paste the code.

---

## Step 2: Reset Password

After typing "allow pasting", paste this code:

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
.then(data => {
  console.log('Result:', data);
  if (data.success) {
    alert('Password reset successful! Now try logging in.');
  } else {
    alert('Error: ' + data.error);
  }
})
.catch(err => {
  alert('Error: ' + err.message);
});
```

---

## Alternative: Use Signup (Since Signup Works!)

Since signup is working, you can also:

1. Go to: `https://robochamps-erp.vercel.app/signup`
2. Fill in:
   - Full Name: Admin
   - Email: `web@robowunder.com`
   - Password: `Robochamps`
   - School, Location, Trainer Type: Leave empty (first user becomes admin)
3. Click "Sign Up"
4. Then login with the same credentials

**Note:** If the email already exists from a previous signup, you'll need to use the password reset method above.

---

## Step 3: Login

1. Go to: `https://robochamps-erp.vercel.app/login`
2. Email: `web@robowunder.com`
3. Password: `Robochamps`
4. Click Login

---

## If Login Still Fails

The issue might be **NEXTAUTH_URL** not set correctly. Check:

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Make sure `NEXTAUTH_URL` = `https://robochamps-erp.vercel.app`
4. If missing or wrong, add/update it
5. **Redeploy** (or wait for auto-deploy)

After redeploy, try login again.
