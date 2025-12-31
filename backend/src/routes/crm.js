/**
 * CRM Integration Routes
 * Endpoints para sincronização com Pipedrive e HubSpot
 */

const express = require('express');
const router = express.Router();

module.exports = function createCRMRoutes(dependencies) {
  const { db, crmService } = dependencies;

  /**
   * POST /api/crm/sync-lead
   * Sincroniza um lead individual para CRM externo
   */
  router.post('/sync-lead', async (req, res) => {
    try {
      const { prospectId, prospectorEmail, crmType } = req.body;

      if (!prospectId || !crmType) {
        return res.status(400).json({
          error: 'prospectId e crmType são obrigatórios',
        });
      }

      if (!['pipedrive', 'hubspot'].includes(crmType)) {
        return res.status(400).json({
          error: 'crmType deve ser "pipedrive" ou "hubspot"',
        });
      }

      // Buscar prospect do banco de dados
      const prospect = await db.collection('prospects').doc(prospectId).get();

      if (!prospect.exists) {
        return res.status(404).json({
          error: 'Prospect não encontrado',
        });
      }

      const prospectData = prospect.data();

      // Sincronizar para CRM
      const result = await crmService.syncLeadToCRM(
        { ...prospectData, prospectId, prospectorEmail },
        crmType
      );

      res.json({
        success: true,
        message: `Lead sincronizado para ${crmType}`,
        result,
      });
    } catch (error) {
      console.error('[CRM Routes] Erro ao sincronizar lead:', error);
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * POST /api/crm/sync-batch
   * Sincroniza múltiplos leads para CRM (batch operation)
   */
  router.post('/sync-batch', async (req, res) => {
    try {
      const { prospectIds, crmType } = req.body;

      if (!prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
        return res.status(400).json({
          error: 'prospectIds deve ser um array não vazio',
        });
      }

      if (!['pipedrive', 'hubspot'].includes(crmType)) {
        return res.status(400).json({
          error: 'crmType deve ser "pipedrive" ou "hubspot"',
        });
      }

      // Buscar todos os prospects
      const prospects = [];
      for (const prospectId of prospectIds) {
        const prospect = await db.collection('prospects').doc(prospectId).get();

        if (prospect.exists) {
          prospects.push({
            ...prospect.data(),
            prospectId,
          });
        }
      }

      if (prospects.length === 0) {
        return res.status(404).json({
          error: 'Nenhum prospect encontrado',
        });
      }

      // Sincronizar em batch
      const result = await crmService.syncLeadsBatch(prospects, crmType);

      res.json({
        success: true,
        message: `${result.successful} leads sincronizados, ${result.failed} falharam`,
        result,
      });
    } catch (error) {
      console.error('[CRM Routes] Erro ao sincronizar batch:', error);
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * POST /api/crm/webhook/pipedrive
   * Webhook para receber atualizações de Pipedrive
   */
  router.post('/webhook/pipedrive', async (req, res) => {
    try {
      const webhookData = req.body;

      // Verificar autenticidade do webhook (opcional, baseado em secret)
      const isValid = verifyPipedriveWebhook(req, webhookData);
      if (!isValid) {
        return res.status(401).json({
          error: 'Webhook inválido',
        });
      }

      // Processar webhook
      const result = await crmService.processWebhook(webhookData, 'pipedrive');

      res.json({
        success: true,
        result,
      });
    } catch (error) {
      console.error('[CRM Routes] Erro ao processar webhook Pipedrive:', error);
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * POST /api/crm/webhook/hubspot
   * Webhook para receber atualizações de HubSpot
   */
  router.post('/webhook/hubspot', async (req, res) => {
    try {
      const webhookData = req.body;

      // Verificar autenticidade do webhook
      const isValid = verifyHubspotWebhook(req, webhookData);
      if (!isValid) {
        return res.status(401).json({
          error: 'Webhook inválido',
        });
      }

      // Processar webhook
      const result = await crmService.processWebhook(webhookData, 'hubspot');

      res.json({
        success: true,
        result,
      });
    } catch (error) {
      console.error('[CRM Routes] Erro ao processar webhook HubSpot:', error);
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /api/crm/sync-status/:prospectId
   * Obtém histórico de sincronização de um lead
   */
  router.get('/sync-status/:prospectId', async (req, res) => {
    try {
      const { prospectId } = req.params;

      const syncStatus = await crmService.getSyncStatus(prospectId);

      res.json({
        success: true,
        prospectId,
        syncHistory: syncStatus,
      });
    } catch (error) {
      console.error('[CRM Routes] Erro ao obter sync status:', error);
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * POST /api/crm/sync-deals
   * Sincroniza deals/oportunidades do CRM externo
   */
  router.post('/sync-deals', async (req, res) => {
    try {
      const { crmType } = req.body;

      if (!['pipedrive', 'hubspot'].includes(crmType)) {
        return res.status(400).json({
          error: 'crmType deve ser "pipedrive" ou "hubspot"',
        });
      }

      const result = await crmService.syncDeals(crmType);

      res.json({
        success: true,
        message: `${result.synced} deals sincronizados de ${crmType}`,
        result,
      });
    } catch (error) {
      console.error('[CRM Routes] Erro ao sincronizar deals:', error);
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /api/crm/health
   * Verifica status das conexões com CRMs
   */
  router.get('/health', async (req, res) => {
    try {
      const health = {
        pipedrive: !!process.env.PIPEDRIVE_API_TOKEN,
        hubspot: !!process.env.HUBSPOT_API_KEY,
        timestamp: new Date(),
      };

      // Teste rápido de conexão Pipedrive
      if (health.pipedrive) {
        try {
          await crmService.pipedriveAxios.get('/companies', { params: { limit: 1 } });
          health.pipedriveStatus = 'connected';
        } catch {
          health.pipedriveStatus = 'disconnected';
        }
      }

      // Teste rápido de conexão HubSpot
      if (health.hubspot) {
        try {
          await crmService.hubspotAxios.get('/crm/v3/objects/contacts', {
            params: { limit: 1 },
          });
          health.hubspotStatus = 'connected';
        } catch {
          health.hubspotStatus = 'disconnected';
        }
      }

      res.json({
        success: true,
        health,
      });
    } catch (error) {
      console.error('[CRM Routes] Erro ao verificar health:', error);
      res.status(500).json({
        error: error.message,
      });
    }
  });

  return router;
};

/**
 * Verifica autenticidade do webhook de Pipedrive
 * @private
 */
function verifyPipedriveWebhook(req, data) {
  // Implementar verificação baseada em secret if needed
  // Para agora, apenas validar estrutura básica
  return data && (data.event || data.action);
}

/**
 * Verifica autenticidade do webhook de HubSpot
 * @private
 */
function verifyHubspotWebhook(req, data) {
  // HubSpot usa header X-HubSpot-Request-Timestamp e body signature
  // Implementar verificação based on env HUBSPOT_WEBHOOK_SECRET
  const webhookSecret = process.env.HUBSPOT_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return true; // Skip if no secret configured
  }

  // Implementar HMAC validation
  return true; // Placeholder
}
