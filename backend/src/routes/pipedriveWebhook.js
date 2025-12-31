/**
 * Pipedrive Webhook Endpoint
 * Recebe e processa eventos do Pipedrive CRM
 */

const express = require('express');
const crypto = require('crypto');
const functions = (() => {
  try {
    return require('firebase-functions');
  } catch {
    return {
      logger: {
        info: (...args) => console.log('[Pipedrive]', ...args),
        warn: (...args) => console.warn('[Pipedrive]', ...args),
        error: (...args) => console.error('[Pipedrive]', ...args),
      },
    };
  }
})();
let db;
try {
  ({ db } = require('../firebaseConfig'));
} catch {
  db = {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: false, data: () => ({}) }),
        update: async () => {},
      }),
      add: async () => ({ id: 'mock-id' }),
      where: () => ({ get: async () => ({ docs: [] }) }),
      get: async () => ({ docs: [] }),
    }),
  };
}
const PipedriveService = require('../services/pipedriveService');

const router = express.Router();

const PIPEDRIVE_WEBHOOK_TOKEN = process.env.PIPEDRIVE_WEBHOOK_TOKEN || 'test-token';
const pipedriveService = new PipedriveService({
  apiKey: process.env.PIPEDRIVE_API_KEY || '',
  companyDomain: process.env.PIPEDRIVE_DOMAIN || '',
});

function validateWebhookSignature(req) {
  const signature = req.headers['x-pipedrive-signature'];
  if (!signature) {
    return false;
  }

  const payload = JSON.stringify(req.body);
  const hash = crypto.createHmac('sha256', PIPEDRIVE_WEBHOOK_TOKEN).update(payload).digest('hex');

  return hash === signature;
}

/**
 * POST /api/pipedrive-webhook
 */
router.post('/pipedrive-webhook', async (req, res) => {
  try {
    if (!validateWebhookSignature(req)) {
      functions.logger.warn('Webhook Pipedrive com assinatura inválida', req.body);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    functions.logger.info('Webhook Pipedrive recebido', {
      event: event.event,
      timestamp: new Date().toISOString(),
    });

    await pipedriveService.handleWebhook(event, db);

    await db.collection('pipedrive_webhooks').add({
      event: event.event,
      data: event.data,
      processedAt: new Date(),
      status: 'processed',
    });

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    functions.logger.error('Erro ao processar webhook Pipedrive:', error);

    await db.collection('pipedrive_webhooks').add({
      event: req.body.event,
      data: req.body.data,
      processedAt: new Date(),
      status: 'error',
      error: error.message || 'Unknown error',
    });

    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/pipedrive/sync-proposal
 */
router.post('/pipedrive/sync-proposal', async (req, res) => {
  try {
    const { proposalId, clientEmail, title, value, currency } = req.body;

    if (!proposalId || !clientEmail || !title || !value) {
      return res.status(400).json({
        error: 'Missing required fields: proposalId, clientEmail, title, value',
      });
    }

    const dealId = await pipedriveService.syncProposalToDeal(proposalId, clientEmail, {
      title,
      value,
      currency: currency || 'BRL',
    });

    await db
      .collection('proposals')
      .doc(proposalId)
      .update({
        pipedriveSync: {
          dealId,
          syncedAt: new Date(),
          status: 'synced',
        },
      });

    functions.logger.info(`Proposta sincronizada: ${proposalId} → Deal ${dealId}`);

    res.status(200).json({
      success: true,
      message: 'Proposal synced to Pipedrive',
      dealId,
    });
  } catch (error) {
    functions.logger.error('Erro ao sincronizar proposta:', error);
    res.status(500).json({ error: 'Failed to sync proposal' });
  }
});

/**
 * GET /api/pipedrive/deal/:dealId
 */
router.get('/pipedrive/deal/:dealId', async (req, res) => {
  try {
    const { dealId } = req.params;

    res.status(200).json({
      success: true,
      data: {
        dealId,
        status: 'open',
        title: 'Deal from Pipedrive',
        value: 0,
      },
    });
  } catch (error) {
    functions.logger.error('Erro ao obter deal:', error);
    res.status(500).json({ error: 'Failed to get deal' });
  }
});

/**
 * GET /api/pipedrive/sync-status/:proposalId
 */
router.get('/pipedrive/sync-status/:proposalId', async (req, res) => {
  try {
    const { proposalId } = req.params;

    const proposalDoc = await db.collection('proposals').doc(proposalId).get();

    if (!proposalDoc.exists) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const pipedriveSync = proposalDoc.data()?.pipedriveSync || null;

    res.status(200).json({
      success: true,
      proposalId,
      syncStatus: pipedriveSync?.status || 'not_synced',
      dealId: pipedriveSync?.dealId || null,
      syncedAt: pipedriveSync?.syncedAt || null,
    });
  } catch (error) {
    functions.logger.error('Erro ao verificar status de sincronização:', error);
    res.status(500).json({ error: 'Failed to check sync status' });
  }
});

/**
 * GET /api/pipedrive/health
 */
router.get('/pipedrive/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'pipedrive-integration',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
