import { ObjectId } from 'mongodb';

/** Normalize school id for MongoDB queries (string or ObjectId storage). */
export function schoolScopeFilter(schoolId: string) {
  const id = schoolId.toString();
  if (ObjectId.isValid(id)) {
    const oid = new ObjectId(id);
    return { $in: [id, oid] };
  }
  return id;
}
