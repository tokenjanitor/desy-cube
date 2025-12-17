import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createStaticServer } from './static-server.ts';

const { values } = parseArgs({ options: {
  port: { type: 'string', default: '4322' },
  help: { type: 'boolean' },
} });
if (values.help) {
  console.log('Usage: node scripts/serve.ts [--port 4322]');
  process.exit(0);
}
const port = Number(values.port);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port.');
const server = await createStaticServer([
  { prefix: '/', directory: resolve(import.meta.dirname, '..'), allowedTopLevel: ['css', 'theme', 'examples'] },
]);
server.listen(port, '127.0.0.1', () => console.log('Cube preview: http://127.0.0.1:' + port + '/examples/'));
