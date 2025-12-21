let SecretManagerServiceClient;
try {
  ({ SecretManagerServiceClient } = require('@google-cloud/secret-manager'));
} catch {
  SecretManagerServiceClient = null;
}

let client;
function getClient() {
  if (!SecretManagerServiceClient) return null;
  if (!client) client = new SecretManagerServiceClient();
  return client;
}

async function getSecret(projectId, secretName) {
  try {
    const sm = getClient();
    if (!sm) return '';
    const [version] = await sm.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });
    return version.payload?.data?.toString() || '';
  } catch (err) {
    return '';
  }
}

async function getPlacesApiKey() {
  // Prefer env var provided by Cloud Run secret mount
  if (process.env.PLACES_API_KEY) return process.env.PLACES_API_KEY;
  // Fallback to Secret Manager (project id must be set via env)
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '';
  if (!projectId) return '';
  return await getSecret(projectId, 'GOOGLE_PLACES_API_KEY');
}

module.exports = {
  getSecret,
  getPlacesApiKey,
};