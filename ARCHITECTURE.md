# Robochamps ERP - Architecture & Flow

## System Overview

This ERP system manages trainers, teachers, and schools for Robochamps robotics training program. It tracks attendance with photo proof, GPS location, and daily teaching reports.

## User Roles

1. **ADMIN** - First user to sign up automatically becomes admin. Full system access.
2. **TEACHER** - Robochamps teacher who trains trainers online. Can create training reports.
3. **TRAINER_ROBOCHAMPS** - Trainer provided by Robochamps. Trains students in schools.
4. **TRAINER_SCHOOL** - Trainer hired by school. Trains students in schools.

## Complete User Flow

### 1. Trainer Signup Flow

```
User visits /signup
↓
Fills form: Full Name, School Name, Location, Trainer Type, Email, Password
↓
System checks if first user → becomes ADMIN, else becomes TRAINER
↓
System finds or creates School record
↓
Creates User account with hashed password
↓
Redirects to /login
```

### 2. Login Flow

```
User visits /login
↓
Enters email + password
↓
NextAuth validates credentials
↓
Redirects based on role:
  - ADMIN/TEACHER → /dashboard
  - TRAINER → /trainer/dashboard
```

### 3. Trainer Daily Workflow

#### Mark Attendance:
```
Trainer clicks "Mark Attendance"
↓
Enters class label (e.g., "Grade 6-A")
↓
Takes photo using camera (mobile browser)
↓
Optionally gets GPS location (best effort)
↓
Submits → Photo uploaded to Cloudinary
↓
Attendance record saved with:
  - Photo URL
  - GPS coordinates (if available)
  - Timestamp
  - Class label
```

#### Create Daily Report:
```
Trainer clicks "Create Report"
↓
Fills form:
  - Class Label
  - Date & Time
  - Topics Taught
  - Summary
  - Notes (optional)
↓
Submits → Report saved to database
```

### 4. Teacher Daily Workflow

#### Create Training Report:
```
Teacher clicks "Training Report"
↓
Fills form:
  - Date & Time
  - Topics Taught (to trainers)
  - Summary
  - Notes (optional)
↓
Submits → Report saved as TEACHER_TRAINING type
```

#### View Reports:
```
Teacher views all reports
↓
Can filter by:
  - Type (Teacher Training / Trainer Class)
  - Date range
  - School
  - Trainer
```

#### Generate PDF:
```
Teacher clicks "Generate PDF"
↓
Selects date range (optional)
↓
System generates PDF with:
  - Attendance records table
  - Date range
  - Signature area for principal
  - Stamp area
↓
PDF downloads → Print → Stamp/Sign → Upload to LMS (manual)
```

## Database Schema

### Users Collection
```typescript
{
  _id: ObjectId
  name: string
  email: string (unique, lowercase)
  passwordHash: string (bcrypt)
  role: 'ADMIN' | 'TEACHER' | 'TRAINER_ROBOCHAMPS' | 'TRAINER_SCHOOL'
  schoolId?: ObjectId (for trainers)
  trainerType?: 'ROBOCHAMPS' | 'SCHOOL'
  createdAt: Date
  updatedAt: Date
}
```

### Schools Collection
```typescript
{
  _id: ObjectId
  name: string
  locationText: string
  createdByUserId?: ObjectId
  createdAt: Date
  updatedAt: Date
}
```

### AttendanceRecords Collection
```typescript
{
  _id: ObjectId
  schoolId: ObjectId
  trainerId: ObjectId
  classLabel: string
  datetime: Date
  photoUrl: string (Cloudinary URL)
  geo?: {
    lat: number
    lng: number
    accuracy?: number
    capturedAt: Date
  }
  createdAt: Date
}
```

### DailyReports Collection
```typescript
{
  _id: ObjectId
  type: 'TEACHER_TRAINING' | 'TRAINER_CLASS'
  schoolId?: ObjectId
  authorId: ObjectId
  classLabel?: string
  topics: string
  summary: string
  notes?: string
  datetime: Date
  createdAt: Date
}
```

## API Routes

