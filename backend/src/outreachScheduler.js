
const admin = require('firebase-admin');

/**
 * Processa de forma escalável os registros de outreach pendentes.
 * Busca apenas documentos elegíveis no Firestore e os atualiza em lote.
 * 
 * Critérios de Elegibilidade:
 * - status === 'email_sent'
 * - optOut === false
 * - whatsappSentAt === null
 * - followUpEligibleAt <= AGORA
 * 
 * @param {Object} deps Dependências injetadas para teste.
 * @param {import('firebase-admin').firestore.Firestore} deps.db Instância do Firestore.
 * @param {(msg: string, phone?: string) => Promise<{success:boolean}>} deps.sendWhatsApp Função para enviar WhatsApp.
 * @returns {Promise<Array<{id:string, status:string, error?:string}>>} Resultados do processamento.
 */
async function processPendingOutreach({ db = admin.firestore(), sendWhatsApp = defaultWhatsAppStub } = {}) {
  if (!db) {
    throw new Error('Instância do Firestore não está disponível.');
  }

  const now = Date.now();
  const outreachQuery = db.collection('prospector_outreach')
    .where('status', '==', 'email_sent')
    .where('optOut', '==', false)
    .where('whatsappSentAt', '==', null)
    .where('followUpEligibleAt', '<=', now);

  const snapshot = await outreachQuery.get();
  if (snapshot.empty) {
    console.log('Nenhum outreach pendente encontrado.');
    return [];
  }

  const batch = db.batch();
  const results = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const message = `Olá ${data.providerName}, acompanhando seu convite para conhecer a Servio.AI. Posso ajudar no cadastro?`;
    
    try {
      const sendResult = await sendWhatsApp(message, data.providerPhone);
      if (!sendResult.success) {
        throw new Error(sendResult.error || 'Falha simulada no envio de WhatsApp');
      }
      
      batch.update(doc.ref, { status: 'whatsapp_sent', whatsappSentAt: Date.now() });
      results.push({ id: doc.id, status: 'whatsapp_sent' });

    } catch (err) {
      const errorMsg = err.message || String(err);
      const newHistory = Array.isArray(data.errorHistory) ? [...data.errorHistory, { at: Date.now(), error: errorMsg }] : [{ at: Date.now(), error: errorMsg }];
      
      batch.update(doc.ref, { errorHistory: newHistory });
      results.push({ id: doc.id, status: 'error', error: errorMsg });
    }
  }

  await batch.commit();
  return results;
}

// Função stub para simular o envio de WhatsApp em testes ou desenvolvimento.
function defaultWhatsAppStub(message, phone) {
  const isSuccess = Math.random() < 0.85; // 85% de chance de sucesso
  return Promise.resolve({ 
    success: isSuccess,
    phone,
    message,
    error: isSuccess ? undefined : 'SIMULATED_FAILURE'
  });
}

module.exports = { processPendingOutreach };
