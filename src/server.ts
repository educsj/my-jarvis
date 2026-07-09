import { env } from './config/env.js';
import { buildApp } from './app.js';
import { ensureDefaultUser } from './lib/ensureUser.js';

async function start() {
  const app = buildApp();

  try {
    // Garante usuário + settings padrão na primeira execução
    await ensureDefaultUser();

    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🤖 Meu Jarvis rodando em http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
