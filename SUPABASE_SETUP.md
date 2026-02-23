# Supabase Setup Guide

This guide will help you set up Supabase for storing uploaded combined sheets in the ERP system.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll see two tabs at the top:
   - **"Publishable and secret API keys"** (new format)
   - **"Legacy anon, service_role API keys"** ← **Click this tab**
3. After clicking the "Legacy anon, service_role API keys" tab, you'll see:
   - **Project URL** (at the top) - Copy this for `NEXT_PUBLIC_SUPABASE_URL`
     - Example: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public** key - Copy this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - This is the key that's safe to expose in the browser
   - **service_role** key - Copy this for `SUPABASE_SERVICE_ROLE_KEY`
     - ⚠️ **KEEP THIS SECRET!** Never expose this in client-side code
     - Click the eye icon to reveal it if it's masked

## Step 3: Create Storage Bucket ⚠️ REQUIRED

**This step is CRITICAL - the upload feature will not work without this bucket!**

1. In your Supabase dashboard, go to **Storage** (left sidebar)
2. Click **New bucket** button (top right)
3. **Bucket name**: `combined-sheets` (must be exactly this name)
4. **Public bucket**: Toggle this to **ON** (so files can be accessed via URL)
   - This allows users to view/download their uploaded files
5. Click **Create bucket**

**Important**: The bucket name must be exactly `combined-sheets` (lowercase, with hyphen). The code expects this exact name.

**If you see the error "Storage bucket 'combined-sheets' not found"**, it means this bucket hasn't been created yet. Follow the steps above to create it.

## Step 4: Set Up Storage Policies (Optional - Service Role Key Bypasses RLS)

**Note**: Since we're using the `SUPABASE_SERVICE_ROLE_KEY` for uploads (server-side), it bypasses Row Level Security (RLS) policies. However, if you want to add policies for additional security:

1. Go to **Storage** → Click on `combined-sheets` bucket → **Policies** tab
2. Click **New Policy**
3. Create policies that allow:
   - **INSERT**: Authenticated users can upload files
   - **SELECT**: Authenticated users can read files
   - **UPDATE**: Users can only update their own files (optional)
   - **DELETE**: Users can only delete their own files (optional)

**For most use cases, you can skip this step** since the service role key handles uploads securely.

Example policy for INSERT:
```sql
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'combined-sheets' AND (storage.foldername(name))[1] = auth.uid()::text);
```

Example policy for SELECT:
```sql
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'combined-sheets' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Note**: Since we're using NextAuth (not Supabase Auth), you may need to use a simpler policy that allows all authenticated requests, or use the service role key for uploads.

## Step 5: Add Environment Variables

Add these to your `.env.local` file (and Vercel environment variables):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Important Security Notes:

- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: 
  - ✅ **SAFE to expose** - This key is designed to be public and is safe to include in client-side code
  - It's restricted by Row Level Security (RLS) policies in Supabase
  - You may see a warning in Vercel about this - this is expected and safe
  - Currently optional in our implementation (we use service role key for uploads)

- **`SUPABASE_SERVICE_ROLE_KEY`**: 
  - ⚠️ **MUST BE KEPT SECRET** - Never expose this in client-side code
  - Only used in server-side API routes
  - Has full access and bypasses RLS - treat it like a password
  - This is what we use for secure file uploads

## Step 6: Alternative: Public Upload Policy

If you want to simplify and allow all authenticated users to upload/read (since we're using NextAuth for authentication), you can use:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'combined-sheets');

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'combined-sheets');
```

## Troubleshooting

- **Upload fails**: Check that the bucket exists and policies are set correctly
- **Files not accessible**: Ensure the bucket is set to **Public**
- **CORS errors**: Supabase handles CORS automatically, but check your bucket settings
- **File size limits**: Free tier allows up to 50MB per file, but we've set a 10MB limit in the code

## Free Tier Limits

- **Storage**: 1 GB free
- **File size**: 50 MB max per file
- **Bandwidth**: 2 GB/month free

For production use, consider upgrading to a paid plan if you exceed these limits.
