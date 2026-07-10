# 🤖 Meu Jarvis — Assistente de Voz com IA Local

[English](./README.md) · **Português 🇧🇷**

Um **assistente pessoal de voz 100% local e focado em privacidade**, com
personalidade ajustável, base de conhecimento com busca semântica (RAG),
integração com o Google Calendar, painel web e app Android. Inspirado nos robôs
**TARS/CASE** de *Interestelar* — incluindo os ajustes de "humor" e "honestidade".

Tudo roda na sua própria máquina: o modelo de linguagem (via [Ollama](https://ollama.com)),
a transcrição ([Whisper.cpp](https://github.com/ggml-org/whisper.cpp)) e a voz
([Piper](https://github.com/rhasspy/piper)). Nada é enviado para uma nuvem de
terceiros, a menos que você ative explicitamente o Google Calendar.

> ⚠️ Projeto pessoal/portfólio. Nenhuma credencial ou dado pessoal é versionado —
> veja [Privacidade & Segurança](#-privacidade--segurança).

## ✨ Funcionalidades

- **🎛️ Matriz de Personalidade** — seis sliders de 0 a 100 (Humor, Empatia,
  Cautela, Objetividade, Formalidade, Proatividade) que reescrevem dinamicamente
  o *system prompt* do LLM a cada requisição. Direto, caloroso, sarcástico,
  conciso… você decide.
- **🗣️ Voz na entrada e na saída** — você fala (push-to-talk) e ele responde
  falando, tudo local: o Whisper transcreve, o LLM responde com a persona
  escolhida, o Piper sintetiza a voz.
- **🧠 Cérebro sem censura e esteirável** — roda qualquer modelo do Ollama; vem
  configurado para um Llama 3.1 8B *abliterated* que segue bem o *system prompt*.
  Ele sabe a data/hora atuais e admite com honestidade que não tem acesso à
  internet nem a dados em tempo real.
- **📅 Google Calendar (function calling)** — "agende almoço sábado ao meio-dia"
  realmente cria o evento, com tratamento de data confiável (dias da semana,
  "dia N", meses por nome).
- **📚 Base de Conhecimento (RAG)** — coloque seus documentos (`.txt`, `.md`,
  `.pdf`, `.docx`, `.csv`, `.xlsx`, com subpastas) e ele responde a partir deles
  com busca semântica (embeddings do Ollama), citando a fonte.
- **✅ Lembretes** — CRUD local simples de tarefas.
- **🖥️ Painel web premium** — UI "cockpit" em Next.js para conversar (texto ou
  microfone), ajustar a personalidade, gerenciar lembretes, ver a agenda e
  enviar documentos por arrastar-e-soltar.
- **📱 App Android** — React Native (Expo) com tela fluida de push-to-talk;
  gera `.apk` via EAS.
- **🌐 Acesso remoto** — exponha o backend com um Cloudflare Tunnel para o app
  mobile funcionar de qualquer lugar.

## 🧱 Stack Tecnológico

| Camada | Tecnologia |
| --- | --- |
| Backend | Node.js + TypeScript + **Fastify** |
| Banco de dados | **SQLite** + **Prisma** |
| LLM / Embeddings | **Ollama** (modelo de chat + `nomic-embed-text`) |
| Transcrição (STT) | **Whisper.cpp** (+ ffmpeg) |
| Voz (TTS) | **Piper** |
| Web | **Next.js 16** + React 19 + Tailwind v4 + Framer Motion |
| Mobile | **React Native (Expo SDK 57)** + `expo-audio` |
| Acesso remoto | **Cloudflare Tunnel** |

## 🏗️ Arquitetura

```
                 ┌───────────────┐        ┌───────────────┐
  Web (Next.js)  │               │        │  Ollama       │  (LLM + embeddings)
  Mobile (Expo) ─┤   Backend     ├────────┤  Whisper.cpp  │  (STT)
  via Cloudflare │  (Fastify)    │        │  Piper        │  (TTS)
  Tunnel        ─┤               ├────┐   └───────────────┘
                 └──────┬────────┘    │
                        │             └── Google Calendar API (OAuth2)
              ┌─────────┴─────────┐
              │ SQLite (Prisma)   │  settings · lembretes · chat · conhecimento
              │ pasta knowledge/  │  seus documentos (fonte do RAG)
              └───────────────────┘
```

Os **parâmetros de personalidade** ficam no banco e são injetados no *system
prompt* a cada requisição. Para cada mensagem o backend: (1) recupera trechos
relevantes da base de conhecimento (RAG), (2) oferece as ferramentas de
calendário só quando a mensagem é sobre agenda, (3) chama o LLM local, (4)
executa as chamadas de ferramenta e (5) sintetiza a voz com o Piper.

## 📁 Estrutura do Projeto

```
├── src/                    # Backend (Fastify)
│   ├── routes/             # settings, reminders, chat, google, knowledge
│   ├── services/
│   │   ├── ollama.ts       # cliente de chat do LLM (+ loop de tool-calls)
│   │   ├── personality.ts  # matriz de personalidade → system prompt
│   │   ├── stt.ts, tts.ts  # Whisper / Piper (via child_process)
│   │   ├── google/         # OAuth2 + Calendar + tools de function calling
│   │   └── knowledge/      # RAG: parse, embed, store, search
│   └── server.ts
├── prisma/                 # schema + migrations
├── web/                    # painel Next.js
├── mobile/                 # app Expo (push-to-talk, build EAS)
└── knowledge/              # seus documentos (RAG) — ignorado no git, exceto README
```

## 🚀 Como Rodar

### Pré-requisitos
- **Node.js 20+**
- **[Ollama](https://ollama.com)** rodando localmente
- (opcional, para voz real) **ffmpeg**, **Whisper.cpp**, **Piper**

### 1. Backend
```bash
cp .env.example .env          # ajuste os caminhos se necessário
npm install
npx prisma migrate dev        # cria o banco SQLite
npm run dev                   # http://localhost:3333
```

### 2. Baixe os modelos
```bash
ollama pull mannix/llama3.1-8b-abliterated:tools-q4_k_m   # chat (ou outro modelo)
ollama pull nomic-embed-text                              # embeddings (RAG)
```
Você troca o modelo de chat a qualquer momento com `PUT /settings { "llmModel": "..." }`.

### 3. Painel web
```bash
cd web && npm install && npm run dev   # http://localhost:3000
```

### 4. App mobile (opcional)
```bash
cd mobile && npm install
# defina a URL do backend em src/config.ts (IP da rede local ou URL do túnel)
npm start                # abra com o Expo Go
npm run build:apk        # eas build -p android --profile preview
```

## 🎙️ Voz Real (Whisper + Piper)

Opcional — sem isso, o STT/TTS rodam em modo simulado. No Windows:
1. `winget install Gyan.FFmpeg`
2. Baixe um build do Whisper ([releases do whisper.cpp](https://github.com/ggml-org/whisper.cpp/releases))
   + um modelo (`ggml-medium.bin` recomendado para precisão em PT-BR).
3. Baixe o [Piper](https://github.com/rhasspy/piper/releases) + uma voz
   (ex.: `pt_BR-faber-medium`).
4. Aponte `WHISPER_BIN`, `WHISPER_MODEL`, `PIPER_BIN`, `PIPER_MODEL`, `FFMPEG_BIN`
   no `.env` para esses arquivos.
5. Verifique `GET /chat/status` → `sttReal: true`, `ttsReal: true`.

## 📅 Google Calendar

1. No [Google Cloud Console](https://console.cloud.google.com): crie um projeto,
   ative a **Calendar API**, configure a tela de consentimento OAuth (adicione-se
   como usuário de teste) e crie um **Cliente OAuth (Web)** com o redirect
   `http://localhost:3333/auth/google/callback`.
2. Coloque `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` no `.env`.
3. Abra `http://localhost:3333/auth/google` e autorize.

## 📚 Base de Conhecimento (RAG)

Coloque documentos em `knowledge/` (subpastas são bem-vindas) e clique em
**Reindexar** no painel, ou chame `POST /knowledge/reindex`. Formatos: `.txt`,
`.md`, `.pdf`, `.docx`, `.csv`, `.xlsx`. O assistente responde a partir deles e
cita a fonte. Você também pode enviar arquivos direto do painel (arrastar-e-soltar).

## 🌐 Acesso Remoto

```bash
npm run tunnel   # cloudflared tunnel --url http://localhost:3333
```
Aponte o app mobile (`mobile/src/config.ts`) para a URL `*.trycloudflare.com`
gerada.

## 🔌 Visão Geral da API

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health`, `/chat/status` | Status do serviço e do cérebro/voz |
| GET/PUT | `/settings` | Ler / atualizar a matriz de personalidade |
| GET/POST/PUT/DELETE | `/reminders` | CRUD de lembretes |
| POST | `/chat`, `/chat/voice` | Conversa por texto / por áudio |
| DELETE | `/chat/history` | Reseta o contexto da conversa |
| GET | `/auth/google`, `/auth/google/status` | OAuth2 do Calendar |
| GET/POST/DELETE | `/calendar/*` | Listar / criar / remover eventos |
| GET/POST | `/knowledge/status`, `/knowledge/reindex`, `/knowledge/upload` | Base de conhecimento |

## 🔒 Privacidade & Segurança

- Roda localmente; o LLM, o STT e o TTS nunca saem da sua máquina.
- Segredos e dados pessoais **nunca são versionados**: `.env`, `token.json`,
  `credentials.json`, `*.db` e os documentos de `knowledge/` estão todos no
  `.gitignore`.
- A integração com o Google é opcional; os tokens ficam locais em `token.json`.

## 📄 Licença

[MIT](./LICENSE)
