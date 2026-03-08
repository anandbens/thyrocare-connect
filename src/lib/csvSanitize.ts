/**
 * Sanitize a cell value to prevent CSV formula injection.
 * Prefixes dangerous characters with a single quote.
 */
export const sanitizeCsvCell = (value: unknown): string => {
  const str = String(value ?? "");
  // Characters that can trigger formula execution in spreadsheets
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  // Escape double quotes
  return str.replace(/"/g, '""');
};

/**
 * Build a safe CSV string from headers and rows.
 */
export const buildSafeCsv = (headers: string[], rows: (string | number | boolean)[][]): string => {
  const headerLine = headers.map((h) => `"${sanitizeCsvCell(h)}"`).join(",");
  const dataLines = rows.map((row) =>
    row.map((cell) => `"${sanitizeCsvCell(cell)}"`).join(",")
  );
  return [headerLine, ...dataLines].join("\n");
};

/**
 * Trigger a CSV file download.
 */
export const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
