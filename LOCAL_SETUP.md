# Local Setup Guide

## ✅ Step 1: Dependencies Installed
Dependencies are already installed! ✓

## 📝 Step 2: Create Environment File

1. **Copy the template:**
   ```powershell
   Copy-Item env.template .env.local
   ```

2. **Or create `.env.local` manually** with these variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/robochamps_erp?retryWrites=true&w=majority
NEXTAUTH_SECRET=MnnR7ED1D10XMP4aCV4o2JXYV2HT5tuK41qEZH2YEs8=
NEXTAUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 🔑 Step 3: Get Your Credentials

### MongoDB Atlas (Free):
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up / Login
3. Create a free cluster
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Replace `robochamps_erp` with your database name (or keep it)

### Cloudinary (Free):
1. Go to https://cloudinary.com
2. Sign up / Login
3. Go to Dashboard
4. Copy:
   - Cloud Name
   - API Key
   - API Secret

## 🚀 Step 4: Run Locally

```bash
npm run dev
```

Then open: http://localhost:3000

## 🧪 Step 5: Test the App

1. **First User (Admin):**
   - Go to http://localhost:3000
   - Click "Sign Up"
   - Fill the form (first user becomes ADMIN automatically)
   - Login

2. **Test Trainer Features:**
   - Sign up another account (will be trainer)
   - Login as trainer
   - Try marking attendance (camera + GPS)
   - Create a daily report

3. **Test Teacher Features:**
   - Login as admin
   - Create training report
   - View all reports
   - Generate PDF

## ⚠️ Troubleshooting

**Port 3000 already in use?**
```bash
# Use different port
npm run dev -- -p 3001
```

**MongoDB connection error?**
- Check your connection string
- Make sure IP is whitelisted in MongoDB Atlas (use 0.0.0.0/0 for local dev)
- Verify database user password

**Cloudinary upload fails?**
- Double-check API credentials
- Make sure you're using the correct cloud name

**Build errors?**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

## 📱 Mobile Testing

1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. On mobile, go to: `http://YOUR_LOCAL_IP:3000`
3. Make sure phone and computer are on same WiFi
4. Test camera and GPS features

## ✅ Ready for Vercel?

Once everything works locally:
1. Push to GitHub
2. Import to Vercel
3. Add same environment variables
4. Deploy!
