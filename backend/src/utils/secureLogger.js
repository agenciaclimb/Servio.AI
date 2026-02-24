/**
 * SECURE LOGGER
 *
 * Envolve o `console` padrão filtrando emails e CPFs para evitar vazamento
 * de PII (Personally Identifiable Information) em logs centralizados (Cloud Logging).
 *
 * @module utils/secureLogger
 */

/**
 * Remove identificadores óbvios de PII de objetos ou strings antes do log.
 * @param {any} data
 * @returns {any}
 */
const maskPII = (data) => {
  if (typeof data === 'string') {
    // Basic mask for emails: a***b@domain.com
    let masked = data.replace(/([a-zA-Z0-9_\.-]+)@([\da-zA-Z\.-]+)\.([a-zA-Z\.]{2,6})/g, (match, p1, p2, p3) => {
      if (p1.length <= 2) return `***@${p2}.${p3}`;
      return `${p1[0]}***${p1[p1.length - 1]}@${p2}.${p3}`;
    });
    // Basic mask for CPF like patterns (XXX.XXX.XXX-XX)
    masked = masked.replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, '***.***.***-**');
    return masked;
  }
  
  if (data instanceof Error) {
    const safeError = new Error(maskPII(data.message));
    safeError.stack = maskPII(data.stack || '');
    safeError.name = data.name;
    return safeError;
  }

  if (typeof data === 'object' && data !== null) {
    // Avoid mutating the original or dealing with deep clones, just JSON-stringify with replacer
    try {
      const stringified = JSON.stringify(data, (key, value) => {
        if (typeof value === 'string') return maskPII(value);
        return value;
      });
      return JSON.parse(stringified);
    } catch (e) {
      return '[Objeto complexo mascarado]';
    }
  }

  return data;
};

const formatLog = (severity, args) => {
  const maskedArgs = args.map(maskPII);
  
  if (process.env.NODE_ENV === 'production') {
    // Google Cloud Structured Logging Format
    const logEntry = {
      severity,
      message: maskedArgs.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '),
      context: maskedArgs.find(arg => typeof arg === 'object' && !Array.isArray(arg) && !(arg instanceof Error)) || {},
    };

    // Auto-integrate with Google Cloud Error Reporting
    const errorArg = args.find(arg => arg instanceof Error);
    if (errorArg) {
      logEntry['@type'] = 'type.googleapis.com/google.devtools.clouderrorreporting.v1beta1.ReportedErrorEvent';
      logEntry.message = errorArg.stack || errorArg.message;
    }

    console.log(JSON.stringify(logEntry));
  } else {
    // Formato amigável para console local dev
    const consoleMethod = severity === 'ERROR' ? 'error' : severity === 'WARNING' ? 'warn' : severity === 'DEBUG' ? 'debug' : 'log';
    console[consoleMethod](`[${severity}]`, ...maskedArgs);
  }
};

const secureLogger = {
  info: (...args) => formatLog('INFO', args),
  warn: (...args) => formatLog('WARNING', args),
  error: (...args) => formatLog('ERROR', args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
      formatLog('DEBUG', args);
    }
  }
};

module.exports = secureLogger;
