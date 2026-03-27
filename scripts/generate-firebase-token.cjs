#!/usr/bin/env node
/**
 * Gera Firebase CI Token e exibe para adicionar ao GitHub
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔑 Gerando Firebase CI Token...\n');
console.log('📋 Um navegador será aberto para autenticação.\n');

const firebase = spawn('firebase', ['login:ci', '--no-localhost'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
  timeout: 180000
});

let tokenBuffer = '';
let errorBuffer = '';

firebase.stdout.on('data', (data) => {
  const output = data.toString();
  tokenBuffer += output;
  console.log(output);
  
  // Se encontrar token na saída
  if (output.includes('https://') || output.match(/^[a-zA-Z0-9_-]+$/m)) {
    if (output.trim().length > 50) {
      saveToken(output.trim());
    }
  }
});

firebase.stderr.on('data', (data) => {
  errorBuffer += data.toString();
  console.error('⚠️ ', data.toString());
});

firebase.on('close', (code) => {
  console.log('\n✅ Firebase login:ci completed');
  
  if (tokenBuffer) {
    // Extrair token da saída
    const lines = tokenBuffer.split('\n');
    const tokenLine = lines.find(l => l.length > 50 && !l.includes('http') && !l.includes('✓'));
    
    if (tokenLine) {
      const token = tokenLine.trim();
      console.log('\n🎉 TOKEN GERADO:\n');
      console.log(token);
      saveToken(token);
    }
  }
  
  if (code !== 0) {
    console.error('\n❌ Erro ao gerar token. Error code:', code);
    process.exit(1);
  }
});

function saveToken(token) {
  const tokenFile = path.join(__dirname, '..', '.firebase-token.txt');
  fs.writeFileSync(tokenFile, token);
  console.log('\n💾 Token salvo em:', tokenFile);
  console.log('\n📝 Próximas etapas:');
  console.log('1. Copie o token acima');
  console.log('2. GitHub → Settings → Secrets and variables → Actions');
  console.log('3. Click "New repository secret"');
  console.log('4. Name: FIREBASE_TOKEN');
  console.log('5. Value: [Cole o token aqui]');
  console.log('6. Click "Add secret"');
  console.log('\n🚀 Pronto! GitHub Actions vai deployar automaticamente!\n');
}

// Timeout
setTimeout(() => {
  console.error('\n❌ Timeout: Firebase login:ci não completou em 3 minutos');
  firebase.kill();
  process.exit(1);
}, 180000);
