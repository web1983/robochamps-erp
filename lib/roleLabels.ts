/** User-facing labels for roles and report types (internal codes unchanged). */

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  TEACHER: 'School View',
  TRAINER_ROBOCHAMPS: 'Robochamps Trainer',
  TRAINER_SCHOOL: 'School Trainer',
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  TEACHER_TRAINING: 'School View Training',
  TRAINER_CLASS: 'Trainer Class',
};

export function formatRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, ' ');
}

export function formatReportTypeLabel(type: string): string {
  return REPORT_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}
