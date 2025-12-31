/**
 * Email Service - SendGrid Integration
 * Envio de emails de prospecção com tracking
 */

const sgMail = require('@sendgrid/mail');
const admin = require('firebase-admin');

// Inicializa SendGrid com a API Key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'prospeccao@servio.ai';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Servio.AI';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('⚠️  SENDGRID_API_KEY não configurada - emails não serão enviados');
}

/**
 * Envia email de prospecção personalizado
 * @param {Object} lead - Dados do lead { email, name, category }
 * @param {string} template - Nome do template ou conteúdo HTML
 * @param {Object} options - Opções { subject, trackOpens, trackClicks }
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendProspectEmail(lead, template, options = {}) {
  try {
    if (!SENDGRID_API_KEY) {
      console.log('📧 [MOCK] Email enviado para:', lead.email);
      return { success: true, mock: true, messageId: `mock_${Date.now()}` };
    }

    const {
      subject = `${lead.name}, uma oportunidade exclusiva aguarda você!`,
      trackOpens = true,
      trackClicks = true,
      customArgs = {},
    } = options;

    // Personaliza o conteúdo do email
    let htmlContent = template;

    // Se for um template name, carrega o conteúdo
    if (typeof template === 'string' && !template.includes('<html>')) {
      htmlContent = await loadEmailTemplate(template, lead);
    }

    // Substitui placeholders
    htmlContent = htmlContent
      .replace(/\{nome\}/g, lead.name)
      .replace(/\{categoria\}/g, lead.category || 'profissional')
      .replace(/\{email\}/g, lead.email);

    const msg = {
      to: lead.email,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      subject,
      html: htmlContent,
      trackingSettings: {
        clickTracking: { enable: trackClicks, enableText: false },
        openTracking: { enable: trackOpens },
        subscriptionTracking: { enable: false },
      },
      customArgs: {
        leadId: lead.id || '',
        category: lead.category || '',
        source: 'prospecting',
        ...customArgs,
      },
    };

    const response = await sgMail.send(msg);

    // Salva log de envio no Firestore
    await logEmailSent(lead, msg, response[0].statusCode);

    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      statusCode: response[0].statusCode,
    };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.response?.body || error.message);

    // Salva log de erro
    await logEmailError(lead, error);

    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
}

/**
 * Envia emails em massa com rate limiting
 * @param {Array} leads - Lista de leads [{ email, name, category, id }]
 * @param {string} template - Template HTML ou nome do template
 * @param {Object} options - Opções de envio
 * @returns {Promise<Object>} { sent, failed, results }
 */
async function sendBulkEmails(leads, template, options = {}) {
  const results = {
    sent: 0,
    failed: 0,
    details: [],
  };

  const batchSize = 100; // SendGrid recomenda max 100 por request
  const delayBetweenBatches = 1000; // 1 segundo entre batches

  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);

    // Processa batch em paralelo
    const batchResults = await Promise.all(
      batch.map(lead => sendProspectEmail(lead, template, options))
    );

    // Contabiliza resultados
    batchResults.forEach((result, idx) => {
      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
      }

      results.details.push({
        leadId: batch[idx].id,
        email: batch[idx].email,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });
    });

    // Aguarda antes do próximo batch (rate limiting)
    if (i + batchSize < leads.length) {
      await sleep(delayBetweenBatches);
    }
  }

  return results;
}

/**
 * Carrega template de email do Firestore ou retorna template padrão
 * @param {string} templateName - Nome do template
 * @param {Object} lead - Dados do lead
 * @returns {Promise<string>} HTML do template
 */
async function loadEmailTemplate(templateName, lead) {
  try {
    const db = admin.firestore();
    const templateDoc = await db.collection('email_templates').doc(templateName).get();

    if (templateDoc.exists) {
      return templateDoc.data().html;
    }

    // Template padrão se não encontrar
    return getDefaultTemplate(lead);
  } catch (error) {
    console.error('Erro ao carregar template:', error);
    return getDefaultTemplate(lead);
  }
}

/**
 * Template padrão de email de prospecção
 * @param {Object} lead - Dados do lead
 * @returns {string} HTML do email
 */
