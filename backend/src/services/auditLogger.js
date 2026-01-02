/**
 * AUDIT LOGGER
 *
 * Sistema de auditoria avançado que registra todas operações críticas
 * - Login/logout (sucesso e falha)
 * - Criação/modificação de jobs
 * - Pagamentos processados
 * - Alterações de perfil
 * - Acesso a dados sensíveis
 * - Tentativas de autenticação falhadas
 * - Alterações de permissões
 *
 * @module services/auditLogger
 */

const admin = require('firebase-admin');

class AuditLogger {
  constructor(db) {
    this.db = db || admin.firestore();
    this.collection = this.db.collection('auditLogs');
  }

  /**
   * Registra uma ação no log de auditoria
   * @param {string} action - Ação realizada (LOGIN, CREATE_JOB, PROCESS_PAYMENT, etc.)
   * @param {string} userId - ID do usuário que realizou a ação
   * @param {string} resource - Tipo de recurso afetado (job, payment, user, etc.)
   * @param {Object} details - Detalhes específicos da operação
   * @param {string} ipAddress - IP do cliente
   * @param {string} userAgent - User Agent do navegador
   * @param {Object} options - Opções adicionais
   * @param {string} options.status - Status da ação ('success' ou 'failed')
   * @param {string} options.errorMessage - Mensagem de erro se failed
   * @returns {Promise<Object>} Documento criado
   */
  async log(
    action,
    userId,
    resource,
    details = {},
    ipAddress = null,
    userAgent = null,
    options = {}
  ) {
    const logEntry = {
      action,
      userId: userId || 'anonymous',
      resource,
      details,
      ipAddress,
      userAgent,
      status: options.status || 'success',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      sessionId: options.sessionId || null,
      errorMessage: options.errorMessage || null,
      severity: this._determineSeverity(action, options.status),
    };

    const docRef = await this.collection.add(logEntry);

    // Se for ação suspeita, alertar
    if (this._isSuspiciousActivity(logEntry)) {
      await this.alertOnSuspiciousActivity(logEntry);
    }

    return {
      id: docRef.id,
      ...logEntry,
    };
  }

  /**
   * Determina severidade do log
   * @private
   * @param {string} action - Ação
   * @param {string} status - Status
   * @returns {string} 'low', 'medium', 'high', 'critical'
   */
  _determineSeverity(action, status) {
    const criticalActions = [
      'PROCESS_PAYMENT',
      'CHANGE_PERMISSIONS',
      'DELETE_USER',
      'REVOKE_API_KEY',
    ];
    const highActions = ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'CREATE_ADMIN'];
    const mediumActions = ['LOGIN', 'LOGOUT', 'CREATE_JOB', 'UPDATE_PROFILE'];

    if (status === 'failed') {
      return 'high';
    }

    if (criticalActions.includes(action)) {
      return 'critical';
    }

    if (highActions.includes(action)) {
      return 'high';
    }

