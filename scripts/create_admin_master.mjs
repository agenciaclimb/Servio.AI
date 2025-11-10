// Script para criar usuário admin master no Firestore via backend API
// Uso: node scripts/create_admin_master.mjs <email>
import fetch from 'node-fetch';

const API_BASE = process.env.VITE_BACKEND_API_URL || 'https://servio-backend-h5ogjon7aa-uw.a.run.app';
const email = process.argv[2];
if (!email) {
  console.error('Uso: node scripts/create_admin_master.mjs admin@example.com');
  process.exit(1);
}

async function main() {
  try {
    // Verifica se já existe
    const getRes = await fetch(`${API_BASE}/users/${encodeURIComponent(email)}`);
    if (getRes.ok) {
      const existing = await getRes.json();
      if (existing?.email) {
        console.log('Usuário já existe, atualizando para admin...');
        await fetch(`${API_BASE}/users/${encodeURIComponent(email)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'admin', status: 'ativo', roles: ['master'] })
        });
        console.log('✅ Convertido para admin master.');
        return;
      }
    }

    console.log('Criando usuário admin master...');
    const createRes = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: email.split('@')[0],
        type: 'admin',
        status: 'ativo',
        bio: 'Admin master do sistema.',
        location: 'São Paulo, SP',
        roles: ['master']
      })
    });
    if (!createRes.ok) {
      throw new Error(`Falha ao criar usuário: ${createRes.status} ${createRes.statusText}`);
    }
    console.log('✅ Usuário admin master criado com sucesso.');
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

main();
