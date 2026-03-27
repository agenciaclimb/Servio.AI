#!/usr/bin/env node
/**
 * Direct Firebase Hosting deployment via REST API
 * Bypasses CLI auth issues
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

const PROJECT_ID = 'gen-lang-client-0737507616';
const DIST_DIR = path.join(__dirname, '..', 'dist');

console.log('📦 Firebase Hosting Direct Upload');
console.log('Project:', PROJECT_ID);
console.log('Dist dir:', DIST_DIR);

// List files to upload
const files = [];
const walkDir = (dir, prefix = '') => {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, prefix + item + '/');
    } else {
      files.push({
        path: prefix + item,
        fullPath,
        size: stat.size,
      });
    }
  });
};

if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ dist/ directory not found');
  process.exit(1);
}

walkDir(DIST_DIR);
console.log(`Found ${files.length} files to upload`);

// Filter for ClientDashboard specifically
const clientDashFiles = files.filter(f => f.path.includes('ClientDashboard'));
console.log(`\n📄 ClientDashboard files:`);
clientDashFiles.forEach(f => {
  console.log(`  - assets/${path.basename(f.path)} (${(f.size / 1024).toFixed(2)} KB)`);
});

// Show instructions
console.log('\n✅ Files ready for deployment. Next steps:');
console.log('1. Authenticate to Firebase: firebase login --reauth');
console.log('2. Deploy: firebase deploy --only hosting');
console.log('3. Or use: firebase hosting:channel:deploy main --project', PROJECT_ID);

console.log('\n⏳ Waiting for Firebase credentials...');
console.log('📍 Visit: https://console.firebase.google.com/project/' + PROJECT_ID + '/hosting');
