/* eslint-disable no-console */
const shouldLog = () => import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logInfo = (...args: unknown[]) => {
  if (shouldLog()) console.info(...args);
};

export const logDebug = (...args: unknown[]) => {
  if (shouldLog()) console.debug(...args);
};

export const logWarn = (...args: unknown[]) => {
  if (shouldLog()) console.warn(...args);
};

export const logError = (...args: unknown[]) => {
  if (shouldLog()) console.error(...args);
};
