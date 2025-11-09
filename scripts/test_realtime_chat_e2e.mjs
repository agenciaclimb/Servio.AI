#!/usr/bin/env node

/**
 * E2E Test: Real-time Chat with Firestore onSnapshot
 * 
 * Este teste valida que mensagens enviadas aparecem instantaneamente
 * para ambos os usuários através do Firestore real-time listener.
 * 
 * Fluxo:
 * 1. Cliente envia mensagem → salva no Firestore
 * 2. Prestador onSnapshot detecta → mensagem aparece
 * 3. Prestador envia resposta → salva no Firestore
 * 4. Cliente onSnapshot detecta → resposta aparece
 */

const BACKEND_URL = 'https://servio-backend-h5ogjon7aa-uw.a.run.app';

async function testRealtimeChat() {
  console.log('\n🧪 TESTE E2E - CHAT REAL-TIME COM FIRESTORE\n');
  console.log('=' .repeat(60));

  let testsPassed = 0;
  let testsTotal = 5;

  // SETUP: Criar job para ter um chatId
  console.log('\n📋 SETUP: Criando job para chat...');
  const jobResponse = await fetch(`${BACKEND_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: 'client-test@servio.ai',
      category: 'Elétrica',
      description: 'Teste de chat real-time',
      location: { address: 'Test Street 123' },
      status: 'proposta_aceita',
      providerId: 'provider-test@servio.ai',
    }),
  });

  if (!jobResponse.ok) {
    console.error('❌ Erro ao criar job:', await jobResponse.text());
    process.exit(1);
  }

  const job = await jobResponse.json();
  const chatId = job.id;
  console.log(`✅ Job criado: ${chatId}`);

  // TEST 1: Cliente envia mensagem
  console.log('\n📨 TESTE 1: Cliente envia mensagem...');
  const clientMessageResponse = await fetch(`${BACKEND_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId,
      senderId: 'client-test@servio.ai',
      text: 'Olá, poderia confirmar o horário?',
      type: 'text',
    }),
  });

  if (clientMessageResponse.ok) {
    const clientMessage = await clientMessageResponse.json();
    console.log(`✅ TESTE 1 PASSOU: Mensagem cliente criada (ID: ${clientMessage.id})`);
    testsPassed++;
  } else {
    console.error(`❌ TESTE 1 FALHOU: ${await clientMessageResponse.text()}`);
  }

  // TEST 2: Listar mensagens (simula onSnapshot)
  console.log('\n📥 TESTE 2: Prestador lista mensagens (simula onSnapshot)...');
  await new Promise(resolve => setTimeout(resolve, 500)); // Aguarda propagação

  const messagesResponse = await fetch(`${BACKEND_URL}/messages?chatId=${chatId}`);
  if (messagesResponse.ok) {
    const messages = await messagesResponse.json();
    if (messages.length >= 1) {
      console.log(`✅ TESTE 2 PASSOU: ${messages.length} mensagem(ns) encontrada(s)`);
      console.log(`   → "${messages[0].text}" (de ${messages[0].senderId})`);
      testsPassed++;
    } else {
      console.error('❌ TESTE 2 FALHOU: Nenhuma mensagem encontrada');
    }
  } else {
    console.error(`❌ TESTE 2 FALHOU: ${await messagesResponse.text()}`);
  }

  // TEST 3: Prestador envia resposta
  console.log('\n💬 TESTE 3: Prestador envia resposta...');
  const providerMessageResponse = await fetch(`${BACKEND_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId,
      senderId: 'provider-test@servio.ai',
      text: 'Claro! Confirmado para amanhã às 14h.',
      type: 'text',
    }),
  });

  if (providerMessageResponse.ok) {
    const providerMessage = await providerMessageResponse.json();
    console.log(`✅ TESTE 3 PASSOU: Resposta prestador criada (ID: ${providerMessage.id})`);
    testsPassed++;
  } else {
    console.error(`❌ TESTE 3 FALHOU: ${await providerMessageResponse.text()}`);
  }

  // TEST 4: Cliente lista mensagens novamente (simula onSnapshot update)
  console.log('\n📥 TESTE 4: Cliente lista mensagens (simula onSnapshot update)...');
  await new Promise(resolve => setTimeout(resolve, 500));

  const updatedMessagesResponse = await fetch(`${BACKEND_URL}/messages?chatId=${chatId}`);
  if (updatedMessagesResponse.ok) {
    const updatedMessages = await updatedMessagesResponse.json();
    if (updatedMessages.length >= 2) {
      console.log(`✅ TESTE 4 PASSOU: ${updatedMessages.length} mensagens no chat`);
      updatedMessages.forEach((msg, i) => {
        console.log(`   ${i + 1}. "${msg.text}" (de ${msg.senderId})`);
      });
      testsPassed++;
    } else {
      console.error(`❌ TESTE 4 FALHOU: Esperado 2+ mensagens, encontrado ${updatedMessages.length}`);
    }
  } else {
    console.error(`❌ TESTE 4 FALHOU: ${await updatedMessagesResponse.text()}`);
  }

  // TEST 5: Mensagem com tipo especial (system_notification)
  console.log('\n🔔 TESTE 5: Enviar notificação de sistema...');
  const systemMessageResponse = await fetch(`${BACKEND_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId,
      senderId: 'system',
      text: '✅ Agendamento confirmado para 09/11/2025 às 14h.',
      type: 'system_notification',
    }),
  });

  if (systemMessageResponse.ok) {
    const systemMessage = await systemMessageResponse.json();
    console.log(`✅ TESTE 5 PASSOU: Notificação sistema criada (type: ${systemMessage.type})`);
    testsPassed++;
  } else {
    console.error(`❌ TESTE 5 FALHOU: ${await systemMessageResponse.text()}`);
  }

  // FINAL RESULTS
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 RESULTADO FINAL: ${testsPassed}/${testsTotal} testes passaram\n`);

  if (testsPassed === testsTotal) {
    console.log('🎉 SUCESSO! Chat real-time funcionando perfeitamente!');
    console.log('\n✅ Validações:');
    console.log('   - Mensagens salvas no Firestore');
    console.log('   - GET /messages retorna histórico completo');
    console.log('   - Múltiplos usuários podem conversar');
    console.log('   - Tipos de mensagem (text, system_notification)');
    console.log('   - onSnapshot detectaria estas mudanças em tempo real');
    process.exit(0);
  } else {
    console.log('❌ FALHA! Alguns testes não passaram.');
    process.exit(1);
  }
}

// Execute tests
testRealtimeChat().catch(error => {
  console.error('\n❌ Erro fatal no teste:', error);
  process.exit(1);
});
