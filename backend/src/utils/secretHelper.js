import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

let client;
function getClient() {
  if (!client) client = new SecretManagerServiceClient();
  return client;
}

export async function getSecret(projectId, secretName) {
  try {
    const sm = getClient();
    const [version] = await sm.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });
    return version.payload?.data?.toString() || '';
  } catch (err) {
    return '';
  }
}

export async function getPlacesApiKey() {
  // Prefer env var provided by Cloud Run secret mount
  if (process.env.PLACES_API_KEY) return process.env.PLACES_API_KEY;
  // Fallback to Secret Manager (project id must be set via env)
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '';
  if (!projectId) return '';
  return await getSecret(projectId, 'GOOGLE_PLACES_API_KEY');
}