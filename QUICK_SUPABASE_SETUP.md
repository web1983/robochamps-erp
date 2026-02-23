# Quick Supabase Setup Guide

## ⚡ Quick Steps to Fix "Bucket Not Found" Error

If you're seeing the error: **"Storage bucket 'combined-sheets' not found"**, follow these steps:

### 1. Go to Supabase Dashboard
- Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Select your project

### 2. Create the Storage Bucket
1. Click **Storage** in the left sidebar
2. Click **New bucket** button (top right)
3. Enter bucket name: `combined-sheets` (exactly as shown)
4. Toggle **Public bucket** to **ON** ✅
5. Click **Create bucket**

### 3. Verify It's Created
- You should see `combined-sheets` in your Storage buckets list
- It should show as "Public"

### 4. Test Upload
- Go back to your ERP app
- Try uploading a file again
- The error should be gone!

## 📋 Complete Setup Checklist

- [ ] Supabase project created
- [ ] Environment variables added to Vercel:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`
- [ ] Storage bucket `combined-sheets` created
- [ ] Bucket set to **Public**
- [ ] Test upload works

## 🔍 Still Not Working?

1. **Check Vercel Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Make sure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
   - Redeploy after adding variables

2. **Check Bucket Name**
   - Must be exactly: `combined-sheets` (lowercase, hyphen, no spaces)

3. **Check Bucket Visibility**
   - Must be set to **Public** (not Private)

4. **Check Browser Console**
   - Look for more detailed error messages
   - Check Network tab for the API response

## 📚 Full Documentation

For complete setup instructions, see `SUPABASE_SETUP.md`
