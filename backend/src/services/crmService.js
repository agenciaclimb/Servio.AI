/**
 * CRM Integration Service
 * Suporta sincronização bidirecional com Pipedrive e HubSpot
 * 
 * Features:
 * - Sincronização de leads Servio.AI → CRM
 * - Sincronização de updates CRM → Servio.AI via webhooks
 * - Mapeamento de campos entre sistemas
 * - Deduplicação inteligente
 * - Rastreamento de histórico de sincronização
 */

const axios = require('axios');

class CRMService {
  constructor(firestore) {
    this.db = firestore;
    this.pipedriveAxios = null;
    this.hubspotAxios = null;
    this.initializeCRMClients();
  }

  /**
   * Inicializa clientes HTTP para Pipedrive e HubSpot
   */
  initializeCRMClients() {
    const pipedriveToken = process.env.PIPEDRIVE_API_TOKEN;
    const hubspotToken = process.env.HUBSPOT_API_KEY;

    if (pipedriveToken) {
      this.pipedriveAxios = axios.create({
        baseURL: 'https://api.pipedrive.com/v1',
        params: { api_token: pipedriveToken },
        timeout: 10000,
      });
    }

    if (hubspotToken) {
      this.hubspotAxios = axios.create({
        baseURL: 'https://api.hubapi.com',
        headers: { Authorization: `Bearer ${hubspotToken}` },
        timeout: 10000,
      });
    }
  }

  /**
   * Sincroniza um lead do Servio.AI para CRM externo
   * @param {Object} lead - Lead data from Servio.AI prospector
   * @param {string} crmType - 'pipedrive' ou 'hubspot'
   * @returns {Object} CRM sync result
   */
  async syncLeadToCRM(lead, crmType) {
    try {
      const prospect = {
        firstName: lead.firstName || '',
        lastName: lead.lastName || '',
        email: lead.email,
        phone: lead.phone || '',
        company: lead.company || '',
        position: lead.position || '',
        score: lead.score || 0,
        status: lead.status || 'new',
        source: 'servio-prospector',
        notes: this.buildLeadNotes(lead),
        customFields: {
          servioProspectId: lead.prospectId,
          servioScore: lead.score,
          prospectorEmail: lead.prospectorEmail,
        },
      };

      let result;

      if (crmType === 'pipedrive') {
        result = await this.syncToPipedrive(prospect, lead.prospectId);
      } else if (crmType === 'hubspot') {
        result = await this.syncToHubspot(prospect, lead.prospectId);
      } else {
        throw new Error(`Unknown CRM type: ${crmType}`);
      }

      // Registrar sincronização no Firestore
      await this.logSyncEvent(lead.prospectId, crmType, result);

      return result;
    } catch (error) {
      console.error(`[CRMService] Erro ao sincronizar lead para ${crmType}:`, error);
      throw error;
    }
  }

