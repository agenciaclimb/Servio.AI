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
    console.error('❌ Uso: node scripts/test_auth_flow.mjs <FIREBASE_ID_TOKEN>');
    console.error('\n📋 Para obter o token:');
    console.error('1. Faça login no app (http://localhost:4173)');
    console.error('2. Clique no botão "Copiar ID Token" no banner superior');
    console.error('3. Cole o token como argumento deste script');
    console.error('\nOu no console do navegador:');
    console.error('  await window.getIdToken()');
    process.exit(1);
  }
  
  console.log(`Testing ${BASE} with provided token...\n`);
  
  const uploadOk = await testUploadUrl(token);
  
  console.log('\n' + (uploadOk ? '✅ All tests passed!' : '❌ Some tests failed'));
  process.exitCode = uploadOk ? 0 : 1;
}

main();
