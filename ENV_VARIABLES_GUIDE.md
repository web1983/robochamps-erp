# Environment Variables Guide

## How to Get Each Environment Variable

### 1. MONGODB_URI
**Where to get it:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign in to your account
3. Click on your cluster
4. Click **"Connect"**
5. Choose **"Connect your application"**
6. Copy the connection string
7. Replace `<password>` with your database password
8. Replace `<dbname>` with `robochamps_erp` (or keep default)

**Format:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/robochamps_erp?retryWrites=true&w=majority
```

### 2. NEXTAUTH_SECRET
**Generate it:**
I've generated one for you: `m2L9q1NodSCWmUNOi/w1A4RSQN0gR9L0udia+HGIOOA=`

**Or generate a new one:**
```bash
openssl rand -base64 32
```

**Or use Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. NEXTAUTH_URL
**For Local Development:**
```
http://localhost:3000
```

**For Vercel (after first deployment):**
1. Deploy your app to Vercel
2. Vercel will give you a URL like: `https://robochamps-erp.vercel.app`
3. Use that URL as your `NEXTAUTH_URL`
4. After setting it, redeploy

**Format:**
```
https://your-app-name.vercel.app
```

### 4. CLOUDINARY_CLOUD_NAME
**Where to get it:**
1. Go to [Cloudinary](https://cloudinary.com)
2. Sign in to your account
3. Go to **Dashboard**
4. Copy the **"Cloud name"** value

**Example:**
```
dyyi3huje
```

### 5. CLOUDINARY_API_KEY
**Where to get it:**
1. In Cloudinary Dashboard
2. Look for **"API Key"** (usually visible on the dashboard)
3. Copy the value

**Example:**
```
123456789012345
```

### 6. CLOUDINARY_API_SECRET
**Where to get it:**
1. In Cloudinary Dashboard
2. Click **"Show"** next to **"API Secret"**
3. Copy the value (keep it secret!)

**Example:**
```
abcdefghijklmnopqrstuvwxyz123456
```

---

## Complete .env.local Example

Create a `.env.local` file in your project root:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/robochamps_erp?retryWrites=true&w=majority
NEXTAUTH_SECRET=m2L9q1NodSCWmUNOi/w1A4RSQN0gR9L0udia+HGIOOA=
NEXTAUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## For Vercel Deployment

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key:** `MONGODB_URI` | **Value:** (your MongoDB connection string)
   - **Key:** `NEXTAUTH_SECRET` | **Value:** `m2L9q1NodSCWmUNOi/w1A4RSQN0gR9L0udia+HGIOOA=`
   - **Key:** `NEXTAUTH_URL` | **Value:** `https://your-app.vercel.app` (after first deploy)
   - **Key:** `CLOUDINARY_CLOUD_NAME` | **Value:** (your Cloudinary cloud name)
   - **Key:** `CLOUDINARY_API_KEY` | **Value:** (your Cloudinary API key)
   - **Key:** `CLOUDINARY_API_SECRET` | **Value:** (your Cloudinary API secret)
4. Select **"Production"**, **"Preview"**, and **"Development"** for all variables
5. Click **Save**
6. Redeploy your application

---

## Important Notes

- **Never commit `.env.local` to Git** (it's already in `.gitignore`)
- **Keep your secrets secure** - don't share them publicly
- **NEXTAUTH_URL** must match your actual deployment URL
- **MongoDB IP Whitelist:** Make sure to whitelist `0.0.0.0/0` in MongoDB Atlas for Vercel deployments