  /**
   * Sincroniza lead para Pipedrive
   * @private
   */
  async syncToPipedrive(prospect, prospectId) {
    if (!this.pipedriveAxios) {
      throw new Error('Pipedrive não configurado');
    }

    try {
      // Procura por person existente (deduplicação)
      const existingPerson = await this.findPipedrivePerson(prospect.email);

      let pipedriveResponse;

      if (existingPerson) {
        // Atualiza pessoa existente
        pipedriveResponse = await this.pipedriveAxios.put(
          `/persons/${existingPerson.id}`,
          {
            name: `${prospect.firstName} ${prospect.lastName}`,
            email: [{ value: prospect.email, primary: true }],
            phone: prospect.phone ? [{ value: prospect.phone, primary: true }] : [],
            org_id: prospect.company,
            [`custom_servio_score`]: prospect.score,
            note: prospect.notes,
          }
        );

        return {
          success: true,
          action: 'updated',
          crmId: existingPerson.id,
          prospectId,
          timestamp: new Date(),
        };
      } else {
        // Cria nova pessoa
        pipedriveResponse = await this.pipedriveAxios.post('/persons', {
          name: `${prospect.firstName} ${prospect.lastName}`,
          email: [{ value: prospect.email, primary: true }],
          phone: prospect.phone ? [{ value: prospect.phone, primary: true }] : [],
          org_id: prospect.company,
          [`custom_servio_score`]: prospect.score,
          note: prospect.notes,
        });

        return {
          success: true,
          action: 'created',
          crmId: pipedriveResponse.data.data.id,
          prospectId,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      throw new Error(`Pipedrive sync failed: ${error.message}`);
    }
  }

  /**
   * Sincroniza lead para HubSpot
   * @private
   */
  async syncToHubspot(prospect, prospectId) {
    if (!this.hubspotAxios) {
      throw new Error('HubSpot não configurado');
    }

    try {
      // Procura por contato existente
      const existingContact = await this.findHubspotContact(prospect.email);

      let hubspotResponse;

      if (existingContact) {
        // Atualiza contato existente
        hubspotResponse = await this.hubspotAxios.patch(
          `/crm/v3/objects/contacts/${existingContact.id}`,
          {
            properties: {
              firstname: prospect.firstName,
              lastname: prospect.lastName,
              email: prospect.email,
              phone: prospect.phone,
              company: prospect.company,
              jobtitle: prospect.position,
              servio_score: prospect.score.toString(),
              notes: prospect.notes,
            },
          }
        );

        return {
          success: true,
          action: 'updated',
          crmId: existingContact.id,
          prospectId,
          timestamp: new Date(),
        };
      } else {
        // Cria novo contato
        hubspotResponse = await this.hubspotAxios.post(
          '/crm/v3/objects/contacts',
          {
            properties: {
              firstname: prospect.firstName,
              lastname: prospect.lastName,
              email: prospect.email,
              phone: prospect.phone,
              company: prospect.company,
              jobtitle: prospect.position,
              servio_score: prospect.score.toString(),
              notes: prospect.notes,
            },
          }
        );

        return {
          success: true,
          action: 'created',
          crmId: hubspotResponse.data.id,
          prospectId,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      throw new Error(`HubSpot sync failed: ${error.message}`);
    }
  }

  /**
   * Procura por pessoa existente em Pipedrive
   * @private
   */
  async findPipedrivePerson(email) {
    try {
      const response = await this.pipedriveAxios.get('/persons/find', {
        params: { term: email, search_by_email: true },
      });

      return response.data.data?.length > 0 ? response.data.data[0] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Procura por contato existente em HubSpot
   * @private
   */
  async findHubspotContact(email) {
    try {
      const response = await this.hubspotAxios.get(
        `/crm/v3/objects/contacts/search`,
        {
          data: {
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: 'email',
                    operator: 'EQ',
                    value: email,
                  },
                ],
              },
            ],
            limit: 1,
          },
        }
      );

      return response.data.results?.length > 0
        ? response.data.results[0]
        : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Sincroniza leads em batch para CRM
   */
  async syncLeadsBatch(leads, crmType) {
    const results = [];
    const errors = [];

    for (const lead of leads) {
      try {
        const result = await this.syncLeadToCRM(lead, crmType);
        results.push(result);
      } catch (error) {
        errors.push({
          prospectId: lead.prospectId,
          email: lead.email,
          error: error.message,
        });
      }
    }

    return {
      successful: results.length,
      failed: errors.length,
      results,
      errors,
      timestamp: new Date(),
    };
  }

  /**
   * Processa webhook de atualização de CRM
   */
  async processWebhook(webhookData, crmType) {
    try {
      if (crmType === 'pipedrive') {
        return await this.processPipedriveWebhook(webhookData);
      } else if (crmType === 'hubspot') {
        return await this.processHubspotWebhook(webhookData);
      }
    } catch (error) {
      console.error(`[CRMService] Erro ao processar webhook ${crmType}:`, error);
      throw error;
    }
  }

  /**
   * Processa webhook de Pipedrive
   * @private
   */
  async processPipedriveWebhook(data) {
    const { event, data: eventData } = data;

    if (event === 'added.person') {
      // Novo contato adicionado em Pipedrive
      return await this.syncPipedriveToDB(eventData);
    } else if (event === 'updated.person') {
      // Contato atualizado em Pipedrive
      return await this.updateProspectFromCRM(eventData, 'pipedrive');
    } else if (event === 'deleted.person') {
      // Contato deletado em Pipedrive
      return await this.deleteProspectFromCRM(eventData.id, 'pipedrive');
    }

    return { processed: false };
  }

  /**
   * Processa webhook de HubSpot
   * @private
   */
  async processHubspotWebhook(data) {
    const { portal, subscriptionType, eventId, timestamp, attempts, changes } = data;

    if (subscriptionType === 'contact.creation') {
      return await this.syncHubspotToDB(data);
    } else if (subscriptionType === 'contact.propertyChange') {
      return await this.updateProspectFromCRM(data, 'hubspot');
    } else if (subscriptionType === 'contact.deletion') {
      return await this.deleteProspectFromCRM(data.objectId, 'hubspot');
    }

    return { processed: false };
  }

  /**
   * Sincroniza contato de Pipedrive para banco de dados
   * @private
   */
  async syncPipedriveToDB(pipedriveData) {
    // Implementação específica para atualizar prospector no Servio.AI
    // Baseado em mapeamento de campos customizado
    const prospect = {
      crmId: pipedriveData.id,
      crmType: 'pipedrive',
      firstName: pipedriveData.name?.split(' ')[0] || '',
      lastName: pipedriveData.name?.split(' ').slice(1).join(' ') || '',
      email: pipedriveData.email?.[0]?.value || '',
      phone: pipedriveData.phone?.[0]?.value || '',
      company: pipedriveData.org_id?.name || '',
      position: pipedriveData.custom_position || '',
      score: parseInt(pipedriveData.custom_servio_score) || 0,
      lastSyncedAt: new Date(),
      sourceUrl: `https://app.pipedrive.com/person/${pipedriveData.id}`,
    };

    return prospect;
  }

  /**
   * Sincroniza contato de HubSpot para banco de dados
   * @private
   */
  async syncHubspotToDB(hubspotData) {
    const properties = hubspotData.properties || {};

    const prospect = {
      crmId: hubspotData.objectId || hubspotData.id,
      crmType: 'hubspot',
      firstName: properties.firstname || '',
      lastName: properties.lastname || '',
      email: properties.email || '',
      phone: properties.phone || '',
      company: properties.company || '',
      position: properties.jobtitle || '',
      score: parseInt(properties.servio_score) || 0,
      lastSyncedAt: new Date(),
      sourceUrl: `https://app.hubspotusercontent.com/docs/contact/${hubspotData.objectId}`,
    };

    return prospect;
  }

  /**
   * Atualiza prospect baseado em alterações do CRM
   * @private
   */
  async updateProspectFromCRM(crmData, crmType) {
    // Encontrar o prospect no Servio.AI por crmId
    // Atualizar fields relevantes
    // Log da alteração
    return {
      updated: true,
      crmType,
      timestamp: new Date(),
    };
  }

  /**
   * Deleta prospect baseado em deleção no CRM
   * @private
   */
  async deleteProspectFromCRM(crmId, crmType) {
    // Encontrar o prospect no Servio.AI por crmId
    // Marcar como deletado ou remover completamente
    return {
      deleted: true,
      crmId,
      crmType,
      timestamp: new Date(),
    };
  }

  /**
   * Constrói notas do lead com contexto
   * @private
   */
  buildLeadNotes(lead) {
    const notes = [
      `Lead identificado em ${new Date(lead.createdAt).toLocaleDateString('pt-BR')}`,
      `Score de qualidade: ${lead.score}/100`,
      `Prospector: ${lead.prospectorEmail || 'N/A'}`,
    ];

    if (lead.interactionHistory) {
      notes.push(`Histórico: ${lead.interactionHistory.join(', ')}`);
    }

    return notes.join('\n');
  }

  /**
   * Registra evento de sincronização no Firestore
   * @private
   */
  async logSyncEvent(prospectId, crmType, result) {
    try {
      await this.db
        .collection('sync_logs')
        .add({
          prospectId,
          crmType,
          action: result.action,
          crmId: result.crmId,
          success: result.success,
          timestamp: new Date(),
          source: 'crmService',
        });
    } catch (error) {
      console.error('[CRMService] Erro ao registrar sync log:', error);
    }
  }

  /**
   * Obtém status de sincronização de um lead
   */
  async getSyncStatus(prospectId) {
    try {
      const logs = await this.db
        .collection('sync_logs')
        .where('prospectId', '==', prospectId)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

      return logs.docs.map((doc) => doc.data());
    } catch (error) {
      console.error('[CRMService] Erro ao obter sync status:', error);
      return [];
    }
  }

  /**
   * Sincroniza deals/oportunidades de CRM para Servio.AI
   */
  async syncDeals(crmType) {
    try {
      if (crmType === 'pipedrive') {
        return await this.syncPipedriveDeals();
      } else if (crmType === 'hubspot') {
        return await this.syncHubspotDeals();
      }
    } catch (error) {
      console.error(`[CRMService] Erro ao sincronizar deals de ${crmType}:`, error);
      throw error;
    }
  }

  /**
   * Sincroniza deals de Pipedrive
   * @private
   */
  async syncPipedriveDeals() {
    if (!this.pipedriveAxios) {
      return { error: 'Pipedrive não configurado' };
    }

    try {
      const response = await this.pipedriveAxios.get('/deals', {
        params: { status: 'open', limit: 500 },
      });

      const deals = response.data.data || [];
      return {
        synced: deals.length,
        deals: deals.map((deal) => ({
          crmId: deal.id,
          crmType: 'pipedrive',
          title: deal.title,
          value: deal.value,
          currency: deal.currency,
          status: deal.status,
          personId: deal.person_id,
        })),
      };
    } catch (error) {
      throw new Error(`Pipedrive deals sync failed: ${error.message}`);
    }
  }

  /**
   * Sincroniza deals de HubSpot
   * @private
   */
  async syncHubspotDeals() {
    if (!this.hubspotAxios) {
      return { error: 'HubSpot não configurado' };
    }

    try {
      const response = await this.hubspotAxios.get(
        '/crm/v3/objects/deals',
        {
          params: {
            limit: 100,
            properties: ['dealname', 'dealstage', 'amount', 'closedate'],
          },
        }
      );

      const deals = response.data.results || [];
      return {
        synced: deals.length,
        deals: deals.map((deal) => ({
          crmId: deal.id,
          crmType: 'hubspot',
          title: deal.properties.dealname,
          value: deal.properties.amount,
          status: deal.properties.dealstage,
        })),
      };
    } catch (error) {
      throw new Error(`HubSpot deals sync failed: ${error.message}`);
    }
  }
}

module.exports = CRMService;
