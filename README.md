# 🤖 Meu Jarvis — Assistente Pessoal Inteligente

Assistente de voz pessoal, **100% local e open-source**, focado em privacidade, gestão de tarefas e integração de calendário. Inspirado nos robôs de _Interestelar_ (TARS/CASE), com parâmetros ajustáveis de **humor** e **empatia**.

## 🧱 Stack Tecnológico

| Camada           | Tecnologia                                            |
| ---------------- | ----------------------------------------------------- |
| Backend          | Node.js + TypeScript + **Fastify**                    |
| Banco de Dados   | **SQLite** com **Prisma ORM** (v6)                    |
| IA (Cérebro)     | Ollama (Llama 3.1 8B / Qwen 2.5) — _Fase 2_           |
| Voz              | Whisper.cpp (STT) + Piper TTS — _Fase 2_              |
| Frontend Web     | Next.js + TailwindCSS + Framer Motion — _Fase 4_      |
| Frontend Mobile  | React Native (Expo) — _Fase 5_                        |
| Acesso Remoto    | Cloudflare Tunnels / Tailscale                        |

## 🚦 Progresso por Fase

- [x] **Fase 1 — Setup do Backend e Banco de Dados** ✅
- [x] **Fase 2 — Motor de Inteligência e Áudio** (Ollama + Whisper + Piper) ✅
- [x] **Fase 3 — Integração Google Calendar** (OAuth2 + Function Calling) ✅
- [x] **Fase 4 — Frontend Web** (Next.js) ✅
- [x] **Fase 5 — Frontend Mobile** (Expo / `.apk`) ✅

---

## ✅ Fase 1 — O que foi entregue

### 1. Projeto Node.js + TypeScript
- ESM (`"type": "module"`), `tsx` para dev com hot-reload.
- **ESLint** (flat config v9 + `typescript-eslint`) e **Prettier** configurados e integrados.

### 2. SQLite + Prisma ORM
- Banco local `prisma/dev.db` (ignorado pelo Git).
- Migração inicial aplicada + `seed` com dados de exemplo.

### 3. Models (`prisma/schema.prisma`)
- **User** — dono do assistente (MVP mono-usuário).
- **Reminder** — lembretes/tarefas (título, descrição, data, status).
- **ChatHistory** — histórico de conversa (role, conteúdo, áudio).
- **Settings** — 🎛️ **Matriz de Personalidade**: `humorLevel` e `empathyLevel` (0–100) + `llmModel`.

### 4. Rotas CRUD (Fastify + validação Zod)

| Método | Rota              | Descrição                                    |
| ------ | ----------------- | -------------------------------------------- |
| GET    | `/health`         | Healthcheck                                  |
| GET    | `/settings`       | Lê a matriz de personalidade                 |
| PUT    | `/settings`       | Ajusta Humor / Empatia / modelo LLM          |
| GET    | `/reminders`      | Lista lembretes                              |
| GET    | `/reminders/:id`  | Busca um lembrete                            |
| POST   | `/reminders`      | Cria lembrete                                |
| PUT    | `/reminders/:id`  | Atualiza lembrete                            |
| DELETE | `/reminders/:id`  | Remove lembrete                              |

Validação de entrada com **Zod** (ex.: `humorLevel` fora de 0–100 → HTTP 400).

---

## ✅ Fase 2 — O que foi entregue

### 1. Integração Ollama + Matriz de Personalidade dinâmica
- Cliente HTTP para a API do Ollama (`/api/chat`, porta 11434) com timeout e **degradação graciosa** (se o Ollama estiver offline, retorna mensagem clara em vez de quebrar).
- **Gerenciador de System Prompt** (`services/personality.ts`): converte `humorLevel`/`empathyLevel` (0–100) do banco em instruções de tom, estilo TARS/CASE. Ex.: humor alto → sarcástico; empatia baixa → factual/eficiente. O prompt é remontado **a cada requisição**, então mexer nos sliders muda a persona na hora.
- Histórico de conversa persistido em `ChatHistory` e reinjetado como contexto (últimas 10 mensagens).

### 2. Stubs de STT e TTS
- `services/stt.ts` — stub do **Whisper.cpp** (retorna transcrição simulada; interface pronta para plugar o binário).
- `services/tts.ts` — stub do **Piper TTS** (gera um artefato em `/temp_audio`; interface pronta para saída `.wav`).

### 3. Rotas de conversa

