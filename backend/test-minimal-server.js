const express = require('express');

const app = express();
const PORT = process.env.PORT || 8083;

app.get('/test', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Minimal server listening on 0.0.0.0:${PORT}`);
  console.log('Server address:', server.address());
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Keep alive
process.stdin.resume();
setInterval(() => {
  console.log('Heartbeat - port', PORT);
}, 5000);
