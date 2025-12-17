/**
 * PipedriveService - Integração com Pipedrive CRM
 * Fornece sincronização bidirecional de leads e deals
 */

import axios, { AxiosInstance } from 'axios';
import * as functions from 'firebase-functions';

interface PipedriveConfig {
  apiKey: string;
  companyDomain: string;
}

interface Lead {
  id: string;
  email: string;
  nome: string;
  empresa: string;
  telefone?: string;
  createdAt: Date;
  servioJobId?: string;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  status: 'open' | 'won' | 'lost' | 'deleted';
  pipelineId: string;
  leadId: string;
  createdAt: Date;
  servioProposalId?: string;
}

interface WebhookEvent {
  event: 'added.person' | 'added.deal' | 'updated.deal' | 'merged.person' | 'deleted.person';
  data: Record<string, unknown>;
  current?: Record<string, unknown>;
  previous?: Record<string, unknown>;
}

export class PipedriveService {
  private client: AxiosInstance;
  private config: PipedriveConfig;

  constructor(config: PipedriveConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `https://${config.companyDomain}.pipedrive.com/v1`,
      params: {
        api_token: config.apiKey,
      },
    });
  }

  /**
   * Criar nova pessoa (lead) no Pipedrive
   */
  async createLead(lead: Lead): Promise<number> {
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

      functions.logger.info(`Lead criado no Pipedrive: ${response.data.data.id}`, { lead });
      return response.data.data.id;
    } catch (error) {
      functions.logger.error('Erro ao criar lead no Pipedrive:', error);
      throw error;
    }
  }

  /**
   * Criar novo deal (proposta) no Pipedrive
   */
  async createDeal(deal: Deal, personId: number): Promise<number> {
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

      functions.logger.info(`Deal criado no Pipedrive: ${response.data.data.id}`, { deal });
      return response.data.data.id;
    } catch (error) {
      functions.logger.error('Erro ao criar deal no Pipedrive:', error);
      throw error;
    }
  }

  /**
   * Atualizar deal existente
   */
  async updateDeal(dealId: number, updates: Partial<Deal>): Promise<void> {
    try {
      const payload: Record<string, unknown> = {};

      if (updates.title) payload.title = updates.title;
      if (updates.value) payload.value = updates.value;
      if (updates.status) payload.status = updates.status;

      const response = await this.client.put(`/deals/${dealId}`, payload);

      if (!response.data.success) {
        throw new Error(`Pipedrive error: ${response.data.error}`);
      }

      functions.logger.info(`Deal atualizado no Pipedrive: ${dealId}`, { updates });
    } catch (error) {
      functions.logger.error(`Erro ao atualizar deal ${dealId}:`, error);
      throw error;
    }
  }

  /**
   * Sincronizar proposta do Servio com deal do Pipedrive
   */
  async syncProposalToDeal(proposalId: string, clientEmail: string, dealData: {
    title: string;
    value: number;
    currency: string;
  }): Promise<number> {
    try {
      // Buscar pessoa existente ou criar nova
      const personId = await this.findOrCreatePerson(clientEmail);

      // Criar ou atualizar deal
      const existing = await this.findDealByProposalId(proposalId);
      if (existing) {
        await this.updateDeal(existing.id, dealData);
        return existing.id;
      }

      // Usar pipeline padrão (primeiro pipeline)
      const pipeline = await this.getDefaultPipeline();

      return await this.createDeal({
        ...dealData,
        id: '',
        pipelineId: pipeline.id,
        leadId: personId.toString(),
        status: 'open',
        createdAt: new Date(),
        servioProposalId: proposalId,
      }, personId);
    } catch (error) {
      functions.logger.error('Erro ao sincronizar proposta:', error);
      throw error;
    }
  }

  /**
   * Buscar pessoa por email
   */
  async findPersonByEmail(email: string): Promise<number | null> {
    try {
      const response = await this.client.get('/persons/search', {
        params: {
          term: email,
          search_for: 'email',
        },
      });

      if (!response.data.success || response.data.data?.items?.length === 0) {
        return null;
      }

      return response.data.data.items[0].item.id;
    } catch (error) {
      functions.logger.error('Erro ao buscar pessoa:', error);
      return null;
    }
  }

  /**
   * Buscar ou criar pessoa
   */
  async findOrCreatePerson(email: string): Promise<number> {
    const existing = await this.findPersonByEmail(email);
    if (existing) {
      return existing;
    }

    // Extrair nome do email se possível
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
  async findDealByProposalId(proposalId: string): Promise<Deal | null> {
    try {
      const response = await this.client.get('/deals/search', {
        params: {
          term: proposalId,
          search_for: 'custom_fields',
        },
      });

      if (!response.data.success || response.data.data?.items?.length === 0) {
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
      functions.logger.error('Erro ao buscar deal:', error);
      return null;
    }
  }

  /**
   * Obter organização ou criar nova
   */
  async getOrCreateOrganization(companyName: string): Promise<number> {
    try {
      // Buscar organização existente
      const response = await this.client.get('/organizations/search', {
        params: {
          term: companyName,
        },
      });

      if (response.data.success && response.data.data?.items?.length > 0) {
        return response.data.data.items[0].item.id;
      }

      // Criar nova organização
      const createResponse = await this.client.post('/organizations', {
        name: companyName,
      });

      if (!createResponse.data.success) {
        throw new Error(`Pipedrive error: ${createResponse.data.error}`);
      }

      return createResponse.data.data.id;
    } catch (error) {
      functions.logger.error('Erro ao gerenciar organização:', error);
      throw error;
    }
  }

  /**
   * Obter pipeline padrão
   */
  async getDefaultPipeline(): Promise<{ id: string; name: string }> {
    try {
      const response = await this.client.get('/pipelines');

      if (!response.data.success || response.data.data?.length === 0) {
        throw new Error('Nenhum pipeline encontrado');
      }

      const pipeline = response.data.data[0];
      return {
        id: pipeline.id,
        name: pipeline.name,
      };
    } catch (error) {
      functions.logger.error('Erro ao obter pipeline:', error);
      throw error;
    }
  }

  /**
   * Processar webhook do Pipedrive
   */
  async handleWebhook(event: WebhookEvent, db: FirebaseFirestore.Firestore): Promise<void> {
    functions.logger.info('Webhook Pipedrive recebido:', { event: event.event });

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
        functions.logger.warn(`Webhook desconhecido: ${event.event}`);
    }
  }

  /**
   * Handler: Pessoa adicionada no Pipedrive
   */
  private async handlePersonAdded(data: Record<string, unknown>, db: FirebaseFirestore.Firestore): Promise<void> {
    try {
      const personId = (data.id as number);
      const email = data.email?.[0]?.value as string;

      if (!email) {
        functions.logger.warn('Pessoa sem email recebida do Pipedrive');
        return;
      }

      // Registrar no Firestore para auditoria
      await db.collection('pipedrive_sync').doc(`person_${personId}`).set({
        pipedriveId: personId,
        email,
        action: 'added',
        timestamp: new Date(),
      });

      functions.logger.info(`Pessoa sincronizada: ${email}`);
    } catch (error) {
      functions.logger.error('Erro em handlePersonAdded:', error);
    }
  }

  /**
   * Handler: Deal adicionado no Pipedrive
   */
  private async handleDealAdded(data: Record<string, unknown>, db: FirebaseFirestore.Firestore): Promise<void> {
    try {
      const dealId = data.id as number;
      const title = data.title as string;
      const value = data.value as number;

      await db.collection('pipedrive_sync').doc(`deal_${dealId}`).set({
        pipedriveId: dealId,
        title,
        value,
        action: 'added',
        timestamp: new Date(),
      });

      functions.logger.info(`Deal sincronizado: ${title} (${dealId})`);
    } catch (error) {
      functions.logger.error('Erro em handleDealAdded:', error);
    }
  }

  /**
   * Handler: Deal atualizado no Pipedrive
   */
  private async handleDealUpdated(
    data: Record<string, unknown>,
    current: Record<string, unknown> | undefined,
    previous: Record<string, unknown> | undefined,
    db: FirebaseFirestore.Firestore
  ): Promise<void> {
    try {
      const dealId = data.id as number;

      await db.collection('pipedrive_sync').doc(`deal_${dealId}`).update({
        action: 'updated',
        previous,
        current,
        timestamp: new Date(),
      });

      functions.logger.info(`Deal atualizado: ${dealId}`, { previous, current });
    } catch (error) {
      functions.logger.error('Erro em handleDealUpdated:', error);
    }
  }

  /**
   * Handler: Pessoa deletada no Pipedrive
   */
  private async handlePersonDeleted(data: Record<string, unknown>, db: FirebaseFirestore.Firestore): Promise<void> {
    try {
      const personId = data.id as number;

      await db.collection('pipedrive_sync').doc(`person_${personId}`).update({
        action: 'deleted',
        timestamp: new Date(),
      });

      functions.logger.info(`Pessoa deletada: ${personId}`);
    } catch (error) {
      functions.logger.error('Erro em handlePersonDeleted:', error);
    }
  }
}

export type { Lead, Deal, WebhookEvent };
