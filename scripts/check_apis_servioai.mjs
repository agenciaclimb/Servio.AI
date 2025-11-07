#!/usr/bin/env node
/**
 * Check if required Google Cloud APIs are enabled in servioai project
 */

import { GoogleAuth } from 'google-auth-library';

const PROJECT_ID = 'servioai';
const REQUIRED_APIS = [
  'run.googleapis.com',           // Cloud Run
  'artifactregistry.googleapis.com', // Artifact Registry
  'cloudbuild.googleapis.com',    // Cloud Build
  'firestore.googleapis.com',     // Firestore
  'storage.googleapis.com',       // Cloud Storage
  'iam.googleapis.com',           // IAM
  'cloudresourcemanager.googleapis.com' // Resource Manager
];

async function checkAPIs() {
  try {
    console.log(`🔍 Checking APIs in project: ${PROJECT_ID}\n`);
    
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    const url = `https://serviceusage.googleapis.com/v1/projects/${PROJECT_ID}/services?filter=state:ENABLED`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    const enabledAPIs = (data.services || []).map(s => s.config?.name).filter(Boolean);
    
    console.log('='.repeat(80));
    console.log('📋 API Status:\n');
    
    let allEnabled = true;
    for (const api of REQUIRED_APIS) {
      const enabled = enabledAPIs.includes(api);
      const status = enabled ? '✅ Enabled' : '❌ Disabled';
      console.log(`${status} - ${api}`);
      if (!enabled) allEnabled = false;
    }
    
    console.log('='.repeat(80));
    
    if (allEnabled) {
      console.log('\n✅ All required APIs are enabled!');
    } else {
      console.log('\n⚠️  Some APIs are disabled. Enable them with:');
      console.log(`\ngcloud services enable \\\n  ${REQUIRED_APIS.join(' \\\n  ')} \\\n  --project=${PROJECT_ID}\n`);
      console.log('Or via Console:');
      console.log(`https://console.cloud.google.com/apis/library?project=${PROJECT_ID}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking APIs:', error.message);
    console.error('\n💡 Make sure you have authenticated:');
    console.error('   gcloud auth application-default login');
    process.exit(1);
  }
}

checkAPIs();
