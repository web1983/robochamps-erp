import { ObjectId } from 'mongodb';
import { getCollection, School } from '@/lib/db';

/** Normalize school id for MongoDB queries (string or ObjectId storage). */
export function schoolScopeFilter(schoolId: string) {
  const id = schoolId.toString();
  if (ObjectId.isValid(id)) {
    const oid = new ObjectId(id);
    return { $in: [id, oid] };
  }
  return id;
}

/** Resolve a school document whether _id is stored as ObjectId or string. */
export async function findSchoolById(schoolId: string) {
  const id = schoolId?.toString().trim();
  if (!id) return null;

  const schools = await getCollection<School>('schools');
  if (ObjectId.isValid(id)) {
    const byOid = await schools.findOne({ _id: new ObjectId(id) as any });
    if (byOid) return byOid;
  }
  return schools.findOne({ _id: id as any });
}

export function normalizeSchoolId(value: unknown): string | null {
  if (value == null || value === '') return null;
  const id = String(value).trim();
  return id || null;
}
