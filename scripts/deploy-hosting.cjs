#!/usr/bin/env node
/**
 * Firebase Deploy bypassing interactive auth
 * Uses FIREBASE_TOKEN or falls back to service account
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const PROJECT_ID = 'gen-lang-client-0737507616';

console.log('🚀 Firebase Deploy via Service Account\n');

// Step 1: Check if dist/ exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ dist/ directory not found. Run: npm run build');
  process.exit(1);
}

// Step 2: Generate token from service account JSON
const saKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!saKeyPath || !fs.existsSync(saKeyPath)) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS not set or invalid');
  console.error('   Set: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json\n');
  
  // Try to read from C:\secrets\
  const secretsPath = 'C:\\secrets\\servio-prod-sa.json';
  if (fs.existsSync(secretsPath)) {
    console.log('ℹ️  Found service account at ' + secretsPath);
    console.log('   Run: $env:GOOGLE_APPLICATION_CREDENTIALS="' + secretsPath + '"');
  }
  process.exit(1);
}

try {
  console.log('✓ Using service account:', saKeyPath);
  
  // Try firebase deploy with the TOKEN approach
  console.log('⏳ Deploying to Firebase Hosting...\n');
  
  const cmd = `firebase deploy --only hosting --project ${PROJECT_ID}`;
  console.log('Command:', cmd, '\n');
  
  execSync(cmd, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('\n✅ Deployment successful!');
  console.log('🌐 Site: https://' + PROJECT_ID + '.web.app');
  
} catch (error) {
  console.error('\n❌ Deployment failed:',  error.message);
  console.error('\nAlternative: Use GitHub Actions workflow');
  process.exit(1);
}
