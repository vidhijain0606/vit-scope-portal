// CSV formula-injection (CWE-1236) protection for the admin export (VAPT-03).
// A cell beginning with =, +, -, @, a tab, or a carriage return is treated
// as a live formula by Excel/LibreOffice when the CSV is opened — prefixing
// it with a single quote forces it to be read as literal text instead.
const FORMULA_TRIGGER_CHARS = ['=', '+', '-', '@', '\t', '\r'];

export function csvCell(value: unknown): string {
  let str = String(value ?? '');

  if (FORMULA_TRIGGER_CHARS.some((c) => str.startsWith(c))) {
    str = `'${str}`;
  }

  // Standard CSV quoting: double any internal quotes, wrap the whole cell
  // in quotes so commas/newlines inside the value can't break row structure.
  return `"${str.replace(/"/g, '""')}"`;
}
