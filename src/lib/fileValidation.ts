// Document upload validation (VAPT-02 / VAPT-06 / VAPT-10): a strict
// extension allowlist, file-signature (magic byte) verification so the
// declared extension can't be spoofed, and a size ceiling so a single
// upload can't exhaust server memory.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

// Extension -> the Content-Type we force on the blob, regardless of what
// the client claimed. Deliberately excludes anything that renders as
// HTML/SVG/script in a browser.
const ALLOWED_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

// Magic-byte signatures for the formats above. Zip-based Office formats
// (docx/xlsx/pptx) and legacy OLE formats (doc/xls/ppt) each share one
// signature across their group.
const SIGNATURES: { bytes: number[]; extensions: string[] }[] = [
  { bytes: [0x25, 0x50, 0x44, 0x46], extensions: ['pdf'] }, // %PDF
  { bytes: [0x50, 0x4b, 0x03, 0x04], extensions: ['docx', 'xlsx', 'pptx'] }, // PK.. (zip)
  { bytes: [0xd0, 0xcf, 0x11, 0xe0], extensions: ['doc', 'xls', 'ppt'] }, // OLE compound file
];

export function getAllowedContentType(extension: string): string | null {
  return ALLOWED_TYPES[extension.toLowerCase()] ?? null;
}

export function matchesFileSignature(buffer: Buffer, extension: string): boolean {
  const ext = extension.toLowerCase();
  const sig = SIGNATURES.find((s) => s.extensions.includes(ext));
  if (!sig) return false;
  if (buffer.length < sig.bytes.length) return false;
  return sig.bytes.every((byte, i) => buffer[i] === byte);
}
