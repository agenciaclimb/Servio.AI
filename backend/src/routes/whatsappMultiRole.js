/**
 * WhatsApp Multi-Role Routes
 * 
 * Rotas para envio de mensagens WhatsApp para diferentes tipos de usuários:
 * - Cliente
 * - Prestador
 * - Prospector
 * - Admin
 */

const express = require('express');
const whatsappMultiRoleService = require('../whatsappMultiRoleService');
const logger = require('../logger');

const router = express.Router();

// ===== CLIENTE ROUTES =====

/**
 * POST /api/whatsapp/client/job-posted
 * Notifica cliente que seu job foi publicado
 */
router.post('/client/job-posted', async (req, res) => {
  try {
    const { phone, jobTitle, jobDescription, jobLocation, link } = req.body;

    if (!phone || !jobTitle) {
      return res.status(400).json({ error: 'Telefone e título do job obrigatórios' });
    }

    const result = await whatsappMultiRoleService.sendClientMessage(
      phone,
      'JOB_POSTED',
      { jobTitle, jobDescription, jobLocation, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao notificar job postado:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/client/proposal-received
 * Notifica cliente que recebeu uma proposta
 */
router.post('/client/proposal-received', async (req, res) => {
  try {
    const { phone, providerName, amount, rating, link } = req.body;

    if (!phone || !providerName) {
      return res.status(400).json({ error: 'Telefone e nome do prestador obrigatórios' });
    }

    const result = await whatsappMultiRoleService.sendClientMessage(
      phone,
      'PROPOSAL_RECEIVED',
      { providerName, amount, rating, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao notificar proposta recebida:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/client/proposal-accepted
 * Notifica cliente que sua proposta foi aceita
 */
router.post('/client/proposal-accepted', async (req, res) => {
  try {
    const { phone, providerName, startDate, link } = req.body;

    if (!phone || !providerName) {
      return res.status(400).json({ error: 'Telefone e nome do prestador obrigatórios' });
    }

    const result = await whatsappMultiRoleService.sendClientMessage(
      phone,
      'PROPOSAL_ACCEPTED',
      { providerName, startDate, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao notificar proposta aceita:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/client/job-completed
 * Notifica cliente que seu job foi concluído
 */
router.post('/client/job-completed', async (req, res) => {
  try {
    const { phone, jobTitle, link } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Telefone obrigatório' });
    }

    const result = await whatsappMultiRoleService.sendClientMessage(
      phone,
      'JOB_COMPLETED',
      { jobTitle, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao notificar job concluído:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/client/payment-reminder
 * Lembrete de pagamento para cliente
 */
router.post('/client/payment-reminder', async (req, res) => {
  try {
    const { phone, amount, providerName, link } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Telefone obrigatório' });
    }

    const result = await whatsappMultiRoleService.sendClientMessage(
      phone,
      'PAYMENT_REMINDER',
      { amount, providerName, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao enviar lembrete de pagamento:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== PRESTADOR ROUTES =====

/**
 * POST /api/whatsapp/provider/new-job
 * Notifica prestador sobre novo job disponível
 */
router.post('/provider/new-job', async (req, res) => {
  try {
    const { phone, category, location, budget, link } = req.body;

    if (!phone || !category) {
      return res.status(400).json({ error: 'Telefone e categoria obrigatórios' });
    }

    const result = await whatsappMultiRoleService.sendProviderMessage(
      phone,
      'NEW_JOB',
      { category, location, budget, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao notificar novo job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/provider/job-match
 * Notifica prestador que foi indicado para um job
 */
router.post('/provider/job-match', async (req, res) => {
  try {
    const { phone, jobTitle, location, link } = req.body;

    if (!phone || !jobTitle) {
      return res.status(400).json({ error: 'Telefone e título do job obrigatórios' });
    }

    const result = await whatsappMultiRoleService.sendProviderMessage(
      phone,
      'JOB_MATCH',
      { jobTitle, location, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao notificar indicação de job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/provider/proposal-status
 * Notifica prestador sobre status da proposta
 */
router.post('/provider/proposal-status', async (req, res) => {
  try {
    const { phone, status, jobTitle, amount, link } = req.body;

    if (!phone || !status) {
      return res.status(400).json({ error: 'Telefone e status obrigatórios' });
    }

    const result = await whatsappMultiRoleService.sendProviderMessage(
      phone,
      'PROPOSAL_STATUS',
      { status, jobTitle, amount, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao notificar status de proposta:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/provider/payment-received
 * Notifica prestador que recebeu pagamento
 */
router.post('/provider/payment-received', async (req, res) => {
  try {
    const { phone, amount, jobTitle, date, link } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ error: 'Telefone e valor obrigatórios' });
    }

    const result = await whatsappMultiRoleService.sendProviderMessage(
      phone,
      'PAYMENT_RECEIVED',
      { amount, jobTitle, date, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao notificar pagamento recebido:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== PROSPECTOR ROUTES =====

/**
 * POST /api/whatsapp/prospector/recruit-welcome
 * Mensagem de boas-vindas para novo recrutado
 */
router.post('/prospector/recruit-welcome', async (req, res) => {
  try {
    const { phone, prospectorName, link } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Telefone obrigatório' });
    }

    const result = await whatsappMultiRoleService.sendProspectorMessage(
      phone,
      'RECRUIT_WELCOME',
      { prospectorName, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao enviar boas-vindas para recrutado:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/prospector/commission-earned
 * Notifica prospector que ganhou comissão
 */
router.post('/prospector/commission-earned', async (req, res) => {
  try {
    const { phone, amount, reason, monthlyTotal, link } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ error: 'Telefone e valor obrigatórios' });
    }

    const result = await whatsappMultiRoleService.sendProspectorMessage(
      phone,
      'COMMISSION_EARNED',
      { amount, reason, monthlyTotal, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao notificar comissão ganha:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/prospector/badge-unlocked
 * Notifica prospector que desbloqueou badge
 */
router.post('/prospector/badge-unlocked', async (req, res) => {
  try {
    const { phone, badgeName, description, link } = req.body;

    if (!phone || !badgeName) {
      return res.status(400).json({ error: 'Telefone e nome do badge obrigatórios' });
    }

    const result = await whatsappMultiRoleService.sendProspectorMessage(
      phone,
      'BADGE_UNLOCKED',
      { badgeName, description, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao notificar badge desbloqueado:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/prospector/lead-reminder
 * Lembrete de follow-up com lead
 */
router.post('/prospector/lead-reminder', async (req, res) => {
  try {
    const { phone, leadName, daysSince, link } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Telefone obrigatório' });
    }

    const result = await whatsappMultiRoleService.sendProspectorMessage(
      phone,
      'LEAD_REMINDER',
      { leadName, daysSince, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao enviar lembrete de lead:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/prospector/referral-click
 * Notifica prospector que seu link foi clicado
 */
router.post('/prospector/referral-click', async (req, res) => {
  try {
    const { phone, clicksToday, clicksTotal, link } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Telefone obrigatório' });
    }

    const result = await whatsappMultiRoleService.sendProspectorMessage(
      phone,
      'REFERRAL_LINK_CLICK',
      { clicksToday, clicksTotal, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao notificar clique em link:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ADMIN ROUTES =====

/**
 * POST /api/whatsapp/admin/system-alert
 * Alerta de sistema para admin
 */
router.post('/admin/system-alert', async (req, res) => {
  try {
    const { phone, alertType, severity, description, link } = req.body;

    if (!phone || !alertType) {
      return res.status(400).json({ error: 'Telefone e tipo de alerta obrigatórios' });
    }

    const result = await whatsappMultiRoleService.sendAdminMessage(
      phone,
      'SYSTEM_ALERT',
      { alertType, severity, description, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao enviar alerta de sistema:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/admin/dispute-escalation
 * Notifica admin sobre disputa escalada
 */
router.post('/admin/dispute-escalation', async (req, res) => {
  try {
    const { phone, jobTitle, reason, clientName, providerName, link } = req.body;

    if (!phone || !jobTitle) {
      return res.status(400).json({ error: 'Telefone e título do job obrigatórios' });
    }

    const result = await whatsappMultiRoleService.sendAdminMessage(
      phone,
      'DISPUTE_ESCALATION',
      { jobTitle, reason, clientName, providerName, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao notificar disputa escalada:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/admin/daily-report
 * Relatório diário para admin
 */
router.post('/admin/daily-report', async (req, res) => {
  try {
    const { phone, jobsCreated, proposals, recruits, revenue, link } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Telefone obrigatório' });
    }

    const result = await whatsappMultiRoleService.sendAdminMessage(
      phone,
      'DAILY_REPORT',
      { jobsCreated, proposals, recruits, revenue, link }
    );

    res.json(result);
  } catch (error) {
    logger.error('Erro ao enviar relatório diário:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/multi-role/status
 * Status do serviço WhatsApp multi-role
 */
router.get('/status', async (req, res) => {
  try {
    const status = await whatsappMultiRoleService.getStatus();
    res.json(status);
  } catch (error) {
    logger.error('Erro ao obter status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/multi-role/templates/:userType
 * Lista templates disponíveis para um tipo de usuário
 */
router.get('/templates/:userType', (req, res) => {
  try {
    const { userType } = req.params;
    const templates = whatsappMultiRoleService.getAvailableTemplates(userType);
    
    if (Object.keys(templates).length === 0) {
      return res.status(404).json({ error: `Templates não encontrados para user type: ${userType}` });
    }

    res.json({
      userType,
      templates: Object.keys(templates).map(key => ({
        name: key,
        template: templates[key].template,
        variables: templates[key].variables,
      })),
    });
  } catch (error) {
    logger.error('Erro ao listar templates:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
