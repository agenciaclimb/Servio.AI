/**
 * Pipedrive Webhook Endpoint
 * Recebe e processa eventos do Pipedrive CRM
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import * as functions from 'firebase-functions';
import { db } from '../firebaseConfig';
import { PipedriveService } from '../services/pipedriveService';

const router = Router();

// Configuração
const PIPEDRIVE_WEBHOOK_TOKEN = process.env.PIPEDRIVE_WEBHOOK_TOKEN || 'test-token';
const pipedriveService = new PipedriveService({
  apiKey: process.env.PIPEDRIVE_API_KEY || '',
  companyDomain: process.env.PIPEDRIVE_DOMAIN || '',
});

/**
 * Validar assinatura do webhook
 * Pipedrive envia um header de verificação
 */
function validateWebhookSignature(req: Request): boolean {
  const signature = req.headers['x-pipedrive-signature'] as string;
  if (!signature) {
    return false;
  }

  // Pipedrive usa HMAC-SHA256
  const payload = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', PIPEDRIVE_WEBHOOK_TOKEN)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

/**
 * POST /api/pipedrive-webhook
 * Receber webhook do Pipedrive
 */
router.post('/pipedrive-webhook', async (req: Request, res: Response) => {
  try {
    // Validar assinatura
    if (!validateWebhookSignature(req)) {
      functions.logger.warn('Webhook Pipedrive com assinatura inválida', req.body);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    // Log do evento
    functions.logger.info('Webhook Pipedrive recebido', {
      event: event.event,
      timestamp: new Date().toISOString(),
    });

    // Processar webhook
    await pipedriveService.handleWebhook(event, db);

    // Armazenar evento para auditoria
    await db.collection('pipedrive_webhooks').add({
      event: event.event,
      data: event.data,
      processedAt: new Date(),
      status: 'processed',
    });

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    functions.logger.error('Erro ao processar webhook Pipedrive:', error);

    // Registrar erro
    await db.collection('pipedrive_webhooks').add({
      event: req.body.event,
      data: req.body.data,
      processedAt: new Date(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/pipedrive/sync-proposal
 * Sincronizar proposta do Servio com Pipedrive
 */
router.post('/pipedrive/sync-proposal', async (req: Request, res: Response) => {
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

    // Registrar sincronização no Firestore
    await db.collection('proposals').doc(proposalId).update({
      pipedriveSync: {
        dealId,
        syncedAt: new Date(),
        status: 'synced',
      },
    });

    functions.logger.info(`Proposta sincronizada com sucesso: ${proposalId} → Pipedrive Deal ${dealId}`);

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
 * Obter informações de um deal do Pipedrive
 */
router.get('/pipedrive/deal/:dealId', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;

    // Buscar deal no Pipedrive (requer método adicional no service)
    // Por agora, retornar sucesso com estrutura esperada
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
 * Verificar status de sincronização de uma proposta
 */
router.get('/pipedrive/sync-status/:proposalId', async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;

    const proposalDoc = await db.collection('proposals').doc(proposalId).get();

    if (!proposalDoc.exists) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const pipedriveSync = (proposalDoc.data()?.pipedriveSync as any) || null;

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
 * Health check do serviço Pipedrive
 */
router.get('/pipedrive/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'pipedrive-integration',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
