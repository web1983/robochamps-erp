# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Accounts (Free)

**MongoDB Atlas:**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create free cluster
- Get connection string

**Cloudinary:**
- Sign up at https://cloudinary.com
- Get credentials from dashboard

### 3. Create `.env.local`
```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Run
```bash
npm run dev
```

### 5. First User = Admin
- Go to http://localhost:3000
- Click "Sign Up"
- First user automatically becomes ADMIN
- All subsequent users become trainers

## 📱 Mobile Testing

1. Open app on mobile browser (Chrome/Edge)
2. Navigate to trainer dashboard
3. Click "Mark Attendance"
4. Camera and GPS will work automatically

## 🎯 Key Features

✅ **Trainer Signup** - Self-registration with school info  
✅ **Attendance** - Photo + GPS (best effort)  
✅ **Daily Reports** - Teacher & Trainer reports  
✅ **PDF Export** - Printable attendance sheets  
✅ **PWA** - Works like mobile app  

## 📋 User Roles

- **ADMIN** - Full access (first user)
- **TEACHER** - Training reports + view all
- **TRAINER** - Mark attendance + class reports

## 🔧 Common Issues

**MongoDB Connection Failed:**
- Check connection string
- Whitelist IP in Atlas (0.0.0.0/0 for dev)

**Photo Upload Fails:**
- Verify Cloudinary credentials
- Check API key permissions

**Can't Login:**
- Clear browser cookies
- Check NEXTAUTH_SECRET is set
- Verify email/password

## 📚 Full Documentation

- `SETUP.md` - Detailed setup instructions
- `ARCHITECTURE.md` - System design & flow
- `README.md` - Project overview
