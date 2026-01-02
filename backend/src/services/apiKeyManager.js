/**
 * API KEY MANAGER
 *
 * Sistema de rotação automática de chaves de API com versionamento
 * - Gera novas keys com versão
 * - Mantém 2 versões simultâneas por 7 dias
 * - Depreca e remove após período
 * - Logs de todas as rotações em Firestore
 *
 * @module services/apiKeyManager
 */

const crypto = require('crypto');
const admin = require('firebase-admin');

class ApiKeyManager {
  constructor(db) {
    this.db = db || admin.firestore();
    this.collection = this.db.collection('apiKeys');
  }

  /**
   * Gera uma chave segura usando crypto
   * @private
   * @returns {string} Key em formato base64
   */
  _generateSecureKey() {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Hash de uma chave para armazenamento seguro
   * @private
   * @param {string} key - Chave em texto
   * @returns {string} Hash SHA-256
   */
  _hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Incrementa versão da key
   * @private
   * @param {string} currentVersion - Versão atual (ex: 'v1')
   * @returns {string} Nova versão (ex: 'v2')
   */
  _incrementVersion(currentVersion = 'v0') {
    const num = parseInt(currentVersion.replace('v', ''), 10);
    return `v${num + 1}`;
  }

  /**
   * Gera nova API Key para um usuário/serviço
   * @param {string} userId - ID do usuário
   * @param {string} service - Nome do serviço (ex: 'gemini', 'stripe', 'twilio')
   * @param {Object} options - Opções adicionais
   * @param {number} options.expiresInDays - Dias até expirar (default: 7)
   * @returns {Promise<Object>} { key, version, expiresAt }
   */
  async generateNewKey(userId, service, options = {}) {
    const expiresInDays = options.expiresInDays || 7;

    // Buscar versão atual
    const existingKeys = await this.collection
      .where('userId', '==', userId)
      .where('service', '==', service)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    let version = 'v1';
    if (!existingKeys.empty) {
      const lastKey = existingKeys.docs[0].data();
      version = this._incrementVersion(lastKey.version);
    }

    // Gerar nova key
    const key = this._generateSecureKey();
    const hashedKey = this._hashKey(key);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    // Salvar no Firestore
    const keyDoc = await this.collection.add({
      userId,
      service,
      keyHash: hashedKey, // NUNCA salvar key em texto
      version,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
      rotations: 0,
      lastUsedAt: null,
    });

    // Log da operação
    await this._logRotation(userId, service, version, 'CREATED');

    return {
      id: keyDoc.id,
      key, // Retornar apenas 1 vez (para usuário salvar)
      version,
      expiresAt,
      service,
    };
  }

  /**
   * Valida se uma API key é válida
   * @param {string} key - Key em texto
   * @param {string} service - Nome do serviço
   * @returns {Promise<boolean|Object>} false ou dados da key válida
   */
  async validateKey(key, service) {
    const hashedKey = this._hashKey(key);

    const snapshot = await this.collection
      .where('keyHash', '==', hashedKey)
      .where('service', '==', service)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return false;
    }

    const keyDoc = snapshot.docs[0];
    const keyData = keyDoc.data();

    // Verificar se expirou
    if (keyData.expiresAt.toDate() < new Date()) {
      // Revogar automaticamente
      await keyDoc.ref.update({ status: 'expired' });
      return false;
    }

    // Atualizar last used
    await keyDoc.ref.update({
      lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      id: keyDoc.id,
      userId: keyData.userId,
      version: keyData.version,
      service: keyData.service,
    };
  }

  /**
   * Rotaciona keys expiradas (rodar em Cloud Scheduler diariamente)
   * @returns {Promise<Object>} { revoked: number, active: number }
   */
  async rotateExpiredKeys() {
    const now = new Date();
    let revokedCount = 0;

    // Buscar keys expiradas
    const expiredSnapshot = await this.collection
      .where('status', '==', 'active')
      .where('expiresAt', '<', now)
      .get();

    // Revogar cada uma
    const batch = this.db.batch();
    expiredSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'expired',
        revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      revokedCount++;

      // Log
      const data = doc.data();
      this._logRotation(data.userId, data.service, data.version, 'EXPIRED');
    });

    await batch.commit();

    // Contar keys ativas
    const activeSnapshot = await this.collection.where('status', '==', 'active').get();

    console.log(`[API_KEY_ROTATION] ${revokedCount} keys expiradas, ${activeSnapshot.size} ativas`);

    return {
      revoked: revokedCount,
      active: activeSnapshot.size,
    };
  }

  /**
   * Lista todas as keys de um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções de filtro
   * @returns {Promise<Array>} Lista de keys
   */
  async listUserKeys(userId, options = {}) {
    let query = this.collection.where('userId', '==', userId);

    if (options.service) {
      query = query.where('service', '==', options.service);
    }

    if (options.status) {
      query = query.where('status', '==', options.status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        service: data.service,
        version: data.version,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
        expiresAt: data.expiresAt?.toDate(),
        lastUsedAt: data.lastUsedAt?.toDate(),
      };
    });
  }

  /**
   * Revoga manualmente uma key
   * @param {string} keyId - ID da key no Firestore
   * @param {string} reason - Motivo da revogação
   * @returns {Promise<void>}
   */
  async revokeKey(keyId, reason = 'MANUAL_REVOCATION') {
    const keyDoc = await this.collection.doc(keyId).get();

    if (!keyDoc.exists) {
      throw new Error('Key não encontrada');
    }

    const data = keyDoc.data();

    await keyDoc.ref.update({
      status: 'revoked',
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      revocationReason: reason,
    });

    await this._logRotation(data.userId, data.service, data.version, 'REVOKED', reason);

    console.log(`[API_KEY_REVOKED] Key ${keyId} revogada: ${reason}`);
  }

  /**
   * Log de rotação para auditoria
   * @private
   * @param {string} userId - ID do usuário
   * @param {string} service - Serviço
   * @param {string} version - Versão da key
   * @param {string} action - Ação (CREATED, EXPIRED, REVOKED)
   * @param {string} details - Detalhes adicionais
   * @returns {Promise<void>}
   */
  async _logRotation(userId, service, version, action, details = null) {
    await this.db.collection('apiKeyRotations').add({
      userId,
      service,
      version,
      action,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

module.exports = ApiKeyManager;
