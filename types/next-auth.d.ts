import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'ADMIN' | 'TEACHER' | 'TRAINER_ROBOCHAMPS' | 'TRAINER_SCHOOL';
      schoolId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'TEACHER' | 'TRAINER_ROBOCHAMPS' | 'TRAINER_SCHOOL';
    schoolId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'ADMIN' | 'TEACHER' | 'TRAINER_ROBOCHAMPS' | 'TRAINER_SCHOOL';
    schoolId?: string;
  }
}
