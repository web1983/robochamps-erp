# Robochamps ERP System

A comprehensive ERP system for managing trainers, teachers, and schools in the Robochamps robotics training program.

## 🚀 Features

- **User Management**: Admin can create and manage users (Admins, Teachers, Trainers)
- **Trainer Management**: Sign up and manage Robochamps and School trainers
- **Attendance Tracking**: Mark attendance with photo and GPS location
- **Daily Reports**: Track what teachers teach trainers and what trainers teach students
- **Combined Reports**: View attendance and reports together in a single sheet
- **PDF/CSV Export**: Generate printable attendance reports and export data
- **School Management**: Admin can add, edit, and delete schools
- **Meeting Links**: Admin can post meeting links and track clicks
- **Mobile Responsive**: Fully optimized for mobile devices

## 🛠️ Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **PDF Generation**: jsPDF
- **Hosting**: Vercel

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (free tier)
- Cloudinary account (free tier)
- GitHub account (for version control)
- Vercel account (for deployment)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ERP
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
NEXTAUTH_SECRET=your_random_secret_key_generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## 🌐 Deployment to Vercel

### Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:
```bash
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your GitHub repository
4. Add Environment Variables in Vercel:
   - `MONGODB_URI`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel URL, e.g., `https://your-app.vercel.app`)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
5. Click "Deploy"

## 🔐 User Roles

- **ADMIN**: Full access to all features
- **TEACHER**: Can create training reports and view all data
- **TRAINER_ROBOCHAMPS**: Robochamps trainer
- **TRAINER_SCHOOL**: School trainer

**Note**: The first user to sign up automatically becomes an ADMIN.

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices with:
- Touch-friendly interface
- Mobile navigation menu
- Responsive tables and forms
- Optimized for iOS and Android browsers

## 📄 License

Private project for Robochamps.

## 🤝 Support

For issues or questions, please contact the development team.
