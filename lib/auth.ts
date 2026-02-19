import { compare, hash } from 'bcryptjs';
import { getCollection, User } from './db';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getCollection<User>('users');
  return users.findOne({ email: email.toLowerCase() });
}

export async function createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const users = await getCollection<User>('users');
  const now = new Date();
  
  const user: User = {
    ...userData,
    createdAt: now,
    updatedAt: now,
  };
  
  const result = await users.insertOne(user);
  return { ...user, _id: result.insertedId.toString() };
}

export async function isFirstUser(): Promise<boolean> {
  const users = await getCollection<User>('users');
  const count = await users.countDocuments();
  return count === 0;
}
