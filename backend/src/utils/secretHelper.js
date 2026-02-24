// const { SecretManagerServiceClient } = require('@google-cloud/secret-manager'); // Lazy loaded

let client;
function getClient() {
  if (!client) {
    const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
    client = new SecretManagerServiceClient();
  }
  return client;
}

async function getSecret(projectId, secretName) {
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

async function getPlacesApiKey() {
  if (process.env.PLACES_API_KEY) return process.env.PLACES_API_KEY;
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '';
  if (!projectId) return '';
  return await getSecret(projectId, 'GOOGLE_PLACES_API_KEY');
}

async function getStripeSecretKey() {
  if (process.env.STRIPE_SECRET_KEY) return process.env.STRIPE_SECRET_KEY;
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '';
  if (!projectId) return '';
  return await getSecret(projectId, 'STRIPE_SECRET_KEY');
}

async function getGeminiApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '';
  if (!projectId) return '';
  return await getSecret(projectId, 'GEMINI_API_KEY');
}

module.exports = {
  getSecret,
  getPlacesApiKey,
  getStripeSecretKey,
  getGeminiApiKey,
};
