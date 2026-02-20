# Troubleshooting Login Issues (401 Errors)

## Common Causes of 401 Errors

### 1. ✅ Check NEXTAUTH_URL in Vercel

**This is the MOST COMMON issue!**

1. Go to your Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Check if `NEXTAUTH_URL` is set
5. It should be: `https://your-app-name.vercel.app` (your actual Vercel URL)
6. Make sure it's set for **Production**, **Preview**, and **Development**
7. **Redeploy** after setting it

**How to find your Vercel URL:**
- Go to Vercel Dashboard → Your Project → **Deployments**
- Click on the latest deployment
- Copy the URL (e.g., `https://robochamps-erp.vercel.app`)

### 2. ✅ Check if Users Exist in Database

If this is your first deployment, you need to **sign up first**:

1. Go to: `https://your-app.vercel.app/signup`
2. Fill in the signup form
3. **The first user automatically becomes ADMIN**
4. After signup, try logging in

**To check if users exist:**
- Try signing up with a new account
- If signup works but login doesn't, check the password

### 3. ✅ Verify Environment Variables in Vercel

Make sure ALL these are set in Vercel:

```
✅ MONGODB_URI
✅ NEXTAUTH_SECRET
✅ NEXTAUTH_URL (MUST match your Vercel URL exactly)
✅ CLOUDINARY_CLOUD_NAME
✅ CLOUDINARY_API_KEY
✅ CLOUDINARY_API_SECRET
```

**Important:** 
- `NEXTAUTH_URL` must start with `https://` (not `http://`)
- No trailing slash: `https://app.vercel.app` ✅ (not `https://app.vercel.app/` ❌)

### 4. ✅ Check MongoDB Connection

1. Go to MongoDB Atlas
2. Check **Network Access** → Make sure `0.0.0.0/0` is whitelisted (for Vercel)
3. Check **Database Access** → Make sure your user has read/write permissions
4. Test connection: Visit `https://your-app.vercel.app/api/test-db`

### 5. ✅ Check Browser Console for Detailed Errors

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for specific error messages
4. Go to **Network** tab
5. Try logging in
6. Check the `/api/auth/callback/credentials` request
7. Look at the **Response** tab for error details

### 6. ✅ Clear Browser Cache and Cookies

Sometimes old session data causes issues:

1. Clear browser cache
2. Clear cookies for your Vercel domain
3. Try in **Incognito/Private** window
4. Try a different browser

### 7. ✅ Verify NEXTAUTH_SECRET

The secret must be the same across all environments:

1. Check Vercel environment variables
2. Make sure it's a long random string (at least 32 characters)
3. If you changed it, you need to sign up again (old sessions won't work)

## Step-by-Step Fix

### If you just deployed for the first time:

1. **Set NEXTAUTH_URL:**
   ```
   Go to Vercel → Settings → Environment Variables
   Add: NEXTAUTH_URL = https://your-actual-vercel-url.vercel.app
   Redeploy
   ```

2. **Sign up as first user:**
   ```
   Visit: https://your-app.vercel.app/signup
   Fill the form
   Submit
   ```

3. **Login:**
   ```
   Visit: https://your-app.vercel.app/login
   Use the email/password you just signed up with
   ```

### If login still doesn't work:

1. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Your Project → **Functions**
   - Click on a recent function call
   - Check for error messages

2. **Test Database Connection:**
   - Visit: `https://your-app.vercel.app/api/test-db`
   - Should return: `{"success":true,"message":"MongoDB connection successful"}`

3. **Check Signup:**
   - Try signing up again
   - If signup fails, check MongoDB connection
   - If signup works but login doesn't, check password

## Quick Test

Run these in order:

1. ✅ `https://your-app.vercel.app/api/test-db` → Should work
2. ✅ `https://your-app.vercel.app/signup` → Should work
3. ✅ `https://your-app.vercel.app/login` → Should work after signup

## Still Not Working?

Check Vercel deployment logs:
1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Deployments**
4. Click on the latest deployment
5. Check **Build Logs** and **Function Logs**
6. Look for error messages

## Common Error Messages

- **"Invalid email or password"** → User doesn't exist or wrong password
- **"Unauthorized"** → NEXTAUTH_URL not set or session expired
- **"Database connection failed"** → MongoDB URI wrong or IP not whitelisted
- **"NEXTAUTH_SECRET is missing"** → Secret not set in Vercel
