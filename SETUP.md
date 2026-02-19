# Robochamps ERP - Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB Atlas** account (free tier)
3. **Cloudinary** account (free tier)
4. **Vercel** account (for deployment)

## Step-by-Step Setup

### 1. Clone and Install

```bash
npm install
```

### 2. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/robochamps_erp?retryWrites=true&w=majority`

### 3. Cloudinary Setup

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. Go to Dashboard → Settings
4. Copy:
   - Cloud Name
   - API Key
   - API Secret

### 4. Environment Variables

Create `.env.local` file in the root directory:

```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. First User (Admin)

The **first user** to sign up automatically becomes **ADMIN**. After that, all signups become trainers.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables:
   - `MONGODB_URI`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel URL)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Deploy!

### 3. Update NEXTAUTH_URL

After deployment, update `NEXTAUTH_URL` in Vercel environment variables to your production URL (e.g., `https://your-app.vercel.app`)

## PWA Icons

Create these icon files in the `public` folder:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

You can use any image editor or online tool to create these icons.

## Features

### For Trainers:
- ✅ Sign up with school information
- ✅ Mark attendance with photo + GPS
- ✅ Submit daily class reports
- ✅ View own reports

### For Teachers:
- ✅ Submit daily training reports
- ✅ View all trainer reports
- ✅ View attendance records
- ✅ Generate PDF attendance reports

### For Admins:
- ✅ All teacher features
- ✅ Full system access

## Database Collections

The system automatically creates these collections:
- `users` - User accounts
- `schools` - School information
- `attendanceRecords` - Attendance with photos and GPS
- `dailyReports` - Daily teaching reports

## Mobile Usage

The app is PWA-enabled. On mobile browsers (Chrome/Edge), users can:
1. Open the app
2. Tap "Add to Home Screen"
3. Use it like a native app
4. Camera and GPS features work seamlessly

## Troubleshooting

### MongoDB Connection Issues
- Check your connection string
- Verify IP whitelist in MongoDB Atlas
- Check database user permissions

### Cloudinary Upload Fails
- Verify API credentials
- Check Cloudinary dashboard for errors
- Ensure folder permissions are correct

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

## Support

For issues or questions, check the codebase or create an issue in your repository.
