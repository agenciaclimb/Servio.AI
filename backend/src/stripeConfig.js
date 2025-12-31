const stripeLib = require('stripe');

function detectMode(secretKey) {
  if (!secretKey) return 'disabled';
  if (secretKey.startsWith('sk_test_')) return 'test';
  if (secretKey.startsWith('sk_live_')) return 'live';
  return 'unknown';
}

function createStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn('[Stripe] STRIPE_SECRET_KEY missing – Stripe features disabled');
    return null;
  }
  const mode = detectMode(key);
  if (mode === 'test' && process.env.NODE_ENV === 'production') {
    console.warn(
      '[Stripe] TEST key detected while NODE_ENV=production. Replace with LIVE key before launch.'
    );
  }
  const instance = stripeLib(key);
  return { instance, mode };
}

module.exports = { createStripe, detectMode };
