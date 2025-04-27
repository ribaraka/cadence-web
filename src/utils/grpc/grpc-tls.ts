import * as grpc from '@grpc/grpc-js';
import fs from 'fs';

let cachedCredentials: grpc.ChannelCredentials | null = null;

export function initializeTLS(): boolean {
  if (cachedCredentials) {
    return true;
  }

  const caRootPath = process.env.CADENCE_GRPC_TLS_CA_FILE;
  if (caRootPath) {
    try {
      const rootCert = fs.readFileSync(caRootPath);
      cachedCredentials = grpc.credentials.createSsl(rootCert);
      return true;
    } catch {
      throw new Error(`Failed to read CA root file at ${caRootPath}`);
    }
  } else {
    cachedCredentials = grpc.credentials.createInsecure();
    return true;
  }
}

// Function to get the cached credentials (should only be called after initialization)
export function getChannelCredentials(): grpc.ChannelCredentials {
  if (!cachedCredentials) {
    throw new Error(
      'TLS credentials have not been initialized. Call initializeSSL first.'
    );
  }
  return cachedCredentials;
}
