#!/usr/bin/env node
/**
 * Fetch Cloud Run logs directly via REST API
 * No gcloud CLI needed - uses Application Default Credentials
 */

import { GoogleAuth } from 'google-auth-library';

const PROJECT_ID = 'gen-lang-client-0737507616';
const SERVICE_NAME = 'servio-backend';

async function fetchLogs() {
  try {
    console.log('🔍 Fetching Cloud Run error logs...\n');
    
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/logging.read']
    });
    
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    // Changed: look for stdout/stderr logs, not just HTTP requests
    const filter = `resource.type="cloud_run_revision" AND resource.labels.service_name="${SERVICE_NAME}" AND (severity>=ERROR OR textPayload=~"Error")`;
    const url = `https://logging.googleapis.com/v2/entries:list`;
    
    const body = {
      resourceNames: [`projects/${PROJECT_ID}`],
      filter: filter,
      orderBy: 'timestamp desc',
      pageSize: 10
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    
    if (!data.entries || data.entries.length === 0) {
      console.log('✅ No error logs found! Backend might be working correctly.');
      console.log('   (Or errors happened before the current time window)');
      return;
    }
    
    console.log(`Found ${data.entries.length} error log entries:\n`);
    console.log('='.repeat(80));
    
    for (const entry of data.entries) {
      const timestamp = entry.timestamp || 'No timestamp';
      
      // Try multiple payload formats
      let text = entry.textPayload;
      if (!text && entry.jsonPayload) {
        text = entry.jsonPayload.message || 
               entry.jsonPayload.textPayload ||
               JSON.stringify(entry.jsonPayload, null, 2);
      }
      if (!text && entry.protoPayload) {
        text = JSON.stringify(entry.protoPayload, null, 2);
      }
      if (!text) {
        text = JSON.stringify(entry, null, 2);
      }
      
      console.log(`\n[${timestamp}]`);
      console.log(text);
      console.log('-'.repeat(80));
    }
    
  } catch (error) {
    console.error('❌ Error fetching logs:', error.message);
    console.error('\n💡 Try: gcloud auth application-default login');
    process.exit(1);
  }
}

fetchLogs();
