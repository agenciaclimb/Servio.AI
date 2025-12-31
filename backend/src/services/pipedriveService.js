/**
 * PipedriveService - Integração com Pipedrive CRM
 * Fornece sincronização bidirecional de leads e deals
 */

// Removed top-level requires to allow dependency injection and avoid test failures
// const axios = require('axios');
// const functions = require('firebase-functions');

class PipedriveService {
  constructor(config, deps = {}) {
    this.config = config;

    // Dependency Injection with lazy require fallback
    this.axios = deps.axios || require('axios');
    this.functions =
      deps.functions ||
      (() => {
        try {
          return require('firebase-functions');
        } catch {
          return {
            logger: {
              info: (...args) => console.log('[PipedriveService]', ...args),
              warn: (...args) => console.warn('[PipedriveService]', ...args),
              error: (...args) => console.error('[PipedriveService]', ...args),
            },
          };
        }
      })();

    this.client = this.axios.create({
      baseURL: `https://${config.companyDomain}.pipedrive.com/v1`,
      params: {
        api_token: config.apiKey,
      },
    });
  }

  /**
   * Criar nova pessoa (lead) no Pipedrive
   */
  async createLead(lead) {
    try {
      const response = await this.client.post('/persons', {
        name: lead.nome,
        email: lead.email,
        phone: lead.telefone,
        org_id: await this.getOrCreateOrganization(lead.empresa),
        custom_fields: {
          servio_job_id: lead.servioJobId,
        },
      });

      if (!response.data.success) {
        throw new Error(`Pipedrive error: ${response.data.error}`);
      }

      this.functions.logger.info(`Lead criado no Pipedrive: ${response.data.data.id}`, { lead });
      return response.data.data.id;
    } catch (error) {
      this.functions.logger.error('Erro ao criar lead no Pipedrive:', error);
      throw error;
    }
  }

  /**
   * Criar novo deal (proposta) no Pipedrive
   */
  async createDeal(deal, personId) {
    try {
      const response = await this.client.post('/deals', {
        title: deal.title,
        value: deal.value,
        currency: deal.currency,
        pipeline_id: deal.pipelineId,
        person_id: personId,
        status: deal.status,
        custom_fields: {
          servio_proposal_id: deal.servioProposalId,
        },
      });

      if (!response.data.success) {
        throw new Error(`Pipedrive error: ${response.data.error}`);
      }

      this.functions.logger.info(`Deal criado no Pipedrive: ${response.data.data.id}`, { deal });
      return response.data.data.id;
    } catch (error) {
      this.functions.logger.error('Erro ao criar deal no Pipedrive:', error);
      throw error;
    }
  }

  /**
   * Atualizar deal existente
   */
  async updateDeal(dealId, updates) {
    try {
      const payload = {};

      if (updates.title) payload.title = updates.title;
      if (updates.value) payload.value = updates.value;
      if (updates.status) payload.status = updates.status;

      const response = await this.client.put(`/deals/${dealId}`, payload);

      if (!response.data.success) {
        throw new Error(`Pipedrive error: ${response.data.error}`);
      }

      this.functions.logger.info(`Deal atualizado no Pipedrive: ${dealId}`, { updates });
    } catch (error) {
      this.functions.logger.error(`Erro ao atualizar deal ${dealId}:`, error);
      throw error;
    }
  }

  /**
   * Sincronizar proposta do Servio com deal do Pipedrive
   */
  async syncProposalToDeal(proposalId, clientEmail, dealData) {
    try {
      const personId = await this.findOrCreatePerson(clientEmail);
      const existing = await this.findDealByProposalId(proposalId);

      if (existing) {
        await this.updateDeal(existing.id, dealData);
        return existing.id;
      }

      const pipeline = await this.getDefaultPipeline();

      return await this.createDeal(
        {
          ...dealData,
          id: '',
          pipelineId: pipeline.id,
          leadId: personId.toString(),
          status: 'open',
          createdAt: new Date(),
          servioProposalId: proposalId,
        },
        personId
      );
    } catch (error) {
      this.functions.logger.error('Erro ao sincronizar proposta:', error);
      throw error;
    }
  }

  /**
   * Buscar pessoa por email
   */
  async findPersonByEmail(email) {
    try {
      const response = await this.client.get('/persons/search', {
        params: {
          term: email,
          search_for: 'email',
        },
      });

      if (!response.data.success || !response.data.data?.items?.length) {
        return null;
      }

      return response.data.data.items[0].item.id;
    } catch (error) {
      this.functions.logger.error('Erro ao buscar pessoa:', error);
      return null;
    }
  }

  /**
   * Buscar ou criar pessoa
   */
  async findOrCreatePerson(email) {
    const existing = await this.findPersonByEmail(email);
    if (existing) {
      return existing;
    }

    const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ');
    const response = await this.client.post('/persons', {
      name: nameFromEmail,
      email,
    });

    if (!response.data.success) {
      throw new Error(`Pipedrive error: ${response.data.error}`);
    }

    return response.data.data.id;
  }

