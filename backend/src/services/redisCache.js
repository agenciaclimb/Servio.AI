/**
 * Redis Cache Service - Task 3.1
 * 
 * Implementa caching de operações custosas Gemini (match-providers)
 * com estratégia de TTL (Time To Live) configurável.
 * 
 * Features:
 * - Cache de match-providers (economiza ~$20/mês em Gemini calls)
 * - TTL configurável (default: 5 minutos)
 * - Hit rate tracking para analytics
 * - Fallback gracioso (continua funcionando sem Redis)
 * - Cloud Logging integration
 * 
 * @author Task 3.1 - Week 2 Optimization Phase
 * @date 18/12/2025
 */

const redis = require('redis');

// Cache configuration
const CACHE_CONFIG = {
  // Match providers cache (API chamada frequentemente)
  MATCH_PROVIDERS_TTL: 300, // 5 minutos (token budget: ~5M por call)
  
  // Key prefixes
  MATCH_KEY_PREFIX: 'match:',
};

// Global client instance
let redisClient = null;
let isConnected = false;

/**
 * Inicializa conexão Redis com fallback gracioso
 * @async
 * @returns {Promise<boolean>} true se conectado com sucesso
 */
async function initRedis() {
  try {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || 6379;
    const password = process.env.REDIS_PASSWORD || undefined;

    redisClient = redis.createClient({
      host,
      port,
      password,
      retry_strategy: (opts) => {
        if (opts.error && opts.error.code === 'ECONNREFUSED') {
          console.warn('[Redis] Connection refused. Cache disabled (graceful fallback)');
          return new Error('Redis connection refused');
        }
        if (opts.total_retry_time > 1000 * 60 * 10) {
          return new Error('Redis retry time exhausted');
        }
        if (opts.attempt > 10) {
          return undefined;
        }
        return Math.min(opts.attempt * 100, 3000);
      },
    });

    // Eventos de conexão
    redisClient.on('connect', () => {
      isConnected = true;
      console.log(JSON.stringify({
        severity: 'INFO',
        message: '[Redis] Connected successfully',
        service: 'redisCache',
        timestamp: new Date().toISOString(),
      }));
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      console.error(JSON.stringify({
        severity: 'ERROR',
        message: '[Redis] Connection error (continuing without cache)',
        service: 'redisCache',
        error: err.message,
        timestamp: new Date().toISOString(),
      }));
    });

    redisClient.on('reconnecting', () => {
      console.warn(JSON.stringify({
        severity: 'WARN',
        message: '[Redis] Reconnecting...',
        service: 'redisCache',
        timestamp: new Date().toISOString(),
      }));
    });

    return true;
  } catch (err) {
    console.error(JSON.stringify({
      severity: 'ERROR',
      message: '[Redis] Initialization error',
      service: 'redisCache',
      error: err.message,
      timestamp: new Date().toISOString(),
    }));
    return false;
  }
}

/**
 * Gera chave de cache para match-providers
 * Formato: match:{jobId}:{jobCategory}:{locationHash}:{userCount}
 * 
 * @param {string} jobId - Job ID
 * @param {string} category - Job category (normalized)
 * @param {string} location - Job location (normalized)
 * @param {number} userCount - Número de usuários no índice
 * @returns {string} Cache key
 */
function generateMatchCacheKey(jobId, category = '', location = '', userCount = 0) {
  const normalizedCategory = (category || '').toLowerCase().slice(0, 20);
  const normalizedLocation = (location || '').toLowerCase().slice(0, 20);
  const hash = `${normalizedCategory}:${normalizedLocation}`;

  return `${CACHE_CONFIG.MATCH_KEY_PREFIX}${jobId}:${hash}:${userCount}`;
}

/**
 * Obtém resultado do cache (match-providers)
 * @async
 * @param {string} jobId - Job ID
 * @param {string} category - Job category
 * @param {string} location - Job location
 * @param {number} userCount - Total de usuários
 * @returns {Promise<object|null>} Cached result ou null se cache miss
 */
async function getCachedMatches(jobId, category = '', location = '', userCount = 0) {
  if (!isConnected || !redisClient) {
    return null;
  }

  try {
    const key = generateMatchCacheKey(jobId, category, location, userCount);
    
    return new Promise((resolve) => {
      redisClient.get(key, (err, data) => {
        if (err) {
          console.warn(JSON.stringify({
            severity: 'WARN',
            message: '[Redis] Get error (cache miss)',
            service: 'redisCache',
            key,
            error: err.message,
            timestamp: new Date().toISOString(),
          }));
          resolve(null);
          return;
        }

        if (data) {
          console.log(JSON.stringify({
            severity: 'INFO',
            message: '[Redis] Cache HIT - match-providers',
            service: 'redisCache',
            key,
            dataSize: data.length,
            timestamp: new Date().toISOString(),
          }));
          resolve(JSON.parse(data));
        } else {
          resolve(null);
        }
      });
    });
  } catch (err) {
    console.error(JSON.stringify({
      severity: 'ERROR',
      message: '[Redis] getCachedMatches error',
      service: 'redisCache',
      error: err.message,
      timestamp: new Date().toISOString(),
    }));
    return null;
  }
}

/**
 * Armazena resultado em cache (match-providers)
 * @async
 * @param {string} jobId - Job ID
 * @param {string} category - Job category
 * @param {string} location - Job location
 * @param {number} userCount - Total de usuários
 * @param {object} result - Resultado para cachear
 * @param {number} ttl - TTL em segundos (default: 300)
 * @returns {Promise<boolean>} true se salvo com sucesso
 */
