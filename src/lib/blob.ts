import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from '@azure/storage-blob';

const containerName = process.env.AZURE_STORAGE_CONTAINER || 'documents';

export function getContainerClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING');
  }
  const service = BlobServiceClient.fromConnectionString(connectionString);
  return service.getContainerClient(containerName);
}

// Our storage account disallows public blob access (a security default),
// so a bare blob URL 404s with PublicAccessNotPermitted. Instead, sign a
// short-lived read-only SAS token per request so links work without
// exposing the container publicly or baking a long-lived secret into the DB.
export function getReadSasUrl(blobUrl: string, expiresInMinutes = 60): string {
  const container = getContainerClient();
  const credential = container.credential as StorageSharedKeyCredential;

  const url = new URL(blobUrl);
  const blobName = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      startsOn: new Date(Date.now() - 5 * 60 * 1000),
      expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    },
    credential
  ).toString();

  return `${url.origin}${url.pathname}?${sas}`;
}