| Método | Rota          | Descrição                                                   |
| ------ | ------------- | ----------------------------------------------------------- |
| POST   | `/chat`       | Conversa por **texto** (testar cérebro + personalidade)     |
| POST   | `/chat/voice` | Pipeline de **voz**: áudio → STT → LLM → TTS → áudio         |

> ⚙️ **Para o cérebro funcionar de verdade:** instale o [Ollama](https://ollama.com), rode `ollama pull llama3.1:8b` e deixe-o ativo. Sem isso, as rotas respondem com o aviso "[Cérebro offline]" (por design).

---

## ✅ Fase 3 — O que foi entregue

### 1. Fluxo OAuth2 com Google Calendar
- Cliente OAuth2 (`services/google/oauth.ts`) com escopo `calendar.events`, `access_type=offline` (refresh token) e **refresh automático** de tokens.
- Tokens salvos em `token.json` (protegido pelo `.gitignore`).
- **Degradação graciosa:** sem credenciais no `.env`, as rotas respondem com aviso claro (HTTP 503/409) em vez de quebrar.

### 2. Function Calling no LLM
- Ferramentas expostas ao modelo (`services/google/tools.ts`): `get_today_events` e `create_calendar_event`.
- O `services/chat.ts` roda um **loop de tools**: o LLM decide chamar uma função → o backend executa no Google Calendar → devolve o resultado ao modelo → ele responde em linguagem natural (com a personalidade aplicada). As tools só são oferecidas quando o Google está configurado.

### 3. Rotas

| Método | Rota                     | Descrição                                  |
| ------ | ------------------------ | ------------------------------------------ |
| GET    | `/auth/google`           | Inicia o consentimento OAuth2              |
| GET    | `/auth/google/callback`  | Recebe o code e salva os tokens            |
| GET    | `/auth/google/status`    | `configured` / `connected`                 |
| DELETE | `/auth/google`           | Desconecta (remove tokens)                 |
| GET    | `/calendar/today`        | Eventos do dia (`?date=YYYY-MM-DD`)        |
| POST   | `/calendar/events`       | Cria evento diretamente                    |

### 🔑 Como obter as credenciais do Google (quando quiser ativar)
1. Acesse o [Google Cloud Console](https://console.cloud.google.com) → crie um projeto.
2. **APIs e serviços → Biblioteca** → ative a **Google Calendar API**.
3. **Tela de consentimento OAuth** → tipo "Externo" → adicione seu e-mail como usuário de teste.
4. **Credenciais → Criar credenciais → ID do cliente OAuth** → tipo "Aplicativo da Web".
5. Em **URIs de redirecionamento autorizados**, adicione: `http://localhost:3333/auth/google/callback`
6. Copie o **Client ID** e **Client Secret** para o `.env` (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`).
7. Reinicie o servidor, abra `http://localhost:3333/auth/google` e autorize.

---

## ✅ Fase 4 — O que foi entregue

Painel web em **Next.js 16 + React 19 + Tailwind v4 + Framer Motion**, no diretório `/web`.

### Direção visual — "Cockpit Monolith"
Estética dos robôs TARS/CASE de _Interestelar_: instrumentos matte escuros, sinal âmbar (luz de cabine), tipografia mono-forward (Space Grotesk + JetBrains Mono). O **elemento-assinatura** é a **Matriz de Personalidade** com barras segmentadas arrastáveis (eco da cena "What's your humor setting, TARS?").

### Painéis (todos ligados à API, em tempo real)
- **Status Rail** — status de Backend, Cérebro (Ollama + modelo), Calendar e leitura HUM/EMP.
- **Matriz de Personalidade** — sliders segmentados de Humor (âmbar) e Empatia (gelo); arrastar/teclas ajustam e persistem via `PUT /settings`, com quip dinâmico estilo TARS.
- **Canal de Conversa** — chat com o Jarvis (`POST /chat`), animação de ondas sonoras enquanto processa, badges de ferramentas usadas.
- **Lembretes** — CRUD completo (criar, concluir, remover) com animação de lista.
- **Agenda** — status do Google Calendar; botão de conectar quando configurado, eventos do dia quando conectado.

### Detalhes de robustez
- Reveals de entrada em **CSS** (resistentes a falha de JS) + `prefers-reduced-motion` respeitado; foco de teclado visível.
- Cliente de API tipado em `web/lib/api.ts`; base configurável via `NEXT_PUBLIC_API_URL`.

### Rodar o painel
```bash
cd web
npm install
npm run dev
# → http://localhost:3000  (backend precisa estar rodando em http://localhost:3333)
```

> ⚙️ **Notas de dev (aprendidas na Fase 4):**
> - O backend usa `127.0.0.1` como base (evita ambiguidade IPv6 do `localhost`).
> - CORS habilita `PUT`/`DELETE` (necessário para editar settings e remover lembretes pelo navegador).
> - `allowedDevOrigins` no `next.config.ts` libera `localhost` e `127.0.0.1` em dev.

---

## ✅ Fase 5 — O que foi entregue

App **React Native (Expo SDK 57)** no diretório `/mobile`, com a mesma identidade visual do web.

### Interface
- **Tela única fluida** com botão central **Push-to-Talk** (segure para gravar, solte para enviar).
- **Anel pulsante** durante a gravação e **ondas sonoras animadas** (API `Animated` nativa) enquanto grava/processa.
- Header com telemetria: status do backend + leitura HUM/EMP (lida ao vivo de `/settings`).
- Cartões de transcrição (você) e resposta (Jarvis).

### Áudio e integração
- Gravação via **`expo-audio`** (`useAudioRecorder`) com permissão de microfone declarada em `app.json` (iOS + Android).
- Envia o áudio para `POST /chat/voice` (multipart) → transcrição + resposta com a personalidade correta.
- URL do backend em `src/config.ts` — use o **IP LAN** da máquina ou a **URL do túnel** (Cloudflare/Tailscale) para dispositivo físico.

### Build do `.apk` (EAS)
- `eas.json` com perfil **preview** gerando `.apk` (`buildType: apk`) e **production** gerando `.aab`.
- Scripts: `npm run build:apk` (preview/APK) e `npm run build:aab` (produção/bundle).

### Rodar / gerar o APK
```bash
cd mobile
npm install
npm start          # abre o Expo — leia o QR code com o app Expo Go
# ou, para gerar o instalável Android:
npx eas login      # (interativo) precisa de conta Expo — https://expo.dev
npm run build:apk  # eas build -p android --profile preview → gera o .apk na nuvem
```

> ⚠️ **O build do `.apk` roda na nuvem do EAS e exige login na sua conta Expo** (passo interativo). Todo o app e a configuração (`eas.json`, permissões, scripts) já estão prontos — basta você autenticar e disparar o build. Validado localmente com `expo-doctor` (20/20) e bundle Android (Metro).

---

## 🚀 Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Criar o .env a partir do exemplo
cp .env.example .env

# 3. Aplicar migração e gerar o Prisma Client
npx prisma migrate dev

# 4. (opcional) Popular dados de exemplo
npm run db:seed

# 5. Subir o backend em modo dev
npm run dev
# → http://localhost:3333
```

### Scripts úteis

| Script                  | Ação                                  |
| ----------------------- | ------------------------------------- |
| `npm run dev`           | Servidor com hot-reload               |
| `npm run build`         | Compila TypeScript → `dist/`          |
| `npm run start`         | Roda a build de produção              |
| `npm run lint`          | ESLint                                |
| `npm run format`        | Prettier                              |
| `npm run prisma:studio` | Interface visual do banco             |
| `npm run db:seed`       | Popula dados de exemplo               |

---

## 🔒 Regra de Ouro (Segurança)

Nenhum dado sensível ou credencial é versionado. O `.gitignore` protege `.env`, `credentials.json`, `token.json`, `*.pem` e os bancos `*.db` desde o primeiro commit. Use sempre o `.env.example` como referência.

## 📁 Estrutura

```
Meu Jarvis/
├── prisma/
│   ├── schema.prisma        # Models
│   ├── seed.ts              # Dados de exemplo
│   └── migrations/          # Histórico de migrações
├── src/
│   ├── config/env.ts        # Validação de variáveis de ambiente (Zod)
│   ├── lib/
│   │   ├── prisma.ts        # Prisma Client (singleton)
│   │   └── ensureUser.ts    # Usuário padrão (MVP mono-usuário)
│   ├── routes/
│   │   ├── settings.routes.ts
│   │   └── reminders.routes.ts
│   ├── app.ts               # Instância Fastify + registro de plugins/rotas
│   └── server.ts            # Bootstrap do servidor
├── .env.example
├── eslint.config.js
└── tsconfig.json
```
