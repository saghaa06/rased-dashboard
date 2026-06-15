export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const headers = rows.length ? Object.keys(rows[0]) : [];

  const escapeCell = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Excel-safe CSV
    const needsQuotes = /[\n\r,;"]/.test(str);
    const escaped = str.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const csvLines = [
    headers.join(';'),
    ...rows.map((r) => headers.map((h) => escapeCell(r[h])).join(';')),
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

