module.exports = {
  config: () => ({ env: 'test', service: { account_sid: 'AC123', auth_token: 'auth123', phone_number: '+1234567890' } }),
  logger: {
    info: () => {},
    error: () => {},
    warn: () => {},
    log: () => {},
  },
  https: {
    onRequest: (fn) => fn,
    onCall: (fn) => fn,
  },
};
