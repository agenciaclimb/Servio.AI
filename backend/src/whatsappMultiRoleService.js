/**
 * WhatsApp Multi-Role Service
 *
 * Gerencia mensagens WhatsApp para todos os tipos de usuários:
 * - Cliente: Notificações de jobs, propostas, comunicação com prestadores
 * - Prestador: Notificações de jobs disponíveis, status, comunicação com clientes
 * - Prospector: Invites, leads, comissões, recruits
 * - Admin: Alertas, relatórios, moderação
 *
 * @module whatsappMultiRoleService
 */

const axios = require('axios');
const logger = require('./logger');

const WHATSAPP_API_URL = 'https://graph.instagram.com/v18.0';
const PHONE_NUMBER_ID = process.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * Tipos de mensagens por papel
 */
const MESSAGE_TEMPLATES = {
  // ========== CLIENTE ==========
  CLIENTE: {
    JOB_POSTED: {
      name: 'job_posted_client',
      template:
        'Seu job "{jobTitle}" foi publicado! 🎉\n\nDescrição: {jobDescription}\nLocal: {jobLocation}\n\nAcompanhe propostas em: {link}',
      variables: ['jobTitle', 'jobDescription', 'jobLocation', 'link'],
    },
    PROPOSAL_RECEIVED: {
      name: 'proposal_received_client',
      template:
        'Você recebeu uma proposta! 💼\n\nPrestador: {providerName}\nValor: R$ {amount}\nAvaliação: ⭐ {rating}\n\nVer proposta: {link}',
      variables: ['providerName', 'amount', 'rating', 'link'],
    },
    PROPOSAL_ACCEPTED: {
      name: 'proposal_accepted_client',
      template:
        'Sua proposta foi aceita! ✅\n\nPrestador: {providerName}\nData início: {startDate}\n\nChat: {link}',
      variables: ['providerName', 'startDate', 'link'],
    },
    JOB_COMPLETED: {
      name: 'job_completed_client',
      template:
        'Seu job foi concluído! 🏆\n\nAvalie o prestador e ative o pagamento.\nPagar agora: {link}',
      variables: ['link'],
    },
    PAYMENT_REMINDER: {
      name: 'payment_reminder_client',
      template:
        'Lembrete: Seu job está aguardando pagamento! ⏰\n\nValor: R$ {amount}\nPrestador: {providerName}\n\nPagar: {link}',
      variables: ['amount', 'providerName', 'link'],
    },
    DISPUTE_ALERT: {
      name: 'dispute_alert_client',
      template:
        'Alerta: Disputa aberta no job "{jobTitle}" 🚨\n\nSeu pedido foi recebido. Acompanhamos a resolução.\nVer detalhes: {link}',
      variables: ['jobTitle', 'link'],
    },
  },

  // ========== PRESTADOR ==========
  PRESTADOR: {
    NEW_JOB: {
      name: 'new_job_provider',
      template:
        'Novo job disponível! 💰\n\nCategoria: {category}\nLocal: {location}\nValor: R$ {budget}\n\nCandidatar-se: {link}',
      variables: ['category', 'location', 'budget', 'link'],
    },
    JOB_MATCH: {
      name: 'job_match_provider',
      template:
        'Você foi indicado para um job! 🎯\n\n{jobTitle}\nLocal: {location}\n\nVer detalhes: {link}',
      variables: ['jobTitle', 'location', 'link'],
    },
    PROPOSAL_STATUS: {
      name: 'proposal_status_provider',
      template:
        'Status da sua proposta: {status} 📊\n\nJob: {jobTitle}\nValor: R$ {amount}\n\nVer: {link}',
      variables: ['status', 'jobTitle', 'amount', 'link'],
    },
    CHAT_MESSAGE: {
      name: 'chat_message_provider',
      template:
        'Mensagem recebida! 💬\n\nCliente: {clientName}\nMensagem: {preview}\n\nResponder: {link}',
      variables: ['clientName', 'preview', 'link'],
    },
    RATING_RECEIVED: {
      name: 'rating_received_provider',
      template:
        'Você recebeu uma avaliação! ⭐\n\nCliente: {clientName}\nNota: {stars} estrelas\nComentário: {comment}\n\nVer: {link}',
      variables: ['clientName', 'stars', 'comment', 'link'],
    },
    PAYMENT_RECEIVED: {
      name: 'payment_received_provider',
      template:
        'Pagamento recebido! 💳\n\nValor: R$ {amount}\nJob: {jobTitle}\nData: {date}\n\nVer: {link}',
      variables: ['amount', 'jobTitle', 'date', 'link'],
    },
  },

  // ========== PROSPECTOR ==========
  PROSPECTOR: {
    RECRUIT_WELCOME: {
      name: 'recruit_welcome_prospector',
      template:
        'Bem-vindo ao Servio.AI! 🎉\n\nVocê foi indicado por {prospectorName} e já pode ganhar comissões!\n\nComece: {link}',
      variables: ['prospectorName', 'link'],
    },
    RECRUIT_CONFIRMED: {
      name: 'recruit_confirmed_prospector',
      template:
        'Novo recrutamento confirmado! ✅\n\nNome: {recruitName}\nData: {date}\nComissão: R$ {commission}\n\nVer: {link}',
      variables: ['recruitName', 'date', 'commission', 'link'],
    },
    COMMISSION_EARNED: {
      name: 'commission_earned_prospector',
      template:
        'Você ganhou uma comissão! 💰\n\nValor: R$ {amount}\nMotivo: {reason}\nTotal do mês: R$ {monthlyTotal}\n\nExtrato: {link}',
      variables: ['amount', 'reason', 'monthlyTotal', 'link'],
    },
    COMMISSION_PAID: {
      name: 'commission_paid_prospector',
      template:
        'Comissão paga! 🎊\n\nValor: R$ {amount}\nData: {date}\nMétodo: {method}\n\nRecibo: {link}',
      variables: ['amount', 'date', 'method', 'link'],
    },
    BADGE_UNLOCKED: {
      name: 'badge_unlocked_prospector',
      template:
        'Novo badge desbloqueado! 🏅\n\nBadge: {badgeName}\nDescrição: {description}\n\nVer badges: {link}',
      variables: ['badgeName', 'description', 'link'],
    },
    LEAD_REMINDER: {
      name: 'lead_reminder_prospector',
      template:
        'Lembrete de follow-up! 📞\n\nLead: {leadName}\nDias sem contato: {daysSince}\n\nCRM: {link}',
      variables: ['leadName', 'daysSince', 'link'],
    },
    REFERRAL_LINK_CLICK: {
      name: 'referral_link_click_prospector',
      template:
        'Seu link foi clicado! 👀\n\nCliques hoje: {clicksToday}\nCliques totais: {clicksTotal}\n\nAcompanhar: {link}',
      variables: ['clicksToday', 'clicksTotal', 'link'],
    },
    LEADERBOARD_UPDATE: {
      name: 'leaderboard_update_prospector',
      template:
        'Atualização do leaderboard! 📈\n\nSua posição: #{position}\nRecursos: {recruits}\nComissões: R$ {commissions}\n\nVer: {link}',
      variables: ['position', 'recruits', 'commissions', 'link'],
    },
  },

  // ========== ADMIN ==========
  ADMIN: {
    SYSTEM_ALERT: {
      name: 'system_alert_admin',
      template:
        'Alerta do Sistema! 🚨\n\nTipo: {alertType}\nSeveridade: {severity}\nDescrição: {description}\n\nVer: {link}',
      variables: ['alertType', 'severity', 'description', 'link'],
    },
    DISPUTE_ESCALATION: {
      name: 'dispute_escalation_admin',
      template:
        'Disputa escalada para revisão! ⚖️\n\nJob: {jobTitle}\nMotivo: {reason}\nCliente: {clientName}\nPrestador: {providerName}\n\nResolver: {link}',
      variables: ['jobTitle', 'reason', 'clientName', 'providerName', 'link'],
    },
    FRAUD_DETECTION: {
      name: 'fraud_detection_admin',
      template:
        'Suspeita de fraude detectada! 🔒\n\nTipo: {fraudType}\nEmail: {email}\nRisco: {riskLevel}\n\nInvestigar: {link}',
      variables: ['fraudType', 'email', 'riskLevel', 'link'],
    },
    DAILY_REPORT: {
      name: 'daily_report_admin',
      template:
        'Relatório diário! 📊\n\nJobs criados: {jobsCreated}\nPropostas: {proposals}\nRecursos: {recruits}\nReceita: R$ {revenue}\n\nVer: {link}',
      variables: ['jobsCreated', 'proposals', 'recruits', 'revenue', 'link'],
    },
    PAYMENT_ISSUE: {
      name: 'payment_issue_admin',
      template:
        'Problema de pagamento detectado! 💳\n\nTransação: {transactionId}\nStatus: {status}\nValor: R$ {amount}\n\nResolver: {link}',
      variables: ['transactionId', 'status', 'amount', 'link'],
    },
    USER_REPORT: {
      name: 'user_report_admin',
      template:
        'Novo relatório de usuário! 📝\n\nAutor: {reporterName}\nAlvo: {targetName}\nMotivo: {reason}\n\nAnalisar: {link}',
      variables: ['reporterName', 'targetName', 'reason', 'link'],
    },
  },
};

