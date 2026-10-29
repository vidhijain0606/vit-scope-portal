import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { getContainerClient, getReadSasUrl } from '@/lib/blob';

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

  const container = getContainerClient();
  const ext = file.name.split('.').pop();
  const blobName = `${Date.now()}_${title.replace(/\s+/g, '_')}.${ext}`;
  const blockBlobClient = container.getBlockBlobClient(blobName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: file.type },
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
