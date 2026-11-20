// HTML-encoding and header-injection protection for user-supplied values
// that get interpolated into email templates (VAPT-04).

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Strips CR/LF so a value can't inject extra headers (or SMTP command
// sequences) when placed into a subject line or other header field.
export function stripCrlf(value: unknown): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ');
}

// Loose allowlist for free-text identity fields (names, IDs) submitted on
// the booking form (VAPT-09): letters (incl. accented), digits, spaces, and
// a small set of punctuation that appears in real names/reg-numbers. No
// HTML/script-relevant characters are permitted through.
const PERSON_FIELD_RE = /^[\p{L}\p{N} .,'\-/]+$/u;

export function isValidPersonField(value: unknown, maxLength = 100): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return false;
  return PERSON_FIELD_RE.test(trimmed);
}
