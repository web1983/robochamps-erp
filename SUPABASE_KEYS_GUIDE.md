# How to Find Your Supabase API Keys

## Step-by-Step Guide

### 1. Go to Supabase Dashboard
- Log in to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Select your project

### 2. Navigate to API Settings
- Click **Settings** in the left sidebar
- Click **API** under PROJECT SETTINGS

### 3. Switch to Legacy Keys Tab
- You'll see two tabs at the top:
  - "Publishable and secret API keys" (new format - we're not using this)
  - **"Legacy anon, service_role API keys"** ← **Click this one!**

### 4. Copy Your Keys

After clicking the "Legacy anon, service_role API keys" tab, you'll see:

#### a) Project URL
- **Location**: At the top of the page, labeled "Project URL"
- **Format**: `https://xxxxxxxxxxxxx.supabase.co`
- **Use for**: `NEXT_PUBLIC_SUPABASE_URL`
- **Example**: 
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
  ```

#### b) anon public Key
- **Location**: In the "Project API keys" section, labeled "anon public"
- **Format**: A long string starting with `eyJ...`
- **Use for**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Note**: This key is safe to expose in the browser (designed for this)
- **Example**:
  ```
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```

#### c) service_role Key
- **Location**: In the "Project API keys" section, labeled "service_role"
- **Format**: A long string starting with `eyJ...`
- **Use for**: `SUPABASE_SERVICE_ROLE_KEY`
- **⚠️ IMPORTANT**: 
  - This key is **SECRET** - never expose it in client-side code
  - Click the eye icon 👁️ to reveal it if it's masked
  - Only use this in server-side API routes
- **Example**:
  ```
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
  ```

## Visual Guide

```
┌─────────────────────────────────────────────────┐
│ Settings > API                                   │
├─────────────────────────────────────────────────┤
│ [Publishable and secret API keys]               │
│ [Legacy anon, service_role API keys] ← CLICK   │
├─────────────────────────────────────────────────┤
│                                                  │
│ Project URL:                                     │
│ https://xxxxxxxxxxxxx.supabase.co  ← COPY THIS │
│                                                  │
│ Project API keys:                                │
│                                                  │
│ anon public                                      │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← COPY│
│                                                  │
│ service_role                                     │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← COPY│
│ (click 👁️ to reveal)                             │
└─────────────────────────────────────────────────┘
```

## Complete .env.local Example

After copying all three values, your `.env.local` file should look like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

## Don't Forget!

1. ✅ Add these to your `.env.local` file for local development
2. ✅ Add these to Vercel Environment Variables for production:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add each variable one by one
3. ✅ Redeploy your app after adding the variables

## Troubleshooting

- **Can't see the keys?** Make sure you clicked the "Legacy anon, service_role API keys" tab
- **service_role key is masked?** Click the eye icon 👁️ to reveal it
- **Still having issues?** Make sure you're the project owner or have admin access
