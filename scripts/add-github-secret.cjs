#!/usr/bin/env node
/**
 * GitHub Secrets Manager
 * Adiciona FIREBASE_TOKEN automaticamente via GitHub API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const FIREBASE_TOKEN = '1//0h-Zg_2HXzEFYCgYIARAAGBESNwF-L9Irx1XDfkSOdSJJmfpKCrLB_mu7B6Z1YHGcx-I3To5NzPMD\naRxYpyZeRn1NFGcq0wpipAA';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'agenciaclimb/Servio.AI';

if (!GITHUB_TOKEN) {
  console.log('❌ GITHUB_TOKEN não está definido');
  console.log('\n📝 Adicione manualmente via GitHub:');
  console.log('   1. https://github.com/' + REPO + '/settings/secrets/actions');
  console.log('   2. Click "New repository secret"');
  console.log('   3. Name: FIREBASE_TOKEN');
  console.log('   4. Value: [Cole o token]');
  console.log('\n💡 Ou defina GITHUB_TOKEN na variável de ambiente:');
  console.log('   $env:GITHUB_TOKEN = "ghp_xxxxx"');
  console.log('   node scripts/add-github-secret.cjs\n');
  process.exit(1);
}

console.log('🔐 Adicionando FIREBASE_TOKEN ao GitHub Secrets...\n');

const options = {
  hostname: 'api.github.com',
  port: 443,
  path: `/repos/${REPO}/actions/secrets/FIREBASE_TOKEN`,
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Firebase-Deploy-Script'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 201 || res.statusCode === 204) {
      console.log('✅ FIREBASE_TOKEN adicionado ao GitHub Secrets!');
      console.log('\n🚀 Próximos passos:');
      console.log('  1. git commit --allow-empty -m "ci: enable firebase hosting deployment"');
      console.log('  2. git push origin main');
      console.log('  3. Verifique: https://github.com/' + REPO + '/actions');
    } else {
      console.error('❌ Erro ao adicionar secret:');
      console.error('Status:', res.statusCode);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
  process.exit(1);
});

// Enviar o payload
const payload = {
  encrypted_value: Buffer.from(FIREBASE_TOKEN).toString('base64'),
  key_id: '568250167'  // GitHub's default public key ID
};

req.write(JSON.stringify(payload));
req.end();
