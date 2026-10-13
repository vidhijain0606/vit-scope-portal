import { BlobServiceClient } from '@azure/storage-blob';

const containerName = process.env.AZURE_STORAGE_CONTAINER || 'documents';

export function getContainerClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING');
  }
  const service = BlobServiceClient.fromConnectionString(connectionString);
  return service.getContainerClient(containerName);
}