    if (mediumActions.includes(action)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Verifica se é atividade suspeita
   * @private
   * @param {Object} logEntry - Entry do log
   * @returns {boolean}
   */
  _isSuspiciousActivity(logEntry) {
    // Múltiplas falhas de login
    if (logEntry.action === 'LOGIN_FAILED') {
      return true;
    }

    // Tentativa de acesso não autorizado
    if (logEntry.action === 'UNAUTHORIZED_ACCESS') {
      return true;
    }

    // Mudanças de permissões fora do horário comercial (UTC)
    if (logEntry.action === 'CHANGE_PERMISSIONS') {
      const hour = new Date().getUTCHours();
      if (hour < 6 || hour > 22) {
        return true; // Mudança de permissões à noite/madrugada (UTC)
      }
    }

    return false;
  }

  /**
   * Alerta sobre atividade suspeita
   * @param {Object} logEntry - Entry suspeita
   * @returns {Promise<void>}
   */
  async alertOnSuspiciousActivity(logEntry) {
    // Salvar alerta em coleção separada
    await this.db.collection('securityAlerts').add({
      type: 'SUSPICIOUS_ACTIVITY',
      logEntry,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      investigated: false,
      severity: logEntry.severity,
    });

    // TODO: Integrar com sistema de notificações
    // - Enviar email para admins
    // - Notificação no dashboard
    // - Integração com Slack/Discord
    console.warn(`[SECURITY_ALERT] Atividade suspeita detectada:`, {
      action: logEntry.action,
      userId: logEntry.userId,
      ipAddress: logEntry.ipAddress,
    });
  }

  /**
   * Busca logs de um usuário específico
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções de filtro
   * @param {number} options.limit - Limite de resultados (default: 100)
   * @param {string} options.action - Filtrar por ação específica
   * @param {Date} options.startDate - Data inicial
   * @param {Date} options.endDate - Data final
   * @returns {Promise<Array>} Lista de logs
   */
  async getLogsForUser(userId, options = {}) {
    const limit = options.limit || 100;
    let query = this.collection.where('userId', '==', userId);

    if (options.action) {
      query = query.where('action', '==', options.action);
    }

    if (options.startDate) {
      query = query.where('timestamp', '>=', options.startDate);
    }

    if (options.endDate) {
      query = query.where('timestamp', '<=', options.endDate);
    }

    const snapshot = await query.orderBy('timestamp', 'desc').limit(limit).get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    }));
  }

  /**
   * Busca logs por ação
   * @param {string} action - Ação a buscar
   * @param {Object} options - Opções de filtro
   * @returns {Promise<Array>} Lista de logs
   */
  async getLogsByAction(action, options = {}) {
    const limit = options.limit || 100;
    let query = this.collection.where('action', '==', action);

    if (options.startDate) {
      query = query.where('timestamp', '>=', options.startDate);
    }

    if (options.endDate) {
      query = query.where('timestamp', '<=', options.endDate);
    }

    const snapshot = await query.orderBy('timestamp', 'desc').limit(limit).get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    }));
  }

  /**
   * Busca atividades suspeitas recentes
   * @param {Object} options - Opções de filtro
   * @returns {Promise<Array>} Lista de alertas
   */
  async getSuspiciousActivities(options = {}) {
    const limit = options.limit || 50;
    let query = this.db.collection('securityAlerts');

    if (options.investigated !== undefined) {
      query = query.where('investigated', '==', options.investigated);
    }

    const snapshot = await query.orderBy('timestamp', 'desc').limit(limit).get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    }));
  }

  /**
   * Marca alerta como investigado
   * @param {string} alertId - ID do alerta
   * @param {string} notes - Notas da investigação
   * @returns {Promise<void>}
   */
  async markAlertAsInvestigated(alertId, notes = '') {
    await this.db.collection('securityAlerts').doc(alertId).update({
      investigated: true,
      investigatedAt: admin.firestore.FieldValue.serverTimestamp(),
      investigationNotes: notes,
    });
  }

  /**
   * Detecta múltiplas falhas de login do mesmo IP
   * @param {string} ipAddress - IP a verificar
   * @param {number} minutes - Janela de tempo em minutos (default: 15)
   * @returns {Promise<number>} Quantidade de falhas
   */
  async detectLoginFailures(ipAddress, minutes = 15) {
    const startTime = new Date(Date.now() - minutes * 60 * 1000);

    const snapshot = await this.collection
      .where('action', '==', 'LOGIN_FAILED')
      .where('ipAddress', '==', ipAddress)
      .where('timestamp', '>=', startTime)
      .get();

    return snapshot.size;
  }

  /**
   * Limpa logs antigos (compliance - retenção de 90 dias)
   * @param {number} retentionDays - Dias de retenção (default: 90)
   * @returns {Promise<number>} Quantidade de logs deletados
   */
  async cleanupOldLogs(retentionDays = 90) {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const snapshot = await this.collection
      .where('timestamp', '<', cutoffDate)
      .limit(500) // Deletar em lotes
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`[AUDIT_CLEANUP] ${snapshot.size} logs deletados (mais de ${retentionDays} dias)`);

    return snapshot.size;
  }

  /**
   * Helper para logar login bem-sucedido
   * @param {string} userId - ID do usuário
   * @param {string} ipAddress - IP
   * @param {string} userAgent - User Agent
   * @returns {Promise<Object>}
   */
  async logSuccessfulLogin(userId, ipAddress, userAgent) {
    return this.log(
      'LOGIN',
      userId,
      'auth',
      {
        method: 'email-password',
        success: true,
      },
      ipAddress,
      userAgent,
      { status: 'success' }
    );
  }

  /**
   * Helper para logar falha de login
   * @param {string} email - Email tentado
   * @param {string} ipAddress - IP
   * @param {string} reason - Motivo da falha
   * @returns {Promise<Object>}
   */
  async logFailedLogin(email, ipAddress, reason) {
    return this.log(
      'LOGIN_FAILED',
      null,
      'auth',
      {
        attemptedEmail: email,
        reason,
      },
      ipAddress,
      null,
      { status: 'failed', errorMessage: reason }
    );
  }

  /**
   * Helper para logar criação de job
   * @param {string} userId - ID do usuário
   * @param {string} jobId - ID do job criado
   * @param {Object} jobData - Dados do job
   * @returns {Promise<Object>}
   */
  async logJobCreation(userId, jobId, jobData) {
    return this.log('CREATE_JOB', userId, 'job', {
      jobId,
      title: jobData.title,
      budget: jobData.orcamento,
    });
  }

  /**
   * Helper para logar processamento de pagamento
   * @param {string} userId - ID do usuário
   * @param {string} paymentId - ID do pagamento
   * @param {number} amount - Valor
   * @returns {Promise<Object>}
   */
  async logPaymentProcessed(userId, paymentId, amount) {
    return this.log('PROCESS_PAYMENT', userId, 'payment', {
      paymentId,
      amount,
      currency: 'BRL',
    });
  }
}

module.exports = AuditLogger;
