/** Escape a cell for CSV (handles commas, quotes, newlines). */
export function escapeCsvCell(value: string): string {
  if (!value) return '';
  const escaped = value.replace(/"/g, '""');
  if (/[",\n\r]/.test(escaped)) {
    return `"${escaped}"`;
  }
  return escaped;
}

/** Build CSV with UTF-8 BOM so Excel opens URLs and special characters correctly. */
export function buildCsvDownloadContent(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const body = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  return `\uFEFF${headerLine}\n${body}`;
}

export function downloadCsvFile(filename: string, headers: string[], rows: string[][]): void {
  const csvContent = buildCsvDownloadContent(headers, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Same data as CSV; .xls extension helps Excel open it as a spreadsheet on Windows. */
export function downloadExcelCompatibleFile(filename: string, headers: string[], rows: string[][]): void {
  const csvContent = buildCsvDownloadContent(headers, rows);
  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.xls') ? filename : `${filename.replace(/\.csv$/i, '')}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
