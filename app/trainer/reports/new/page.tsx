import { redirect } from 'next/navigation';

/** Merged into Log class session — keep URL for old links. */
export default function NewReportRedirectPage() {
  redirect('/trainer/attendance');
}