/**
 * Classe para gerenciar mensagens WhatsApp multi-role
 */
class WhatsAppMultiRoleService {
  constructor() {
    this.phoneNumberId = PHONE_NUMBER_ID;
    this.accessToken = ACCESS_TOKEN;
    this.apiUrl = `${WHATSAPP_API_URL}/${this.phoneNumberId}`;
  }

  /**
   * Valida se o telefone está em formato E.164
   * @param {string} phone - Número de telefone
   * @returns {boolean}
   */
  isValidPhone(phone) {
    const e164Regex = /^\+?[1-9]\d{1,14}$/;
    return e164Regex.test(phone.replace(/\D/g, ''));
  }

  /**
   * Normaliza telefone para formato E.164 (Brasil)
   * @param {string} phone - Número de telefone
   * @returns {string}
   */
  normalizePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('55')) {
      return `55${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Envia mensagem para Cliente
   * @param {string} phone - Telefone do cliente
   * @param {string} messageType - Tipo de mensagem (JOB_POSTED, PROPOSAL_RECEIVED, etc)
   * @param {Object} variables - Variáveis para substituição no template
   * @returns {Promise}
   */
  async sendClientMessage(phone, messageType, variables = {}) {
    try {
      const template = MESSAGE_TEMPLATES.CLIENTE[messageType];
      if (!template) {
        throw new Error(`Template CLIENTE/${messageType} não encontrado`);
      }

      const message = this._substituteVariables(template.template, variables);
      return await this.sendMessage(phone, message, {
        userType: 'cliente',
        messageType,
      });
    } catch (error) {
      logger.error(`[CLIENTE] Erro ao enviar ${messageType}:`, error.message);
      throw error;
    }
  }

  /**
   * Envia mensagem para Prestador
   * @param {string} phone - Telefone do prestador
   * @param {string} messageType - Tipo de mensagem
   * @param {Object} variables - Variáveis para substituição
   * @returns {Promise}
   */
  async sendProviderMessage(phone, messageType, variables = {}) {
    try {
      const template = MESSAGE_TEMPLATES.PRESTADOR[messageType];
      if (!template) {
        throw new Error(`Template PRESTADOR/${messageType} não encontrado`);
      }

      const message = this._substituteVariables(template.template, variables);
      return await this.sendMessage(phone, message, {
        userType: 'prestador',
        messageType,
      });
    } catch (error) {
      logger.error(`[PRESTADOR] Erro ao enviar ${messageType}:`, error.message);
      throw error;
    }
  }

  /**
   * Envia mensagem para Prospector
   * @param {string} phone - Telefone do prospector
   * @param {string} messageType - Tipo de mensagem
   * @param {Object} variables - Variáveis para substituição
   * @returns {Promise}
   */
  async sendProspectorMessage(phone, messageType, variables = {}) {
    try {
      const template = MESSAGE_TEMPLATES.PROSPECTOR[messageType];
      if (!template) {
        throw new Error(`Template PROSPECTOR/${messageType} não encontrado`);
      }

      const message = this._substituteVariables(template.template, variables);
      return await this.sendMessage(phone, message, {
        userType: 'prospector',
        messageType,
      });
    } catch (error) {
      logger.error(`[PROSPECTOR] Erro ao enviar ${messageType}:`, error.message);
      throw error;
    }
  }

  /**
   * Envia mensagem para Admin
   * @param {string} phone - Telefone do admin
   * @param {string} messageType - Tipo de mensagem
   * @param {Object} variables - Variáveis para substituição
   * @returns {Promise}
   */
  async sendAdminMessage(phone, messageType, variables = {}) {
    try {
      const template = MESSAGE_TEMPLATES.ADMIN[messageType];
      if (!template) {
        throw new Error(`Template ADMIN/${messageType} não encontrado`);
      }

      const message = this._substituteVariables(template.template, variables);
      return await this.sendMessage(phone, message, {
        userType: 'admin',
        messageType,
      });
    } catch (error) {
      logger.error(`[ADMIN] Erro ao enviar ${messageType}:`, error.message);
      throw error;
    }
  }

  /**
   * Envia mensagem genérica via WhatsApp
   * @param {string} phone - Telefone destino
   * @param {string} text - Conteúdo da mensagem
   * @param {Object} metadata - Metadados para logging
   * @returns {Promise}
   */
  async sendMessage(phone, text, metadata = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('WhatsApp não está configurado');
      }

      const normalizedPhone = this.normalizePhone(phone);

      const payload = {
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'text',
        text: { body: text },
      };

      const response = await axios.post(`${this.apiUrl}/messages`, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      logger.info(`[WhatsApp] ✅ Mensagem enviada para ${normalizedPhone}`, metadata);

      return {
        success: true,
        messageId: response.data.messages[0]?.id,
        status: 'sent',
        phone: normalizedPhone,
      };
    } catch (error) {
      logger.error(`[WhatsApp] ❌ Erro ao enviar mensagem:`, {
        phone,
        error: error.message,
        ...metadata,
      });

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        status: 'failed',
      };
    }
  }

  /**
   * Substitui variáveis no template
   * @private
   * @param {string} template - Template com placeholders {var}
   * @param {Object} variables - Variáveis para substituição
   * @returns {string}
   */
  _substituteVariables(template, variables) {
    let message = template;
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value || '(não disponível)');
    });
    return message;
  }

  /**
   * Verifica se o serviço está configurado
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.phoneNumberId && !!this.accessToken;
  }

  /**
   * Retorna lista de templates disponíveis para um role
   * @param {string} userType - Tipo de usuário (cliente, prestador, prospector, admin)
   * @returns {Object}
   */
  getAvailableTemplates(userType) {
    const roleKey = userType.toUpperCase();
    return MESSAGE_TEMPLATES[roleKey] || {};
  }

  /**
   * Retorna status da conexão
   * @returns {Promise}
   */
  async getStatus() {
    try {
      const response = await axios.get(`${this.apiUrl}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        timeout: 5000,
      });

      return {
        configured: true,
        connected: true,
        phoneNumberId: this.phoneNumberId,
        status: response.data,
      };
    } catch (error) {
      return {
        configured: this.isConfigured(),
        connected: false,
        error: error.message,
      };
    }
  }
}

module.exports = new WhatsAppMultiRoleService();
