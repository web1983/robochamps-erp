import { ObjectId } from 'mongodb';

/** Match a field whether the DB stored a string or ObjectId. */
export function idEqualsClause(field: string, id: string | undefined | null): Record<string, unknown> | null {
  if (!id) return null;
  if (ObjectId.isValid(id)) {
    const oid = new ObjectId(id);
    return { $or: [{ [field]: id }, { [field]: oid }] };
  }
  return { [field]: id };
}

export function toIdString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (value instanceof ObjectId) return value.toString();
  return String(value);
}

export function toUtcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
