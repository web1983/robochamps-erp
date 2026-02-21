import clientPromise from './mongodb';

export interface User {
  _id?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'TEACHER' | 'TRAINER_ROBOCHAMPS' | 'TRAINER_SCHOOL';
  schoolId?: string;
  trainerType?: 'ROBOCHAMPS' | 'SCHOOL';
  createdAt: Date;
  updatedAt: Date;
}

export interface School {
  _id?: string;
  name: string;
  locationText: string;
  schoolCode?: string;
  createdByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  _id?: string;
  schoolId: string;
  trainerId: string;
  classLabel: string;
  datetime: Date;
  photoUrl: string;
  geo?: {
    lat: number;
    lng: number;
    accuracy?: number;
    capturedAt: Date;
  };
  createdAt: Date;
}

export interface DailyReport {
  _id?: string;
  type: 'TEACHER_TRAINING' | 'TRAINER_CLASS';
  schoolId?: string;
  authorId: string;
  classLabel?: string;
  topics: string;
  summary: string;
  notes?: string;
  datetime: Date;
  createdAt: Date;
}

export interface MeetingLink {
  _id?: string;
  title: string;
  url: string;
  description?: string;
  createdBy: string;
  isActive: boolean;
  clickCount: number;
  scheduledDate?: Date;
  scheduledTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingLinkClick {
  _id?: string;
  meetingLinkId: string;
  userId: string;
  userName: string;
  userEmail: string;
  schoolName?: string;
  clickedAt: Date;
}

export async function getDb() {
  try {
    const client = await clientPromise();
    return client.db('robochamps_erp');
  } catch (error: any) {
    console.error('Database connection error:', error);
    throw new Error(`Database connection failed: ${error.message || 'Unknown error'}. Please check your MongoDB connection string and IP whitelist.`);
  }
}

export async function getCollection<T>(name: string): Promise<any> {
  const db = await getDb();
  return db.collection(name) as any;
}
