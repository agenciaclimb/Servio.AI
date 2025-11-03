// Test authenticated backend endpoints (requires Firebase login)
// Usage: node scripts/test_auth_flow.mjs <FIREBASE_ID_TOKEN>

const BASE = process.env.VITE_BACKEND_API_URL || 'https://servio-backend-h5ogjon7aa-uw.a.run.app';

async function testUploadUrl(token) {
  const url = `${BASE}/generate-upload-url`;
  const payload = {
    fileName: 'test.jpg',
    contentType: 'image/jpeg',
    jobId: 'test-job-123',
  };
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    
    const data = await res.json();
    console.log(`POST /generate-upload-url → ${res.status}`);
    
    if (res.ok) {
      console.log('✅ Signed URL received:', data.signedUrl ? 'YES' : 'NO');
      console.log('✅ File path:', data.filePath || 'N/A');
      return true;
    } else {
      console.log('❌ Error:', data.error || data);
      return false;
    }
  } catch (e) {
    console.error('❌ Request failed:', e.message);
    return false;
  }
}

async function main() {
  const token = process.argv[2];
  
  if (!token) {
    console.error('Usage: node test_auth_flow.mjs <FIREBASE_ID_TOKEN>');
    console.error('\nTo get a token:');
    console.error('1. Open browser console on your app');
    console.error('2. Run: await firebase.auth().currentUser.getIdToken()');
    console.error('3. Copy the token and pass it as argument');
    process.exit(1);
  }
  
  console.log(`Testing ${BASE} with provided token...\n`);
  
  const uploadOk = await testUploadUrl(token);
  
  console.log('\n' + (uploadOk ? '✅ All tests passed!' : '❌ Some tests failed'));
  process.exitCode = uploadOk ? 0 : 1;
}

main();