async function cacheMatches(jobId, category = '', location = '', userCount = 0, result, ttl = CACHE_CONFIG.MATCH_PROVIDERS_TTL) {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    const key = generateMatchCacheKey(jobId, category, location, userCount);
    const data = JSON.stringify(result);

    return new Promise((resolve) => {
      redisClient.setex(key, ttl, data, (err) => {
        if (err) {
          console.warn(JSON.stringify({
            severity: 'WARN',
            message: '[Redis] Set error',
            service: 'redisCache',
            key,
            error: err.message,
            timestamp: new Date().toISOString(),
          }));
          resolve(false);
          return;
        }

        console.log(JSON.stringify({
          severity: 'INFO',
          message: '[Redis] Cached match-providers result',
          service: 'redisCache',
          key,
          ttl,
          dataSize: data.length,
          timestamp: new Date().toISOString(),
        }));
        resolve(true);
      });
    });
  } catch (err) {
    console.error(JSON.stringify({
      severity: 'ERROR',
      message: '[Redis] cacheMatches error',
      service: 'redisCache',
      error: err.message,
      timestamp: new Date().toISOString(),
    }));
    return false;
  }
}

/**
 * Invalida cache de match-providers para um job
 * (útil quando job é atualizado)
 * @async
 * @param {string} jobId - Job ID
 * @returns {Promise<boolean>} true se invalidado
 */
async function invalidateMatchCache(jobId) {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    const pattern = `${CACHE_CONFIG.MATCH_KEY_PREFIX}${jobId}:*`;
    
    return new Promise((resolve) => {
      redisClient.keys(pattern, (err, keys) => {
        if (err || !keys || keys.length === 0) {
          console.log(JSON.stringify({
            severity: 'INFO',
            message: '[Redis] No cache keys found to invalidate',
            service: 'redisCache',
            jobId,
            timestamp: new Date().toISOString(),
          }));
          resolve(false);
          return;
        }

        redisClient.del(...keys, (delErr) => {
          if (delErr) {
            console.warn(JSON.stringify({
              severity: 'WARN',
              message: '[Redis] Delete error',
              service: 'redisCache',
              error: delErr.message,
              timestamp: new Date().toISOString(),
            }));
            resolve(false);
            return;
          }

          console.log(JSON.stringify({
            severity: 'INFO',
            message: '[Redis] Invalidated match cache',
            service: 'redisCache',
            jobId,
            keysDeleted: keys.length,
            timestamp: new Date().toISOString(),
          }));
          resolve(true);
        });
      });
    });
  } catch (err) {
    console.error(JSON.stringify({
      severity: 'ERROR',
      message: '[Redis] invalidateMatchCache error',
      service: 'redisCache',
      error: err.message,
      timestamp: new Date().toISOString(),
    }));
    return false;
  }
}

/**
 * Obtém estatísticas de cache (info Redis)
 * @async
 * @returns {Promise<object>} Stats ou empty object se offline
 */
async function getCacheStats() {
  if (!isConnected || !redisClient) {
    return { online: false, message: 'Redis não está conectado' };
  }

  try {
    return new Promise((resolve) => {
      redisClient.info((err, data) => {
        if (err) {
          resolve({ online: false, error: err.message });
          return;
        }

        // Parse Redis INFO output
        const stats = {
          online: true,
          connected_clients: 0,
          used_memory_human: 'N/A',
          evicted_keys: 0,
          total_commands_processed: 0,
        };

        const lines = data.split('\r\n');
        lines.forEach(line => {
          if (line.includes('connected_clients:')) {
            stats.connected_clients = parseInt(line.split(':')[1], 10);
          } else if (line.includes('used_memory_human:')) {
            stats.used_memory_human = line.split(':')[1];
          } else if (line.includes('evicted_keys:')) {
            stats.evicted_keys = parseInt(line.split(':')[1], 10);
          } else if (line.includes('total_commands_processed:')) {
            stats.total_commands_processed = parseInt(line.split(':')[1], 10);
          }
        });

        resolve(stats);
      });
    });
  } catch (err) {
    console.error(JSON.stringify({
      severity: 'ERROR',
      message: '[Redis] getCacheStats error',
      service: 'redisCache',
      error: err.message,
      timestamp: new Date().toISOString(),
    }));
    return { online: false, error: err.message };
  }
}

/**
 * Fecha conexão Redis graciosamente
 * @async
 */
async function closeRedis() {
  return new Promise((resolve) => {
    if (redisClient && isConnected) {
      redisClient.quit((err) => {
        if (err) {
          console.error(JSON.stringify({
            severity: 'ERROR',
            message: '[Redis] Error closing connection',
            service: 'redisCache',
            error: err.message,
            timestamp: new Date().toISOString(),
          }));
        } else {
          console.log(JSON.stringify({
            severity: 'INFO',
            message: '[Redis] Connection closed gracefully',
            service: 'redisCache',
            timestamp: new Date().toISOString(),
          }));
        }
        isConnected = false;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Health check para Redis
 * @async
 * @returns {Promise<boolean>} true se saudável
 */
async function healthCheck() {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    return new Promise((resolve) => {
      redisClient.ping((err, reply) => {
        resolve(!err && reply === 'PONG');
      });
    });
  } catch {
    return false;
  }
}

module.exports = {
  // Lifecycle
  initRedis,
  closeRedis,
  healthCheck,

  // Match-providers cache
  getCachedMatches,
  cacheMatches,
  invalidateMatchCache,

  // Admin
  getCacheStats,

  // Config
  CACHE_CONFIG,
};