  /**
   * Buscar deal por ID de proposta Servio
   */
  async findDealByProposalId(proposalId) {
    try {
      const response = await this.client.get('/deals/search', {
        params: {
          term: proposalId,
          search_for: 'custom_fields',
        },
      });

      if (!response.data.success || !response.data.data?.items?.length) {
        return null;
      }

      const dealData = response.data.data.items[0].item;
      return {
        id: dealData.id,
        title: dealData.title,
        value: dealData.value,
        currency: dealData.currency,
        status: dealData.status,
        pipelineId: dealData.pipeline_id,
        leadId: dealData.person_id,
        createdAt: new Date(dealData.add_time * 1000),
        servioProposalId: proposalId,
      };
    } catch (error) {
      this.functions.logger.error('Erro ao buscar deal:', error);
      return null;
    }
  }

  /**
   * Obter organização ou criar nova
   */
  async getOrCreateOrganization(companyName) {
    try {
      const response = await this.client.get('/organizations/search', {
        params: {
          term: companyName,
        },
      });

      if (response.data.success && response.data.data?.items?.length) {
        return response.data.data.items[0].item.id;
      }

      const createResponse = await this.client.post('/organizations', {
        name: companyName,
      });

      if (!createResponse.data.success) {
        throw new Error(`Pipedrive error: ${createResponse.data.error}`);
      }

      return createResponse.data.data.id;
    } catch (error) {
      this.functions.logger.error('Erro ao gerenciar organização:', error);
      throw error;
    }
  }

  /**
   * Obter pipeline padrão
   */
  async getDefaultPipeline() {
    try {
      const response = await this.client.get('/pipelines');

      if (!response.data.success || !response.data.data?.length) {
        throw new Error('Nenhum pipeline encontrado');
      }

      const pipeline = response.data.data[0];
      return {
        id: pipeline.id,
        name: pipeline.name,
      };
    } catch (error) {
      this.functions.logger.error('Erro ao obter pipeline:', error);
      throw error;
    }
  }

  /**
   * Processar webhook do Pipedrive
   */
  async handleWebhook(event, db) {
    this.functions.logger.info('Webhook Pipedrive recebido:', { event: event.event });

    switch (event.event) {
      case 'added.person':
        await this.handlePersonAdded(event.data, db);
        break;
      case 'added.deal':
        await this.handleDealAdded(event.data, db);
        break;
      case 'updated.deal':
        await this.handleDealUpdated(event.data, event.current, event.previous, db);
        break;
      case 'deleted.person':
        await this.handlePersonDeleted(event.data, db);
        break;
      default:
        this.functions.logger.warn(`Webhook desconhecido: ${event.event}`);
    }
  }

  async handlePersonAdded(data, db) {
    try {
      const personId = data.id;
      const email = data.email?.[0]?.value;

      if (!email) {
        this.functions.logger.warn('Pessoa sem email recebida do Pipedrive');
        return;
      }

      await db.collection('pipedrive_sync').doc(`person_${personId}`).set({
        pipedriveId: personId,
        email,
        action: 'added',
        timestamp: new Date(),
      });

      this.functions.logger.info(`Pessoa sincronizada: ${email}`);
    } catch (error) {
      this.functions.logger.error('Erro em handlePersonAdded:', error);
    }
  }

  async handleDealAdded(data, db) {
    try {
      const dealId = data.id;
      const title = data.title;
      const value = data.value;

      await db.collection('pipedrive_sync').doc(`deal_${dealId}`).set({
        pipedriveId: dealId,
        title,
        value,
        action: 'added',
        timestamp: new Date(),
      });

      this.functions.logger.info(`Deal sincronizado: ${title} (${dealId})`);
    } catch (error) {
      this.functions.logger.error('Erro em handleDealAdded:', error);
    }
  }

  async handleDealUpdated(data, current, previous, db) {
    try {
      const dealId = data.id;

      await db.collection('pipedrive_sync').doc(`deal_${dealId}`).update({
        action: 'updated',
        previous,
        current,
        timestamp: new Date(),
      });

      this.functions.logger.info(`Deal atualizado: ${dealId}`, { previous, current });
    } catch (error) {
      this.functions.logger.error('Erro em handleDealUpdated:', error);
    }
  }

  async handlePersonDeleted(data, db) {
    try {
      const personId = data.id;

      await db.collection('pipedrive_sync').doc(`person_${personId}`).update({
        action: 'deleted',
        timestamp: new Date(),
      });

      this.functions.logger.info(`Pessoa deletada: ${personId}`);
    } catch (error) {
      this.functions.logger.error('Erro em handlePersonDeleted:', error);
    }
  }
}

module.exports = PipedriveService;
