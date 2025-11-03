// Quick backend health checker for Cloud Run endpoints
// Usage: npm run check:backend

const BASE = process.env.VITE_BACKEND_API_URL || process.env.BACKEND_URL || 'https://servio-backend-h5ogjon7aa-uw.a.run.app';

async function ping(path, opts = {}) {
  const url = `${BASE}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, { method: 'GET', ...opts });
    const ms = Date.now() - start;
    return { path, status: res.status, ok: res.ok, ms };
  } catch (e) {
    const ms = Date.now() - start;
    return { path, status: 'ERR', ok: false, ms, error: String(e?.message || e) };
  }
}

async function main() {
  console.log(`Checking backend base: ${BASE}`);
  const checks = [
    await ping('/'),
    await ping('/health'),
    await ping('/version'),
    // Expect 401/405 here (auth required); we're just checking liveness
    await ping('/generate-upload-url'),
  ];
  for (const c of checks) {
    const line = `${c.path.padEnd(24)} → ${String(c.status).padEnd(4)}  ${c.ms}ms${c.error ? '  '+c.error : ''}`;
    console.log(line);
  }
  const allAlive = checks.some(c => c.ok || (typeof c.status === 'number' && c.status < 500));
  if (!allAlive) process.exitCode = 1;
}

main();
