#!/usr/bin/env node
/**
 * List all Firestore databases in the project
 */

import { GoogleAuth } from 'google-auth-library';

const PROJECT_ID = 'gen-lang-client-0737507616';

async function listDatabases() {
  try {
    console.log('🔍 Listing Firestore databases...\n');
    
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    
    if (!data.databases || data.databases.length === 0) {
      console.log('❌ No Firestore databases found in project!');
      console.log('\n💡 Create one at:');
      console.log(`https://console.firebase.google.com/project/${PROJECT_ID}/firestore`);
      return;
    }
    
    console.log(`Found ${data.databases.length} database(s):\n`);
    console.log('='.repeat(80));
    
    for (const db of data.databases) {
      const name = db.name.split('/').pop();
      const type = db.type || 'UNKNOWN';
      const location = db.locationId || 'UNKNOWN';
      const state = db.state || 'UNKNOWN';
      
      console.log(`\nDatabase: ${name}`);
      console.log(`  Type: ${type}`);
      console.log(`  Location: ${location}`);
      console.log(`  State: ${state}`);
      console.log(`  Full Name: ${db.name}`);
      console.log('-'.repeat(80));
    }
    
  } catch (error) {
    console.error('❌ Error listing databases:', error.message);
    process.exit(1);
  }
}

listDatabases();