function getDefaultTemplate(lead) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite Servio.AI</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6B46C1 0%, #4C51BF 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Servio.AI</h1>
    <p style="color: #E9D8FD; margin: 10px 0 0 0;">A plataforma que conecta você a mais clientes</p>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; margin-top: 0;">Olá <strong>{nome}</strong>,</p>
    
    <p>Sou da <strong>Servio.AI</strong>, a plataforma inteligente que está revolucionando a forma como profissionais como você encontram novos clientes.</p>
    
    <p><strong>Por que estou entrando em contato?</strong></p>
    
    <p>Identificamos que você é um(a) <strong>{categoria}</strong> qualificado(a) e temos uma proposta especial:</p>
    
    <div style="background: #F7FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 16px;"><strong>✨ Benefícios exclusivos:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Receba solicitações de clientes prontos para contratar</li>
        <li>Sistema de pagamento seguro com garantia</li>
        <li>Agenda inteligente para gerenciar seus serviços</li>
        <li>Sem mensalidade - você só paga quando fecha negócio</li>
        <li>Avaliações e reputação que atraem mais clientes</li>
      </ul>
    </div>
    
    <p><strong>📊 Mais de 5.000 profissionais</strong> já estão recebendo solicitações diariamente na Servio.AI.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://servio-ai.com/cadastro-prestador?ref=email&email={email}" 
         style="background: linear-gradient(135deg, #6B46C1 0%, #4C51BF 100%); 
                color: white; 
                padding: 15px 40px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-size: 18px; 
                font-weight: bold; 
                display: inline-block;">
        🚀 Quero Me Cadastrar Agora
      </a>
    </div>
    
    <p style="font-size: 14px; color: #718096; margin-top: 30px;">
      <strong>Cadastro 100% gratuito.</strong> Você pode cancelar quando quiser.
    </p>
    
    <p style="margin-top: 30px;">
      Qualquer dúvida, estou à disposição!<br>
      Atenciosamente,<br>
      <strong>Equipe Servio.AI</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #718096; font-size: 12px;">
    <p>Servio.AI - Conectando profissionais a oportunidades</p>
    <p>
      <a href="https://servio-ai.com" style="color: #6B46C1; text-decoration: none;">servio-ai.com</a> | 
      <a href="mailto:contato@servio.ai" style="color: #6B46C1; text-decoration: none;">contato@servio.ai</a>
    </p>
    <p style="margin-top: 10px;">
      <a href="{{unsubscribe}}" style="color: #A0AEC0; text-decoration: none; font-size: 11px;">
        Não desejo mais receber emails
      </a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Salva log de email enviado no Firestore
 */
async function logEmailSent(lead, msg, statusCode) {
  try {
    const db = admin.firestore();
    await db.collection('email_logs').add({
      type: 'sent',
      leadId: lead.id || null,
      email: lead.email,
      subject: msg.subject,
      statusCode,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      customArgs: msg.customArgs,
    });
  } catch (error) {
    console.error('Erro ao salvar log de email:', error);
  }
}

/**
 * Salva log de erro de email no Firestore
 */
async function logEmailError(lead, error) {
  try {
    const db = admin.firestore();
    await db.collection('email_logs').add({
      type: 'error',
      leadId: lead.id || null,
      email: lead.email,
      error: error.message,
      code: error.code,
      erroredAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('Erro ao salvar log de erro:', err);
  }
}

/**
 * Helper: sleep promise
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Webhook handler para eventos do SendGrid (opens, clicks, bounces)
 * @param {Object} events - Array de eventos do SendGrid
 * @returns {Promise<void>}
 */
async function handleWebhookEvents(events) {
  const db = admin.firestore();

  for (const event of events) {
    const { event: eventType, email, timestamp, sg_message_id, leadId } = event;

    try {
      // Salva evento no Firestore
      await db.collection('email_events').add({
        eventType,
        email,
        leadId: leadId || null,
        messageId: sg_message_id,
        timestamp: new Date(timestamp * 1000),
        rawEvent: event,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Atualiza atividade do lead
      if (leadId) {
        const leadRef = db.collection('prospector_prospects').doc(leadId);
        const updateData = {};

        if (eventType === 'open') {
          updateData.emailOpened = true;
          updateData.emailOpenedAt = new Date(timestamp * 1000);
          updateData.engagementScore = admin.firestore.FieldValue.increment(5);
        } else if (eventType === 'click') {
          updateData.emailClicked = true;
          updateData.emailClickedAt = new Date(timestamp * 1000);
          updateData.engagementScore = admin.firestore.FieldValue.increment(10);
          updateData.stage = 'hot'; // Move para "quente" automaticamente
        } else if (eventType === 'bounce' || eventType === 'dropped') {
          updateData.emailInvalid = true;
          updateData.emailBounced = true;
        }

        if (Object.keys(updateData).length > 0) {
          await leadRef.update(updateData);
        }
      }
    } catch (error) {
      console.error('Erro ao processar evento de email:', error);
    }
  }
}

module.exports = {
  sendProspectEmail,
  sendBulkEmails,
  handleWebhookEvents,
  getDefaultTemplate,
};