### Authentication
- `POST /api/auth/signup` - Trainer signup
- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers

### Attendance
- `POST /api/attendance` - Mark attendance (with photo upload)
- `GET /api/attendance` - Get attendance records (with filters)

### Reports
- `POST /api/reports` - Create daily report
- `GET /api/reports` - Get reports (with filters)

### Cloudinary
- `GET /api/cloudinary/sign` - Get upload signature (for direct client upload)

## Frontend Pages

### Public
- `/` - Landing page (redirects based on auth)
- `/signup` - Trainer signup form
- `/login` - Login form

### Trainer Routes (`/trainer/*`)
- `/trainer/dashboard` - Trainer dashboard
- `/trainer/attendance` - Mark attendance (camera + GPS)
- `/trainer/reports` - View own reports
- `/trainer/reports/new` - Create daily report

### Admin/Teacher Routes (`/dashboard/*`)
- `/dashboard` - Admin/Teacher dashboard
- `/dashboard/training-report/new` - Create training report
- `/dashboard/reports` - View all reports
- `/dashboard/attendance` - View attendance + generate PDF

## Security Features

1. **Password Hashing** - bcrypt with salt rounds = 12
2. **JWT Sessions** - Stateless authentication via NextAuth
3. **Route Protection** - Middleware protects routes based on role
4. **Input Validation** - Zod schemas validate all inputs
5. **Photo Storage** - Cloudinary secure URLs (not stored on server)

## Mobile Features (PWA)

1. **Camera Access** - HTML5 camera capture (`capture="environment"`)
2. **GPS Location** - Browser geolocation API (best effort)
3. **Offline Capable** - Can be installed as PWA
4. **Responsive Design** - Works on all screen sizes

## File Storage Strategy

**Cloudinary Free Tier:**
- 25 GB storage
- 25 GB bandwidth/month
- Perfect for 40 users
- Automatic image optimization
- CDN delivery

**Why Cloudinary over MongoDB GridFS:**
- Faster uploads (direct client → Cloudinary)
- Better performance (CDN)
- Image transformations
- Free tier sufficient for needs

## Deployment Architecture

```
Vercel (Serverless)
├── Next.js App Router
├── API Routes (Serverless Functions)
├── Static Assets
└── Environment Variables

MongoDB Atlas (Free Tier)
├── Database: robochamps_erp
└── Collections: users, schools, attendanceRecords, dailyReports

Cloudinary (Free Tier)
└── Image Storage & CDN
```

## Future Enhancements (Not Built Yet)

1. **Approval Workflow** - Trainer submits → Teacher approves → School sees
2. **LMS Integration** - Direct API upload to LMS
3. **Student-Level Attendance** - Track individual students
4. **Notifications** - Email/SMS reminders
5. **Analytics Dashboard** - Charts and statistics
6. **Offline Mode** - Queue actions when offline
7. **Biometric Authentication** - Face recognition for attendance

## Adding Features Mid-Project

The architecture is designed to be extensible:

1. **Database**: Add new fields to existing collections (MongoDB is schema-less)
2. **API Routes**: Add new endpoints without breaking existing ones
3. **Frontend**: Add new pages/routes independently
4. **Permissions**: Role-based access is already in place

Example: To add approval workflow:
- Add `status` and `approvedBy` fields to `DailyReport` schema
- Add approval API endpoint
- Add approval UI in teacher dashboard
- No breaking changes to existing features

## Performance Considerations

- **40 Users**: System is designed for this scale
- **MongoDB Indexes**: Consider adding indexes on:
  - `users.email` (already unique)
  - `attendanceRecords.trainerId + datetime`
  - `dailyReports.authorId + datetime`
- **Image Optimization**: Cloudinary handles this automatically
- **Caching**: Consider adding Redis for session caching (if needed)

## Monitoring & Maintenance

1. **MongoDB Atlas**: Monitor database size and connections
2. **Cloudinary**: Monitor bandwidth usage
3. **Vercel**: Monitor function execution time
4. **Error Logging**: Consider adding Sentry or similar
