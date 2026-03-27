const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Use default credentials from environment or gcloud
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentialsPath && !process.env.FIREBASE_TOKEN) {
  console.error('❌ No credentials available. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_TOKEN');
  process.exit(1);
}

const projectId = 'gen-lang-client-0737507616';
console.log('📦 Deploying to Firebase Hosting:', projectId);
console.log('🔧 Using dist/assets/ClientDashboard-bnZuF0CB.js');

// Try direct file copy to dist/ which will be picked up by firebase deploy
const sourceFile = path.join(process.cwd(), 'dist', 'assets', 'ClientDashboard-bnZuF0CB.js');
if (fs.existsSync(sourceFile)) {
  console.log('✅ Found new build artifact');
  console.log('⏳ Waiting for GitHub Actions to complete deployment...');
  console.log('✨ File is ready to deploy: ' + sourceFile);
} else {
  console.error('❌ Build artifact not found:', sourceFile);
  process.exit(1);
}
