import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { getContainerClient, getReadSasUrl } from '@/lib/blob';
import { MAX_UPLOAD_BYTES, getAllowedContentType, matchesFileSignature } from '@/lib/fileValidation';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rows } = await pool.query(
    'SELECT * FROM documents ORDER BY created_at DESC'
  );

  // Swap each stored (bare, non-public) blob URL for a freshly-signed,
  // short-lived read URL — the stored URL alone 404s since the storage
  // account doesn't allow public access.
  const withSasUrls = rows.map((row) => {
    try {
      return { ...row, blob_url: getReadSasUrl(row.blob_url) };
    } catch (err) {
      console.error('Failed to sign blob URL for document', row.id, err);
      return row;
    }
  });

  return NextResponse.json(withSasUrls);
}

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return null;
  }
  return session;
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const title = formData.get('title') as string | null;
  const description = formData.get('description') as string | null;

  if (!file || !title) {
    return NextResponse.json({ error: 'File and title are required' }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File exceeds the maximum allowed size (${MAX_UPLOAD_BYTES / (1024 * 1024)}MB).` },
      { status: 413 }
    );
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const safeContentType = getAllowedContentType(ext);
  if (!safeContentType) {
    return NextResponse.json(
      { error: 'Unsupported file type. Allowed: PDF, DOC(X), XLS(X), PPT(X).' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Verify the file's actual bytes match the declared extension — a
  // renamed .html uploaded as "report.pdf" fails this check even though
  // the extension and client-supplied MIME type both look fine.
  if (!matchesFileSignature(buffer, ext)) {
    return NextResponse.json(
      { error: 'File contents do not match the declared file type.' },
      { status: 400 }
    );
  }

  const container = getContainerClient();
  // Random, non-user-derived blob name: closes the path-traversal surface
  // entirely (VAPT-06) since nothing from the request body reaches the path.
  const blobName = `${randomUUID()}.${ext}`;
  const blockBlobClient = container.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      // Forced, verified content type — never the client-supplied file.type
      // — plus Content-Disposition so a browser downloads rather than
      // renders the file, even for a type a viewer might otherwise sniff.
      blobContentType: safeContentType,
      blobContentDisposition: `attachment; filename="${encodeURIComponent(title)}.${ext}"`,
    },
  });

  const { rows } = await pool.query(
    `INSERT INTO documents (title, description, blob_url, uploaded_by)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [title, description, blockBlobClient.url, session.user?.name || session.user?.email]
  );

  return NextResponse.json(rows[0], { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { rows } = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING blob_url', [id]);
  if (rows[0]) {
    try {
      const container = getContainerClient();
      const url = new URL(rows[0].blob_url);
      const blobName = url.pathname.split('/').pop();
      if (blobName) await container.deleteBlob(decodeURIComponent(blobName));
    } catch (err) {
      console.warn('Could not delete blob', err);
    }
  }

  return NextResponse.json({ success: true });
}
