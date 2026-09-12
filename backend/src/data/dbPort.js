const net = require('net');
const { PORTS } = require('../config/constants');

// The backend uses SQLite (file-based), so no real database process is needed.
// However the user reserves port 10178 for "database" — we bind a simple
// keep-alive TCP server to that port so nothing else can claim it.
function startDatabasePlaceholder() {
  const server = net.createServer((socket) => {
    socket.write('letter-pigeon-db-placeholder\r\n');
    socket.end();
  });
  server.listen(PORTS.DATABASE, '0.0.0.0', () => {
    console.log(`[db-placeholder] listening on 0.0.0.0:${PORTS.DATABASE}`);
  });
}

module.exports = { startDatabasePlaceholder };
