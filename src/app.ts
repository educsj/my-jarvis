import Fastify from 'fastify';
import path from 'node:path';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { settingsRoutes } from './routes/settings.routes.js';
import { remindersRoutes } from './routes/reminders.routes.js';
import { chatRoutes } from './routes/chat.routes.js';
import { googleRoutes } from './routes/google.routes.js';
import { knowledgeRoutes } from './routes/knowledge.routes.js';

export function buildApp() {
  const app = Fastify({
    logger: {
      transport:
        process.env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
          : undefined,
    },
  });

  app.register(cors, {
    origin: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });
  app.register(sensible);
  app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } }); // áudio e documentos (até 50MB)

  // Serve os áudios gerados pelo TTS (Piper) em /audio/<arquivo>.wav
  app.register(fastifyStatic, {
    root: path.resolve(process.cwd(), 'temp_audio'),
    prefix: '/audio/',
    decorateReply: false,
  });

  // Healthcheck
  app.get('/health', async () => ({ status: 'ok', service: 'meu-jarvis-backend' }));

  // Página inicial — índice amigável dos endpoints (backend é uma API)
  app.get('/', async (_request, reply) => {
    reply.type('text/html').send(landingPageHtml());
  });

  // Rotas de domínio
  app.register(settingsRoutes);
  app.register(remindersRoutes);
  app.register(chatRoutes);
  app.register(googleRoutes);
  app.register(knowledgeRoutes);

  return app;
}

function landingPageHtml(): string {
  const endpoints: Array<[string, string, string]> = [
    ['GET', '/health', 'Status do servidor'],
    ['GET', '/settings', 'Matriz de personalidade (humor/empatia)'],
    ['PUT', '/settings', 'Ajustar humor / empatia / modelo'],
    ['GET', '/reminders', 'Listar lembretes'],
    ['POST', '/reminders', 'Criar lembrete'],
    ['PUT', '/reminders/:id', 'Atualizar lembrete'],
    ['DELETE', '/reminders/:id', 'Remover lembrete'],
    ['POST', '/chat', 'Conversar por texto'],
    ['POST', '/chat/voice', 'Conversar por voz (áudio)'],
    ['GET', '/auth/google', 'Conectar Google Calendar (OAuth2)'],
    ['GET', '/auth/google/status', 'Status da conexão Google'],
    ['GET', '/calendar/today', 'Eventos de hoje'],
    ['POST', '/calendar/events', 'Criar evento no calendário'],
  ];

  const rows = endpoints
    .map(
      ([method, path, desc]) =>
        `<tr><td><span class="m m-${method.toLowerCase()}">${method}</span></td><td><code>${path}</code></td><td>${desc}</td></tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Meu Jarvis — API</title>
  <style>
    :root { color-scheme: dark light; }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: radial-gradient(1200px 600px at 50% -10%, #1b2735, #090a0f 60%);
      color: #e6e9ef;
    }
    .card {
      width: min(760px, 92vw); padding: 2.2rem 2.4rem; border-radius: 18px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 30px 80px rgba(0,0,0,0.5); backdrop-filter: blur(6px);
    }
    .top { display: flex; align-items: center; gap: .8rem; margin-bottom: .3rem; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: #34d399; box-shadow: 0 0 12px #34d399; }
    h1 { font-size: 1.5rem; margin: 0; letter-spacing: .3px; }
    .sub { color: #9aa4b2; margin: .2rem 0 1.6rem; font-size: .95rem; }
    table { width: 100%; border-collapse: collapse; font-size: .92rem; }
    td { padding: .55rem .4rem; border-bottom: 1px solid rgba(255,255,255,0.06); vertical-align: middle; }
    tr:last-child td { border-bottom: 0; }
    code { color: #cbd5e1; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .m { font-size: .72rem; font-weight: 700; padding: .15rem .5rem; border-radius: 6px; display: inline-block; min-width: 54px; text-align: center; }
    .m-get { background: rgba(52,211,153,.15); color: #6ee7b7; }
    .m-post { background: rgba(96,165,250,.15); color: #93c5fd; }
    .m-put { background: rgba(251,191,36,.15); color: #fcd34d; }
    .m-delete { background: rgba(248,113,113,.15); color: #fca5a5; }
    .foot { margin-top: 1.6rem; color: #7c8798; font-size: .82rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="top"><span class="dot"></span><h1>🤖 Meu Jarvis — API</h1></div>
    <p class="sub">Backend no ar. Este servidor é uma API — use os endpoints abaixo. O painel visual virá na Fase 4 (Next.js).</p>
    <table><tbody>${rows}</tbody></table>
    <p class="foot">Dica: teste no navegador as rotas <code>GET</code> (ex.: <a href="/settings" style="color:#93c5fd">/settings</a>). As demais precisam de um cliente HTTP (curl / Postman).</p>
  </div>
</body>
</html>`;
}
