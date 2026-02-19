# Deployment Guide - Robochamps ERP

## 📦 Step 1: Push to GitHub

### 1.1 Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository name: `robochamps-erp` (or any name you prefer)
4. Description: "ERP system for Robochamps trainers and teachers"
5. Choose **Public** or **Private** (your choice)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

### 1.2 Push Your Code

After creating the repository, GitHub will show you commands. Use these commands in your terminal:

```bash
# Add your GitHub repository as remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push your code
git push -u origin main
```

**Example:**
```bash
git remote add origin https://github.com/johndoe/robochamps-erp.git
git branch -M main
git push -u origin main
```

---

## 🚀 Step 2: Deploy to Vercel

### 2.1 Sign Up / Sign In to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel to access your GitHub account

### 2.2 Import Your Project

1. Click **"Add New..."** → **"Project"**
2. Find your `robochamps-erp` repository
3. Click **"Import"**

### 2.3 Configure Project Settings

**Framework Preset:** Next.js (should auto-detect)

**Root Directory:** `./` (default)

**Build Command:** `npm run build` (default)

**Output Directory:** `.next` (default)

**Install Command:** `npm install` (default)

### 2.4 Add Environment Variables

Click **"Environment Variables"** and add these:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `MONGODB_URI` | `your_mongodb_atlas_connection_string` | Your MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | `generate_random_string` | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Will be set automatically after first deploy |
| `CLOUDINARY_CLOUD_NAME` | `your_cloudinary_cloud_name` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | `your_cloudinary_api_key` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | `your_cloudinary_api_secret` | From Cloudinary dashboard |

**Important Notes:**
- After first deployment, Vercel will give you a URL like `https://robochamps-erp.vercel.app`
- Update `NEXTAUTH_URL` with your actual Vercel URL
- Redeploy after updating `NEXTAUTH_URL`

### 2.5 Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete (2-5 minutes)
3. Your app will be live at `https://your-app-name.vercel.app`

---

## 🔧 Step 3: Post-Deployment Configuration

### 3.1 Update NEXTAUTH_URL

After first deployment:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Update `NEXTAUTH_URL` to your actual Vercel URL (e.g., `https://robochamps-erp.vercel.app`)
3. Go to **Deployments** → Click **"..."** on latest deployment → **"Redeploy"**

### 3.2 MongoDB Atlas IP Whitelist

1. Go to MongoDB Atlas Dashboard
2. **Network Access** → **Add IP Address**
3. Add `0.0.0.0/0` (allow all IPs) OR add Vercel's IP ranges
4. Click **"Confirm"**

### 3.3 Test Your Deployment

1. Visit your Vercel URL
2. Sign up as the first user (becomes ADMIN)
3. Test all features

---

## 🔄 Step 4: Future Updates

Whenever you make changes:

```bash
# Make your changes
# Stage files
git add .

# Commit
git commit -m "Your commit message"

# Push to GitHub
git push

# Vercel will automatically deploy!
```

Vercel automatically deploys when you push to GitHub!

---

## 📝 Quick Checklist

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Environment variables added
- [ ] First deployment completed
- [ ] NEXTAUTH_URL updated
- [ ] MongoDB IP whitelist updated
- [ ] App tested and working

---

## 🆘 Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Check MongoDB connection string is correct
- Check Cloudinary credentials

### Authentication Not Working
- Verify `NEXTAUTH_URL` matches your Vercel URL exactly
- Check `NEXTAUTH_SECRET` is set
- Redeploy after changing environment variables

### Database Connection Issues
- Verify MongoDB IP whitelist includes Vercel IPs
- Check `MONGODB_URI` is correct
- Ensure database user has proper permissions

---

## 📞 Need Help?

Check the documentation files:
- `SETUP.md` - Local setup guide
- `LOCAL_SETUP.md` - Detailed local setup
- `MONGODB_TROUBLESHOOTING.md` - MongoDB issues
- `ARCHITECTURE.md` - System architecture
