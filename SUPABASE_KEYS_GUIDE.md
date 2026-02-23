# How to Find Your Supabase API Keys

## Step-by-Step Guide

### 1. Go to Supabase Dashboard
- Log in to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Select your project

### 2. Navigate to API Settings
- Click **Settings** in the left sidebar
- Click **API** under PROJECT SETTINGS

### 3. Choose Your Keys Format

You have **TWO options** - both work! Choose whichever is easier:

**Option A: New Format (Recommended - What you're seeing now)**
- Stay on the **"Publishable and secret API keys"** tab (default)
- Use the **Publishable Key** and **Secret Key**

**Option B: Legacy Format**
- Click the **"Legacy anon, service_role API keys"** tab
- Use the **anon public** key and **service_role** key

### 4. Copy Your Keys

**If using NEW FORMAT (Option A - Current tab):**

#### a) Project URL
- **Location**: At the top of the page, labeled "Project URL"
- **Format**: `https://xxxxxxxxxxxxx.supabase.co`
- **Use for**: `NEXT_PUBLIC_SUPABASE_URL`
- **Example**: 
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
  ```

#### b) Publishable Key (NEW FORMAT)
- **Location**: In the "DATA API" section, labeled "Publishable Key"
- **Format**: A string starting with `sb_publishable_...`
- **Use for**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Note**: This key is safe to expose in the browser (designed for this)
- **Example**:
  ```
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_6X3bKOUtyafJcAf4qmAySg_g8kvC...
  ```

#### c) Secret Key (NEW FORMAT)
- **Location**: Scroll down to "Secret keys" section, labeled "Secret keys"
- **Format**: A string starting with `sb_secret_...`
- **Use for**: `SUPABASE_SECRET_KEY`
- **⚠️ IMPORTANT**: 
  - This key is **SECRET** - never expose it in client-side code
  - Click the eye icon 👁️ to reveal it if it's masked
  - Only use this in server-side API routes
- **Example**:
  ```
  SUPABASE_SECRET_KEY=sb_secret_69JkG...
  ```

**If using LEGACY FORMAT (Option B - Switch tab):**

#### b) anon public Key (LEGACY FORMAT)
- **Location**: In the "Project API keys" section, labeled "anon public"
- **Format**: A long string starting with `eyJ...`
- **Use for**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Note**: This key is safe to expose in the browser (designed for this)
- **Example**:
  ```
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```

#### c) service_role Key (LEGACY FORMAT)
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

**Option A: Using NEW FORMAT (Recommended)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://kdntstbtzanzxoxdtrxb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_6X3bKOUtyafJcAf4qmAySg_g8kvC...
SUPABASE_SECRET_KEY=sb_secret_69JkG...
```

**Option B: Using LEGACY FORMAT**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

**Note**: Use EITHER Option A OR Option B, not both!

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
