# 🤖 Meu Jarvis — Local Voice AI Assistant

**English** · [Português 🇧🇷](./README.pt-BR.md)

A **100% local, privacy-first personal voice assistant** with an adjustable
personality, a Retrieval-Augmented knowledge base, Google Calendar integration,
a web dashboard, and an Android app. Inspired by the robots **TARS/CASE** from
*Interstellar* — including their tunable "humor" and "honesty" dials.

Everything runs on your own machine: the language model (via [Ollama](https://ollama.com)),
speech-to-text ([Whisper.cpp](https://github.com/ggml-org/whisper.cpp)), and
text-to-speech ([Piper](https://github.com/rhasspy/piper)). Nothing is sent to a
third-party cloud unless you explicitly enable Google Calendar.

> ⚠️ Personal/portfolio project. No credentials or personal data are committed —
> see [Privacy & Security](#-privacy--security).

## ✨ Features

- **🎛️ Personality Matrix** — six 0–100 sliders (Humor, Empathy, Caution,
  Objectivity, Formality, Proactivity) that dynamically rewrite the LLM's system
  prompt on every request. Set it blunt, warm, sarcastic, concise… your call.
- **🗣️ Voice in & out** — talk to it (push-to-talk) and it talks back, all local:
  Whisper transcribes, the LLM answers with the chosen persona, Piper speaks.
- **🧠 Uncensored, steerable brain** — runs any Ollama model; ships configured for
  an abliterated Llama 3.1 8B that follows the system prompt closely. It knows the
  current date/time and honestly admits it has no internet/real-time data.
- **⌨️ Coding mode (auto-routing)** — programming questions are automatically
  routed to a code-specialized model (`qwen2.5-coder`), while everything else
  keeps the uncensored personality model.
- **📅 Google Calendar (function calling)** — "schedule lunch next Saturday at
  noon" actually creates the event, with reliable date handling (weekdays,
  "day N", named months).
- **📚 Knowledge Base (RAG)** — drop your documents (`.txt`, `.md`, `.pdf`,
  `.docx`, `.csv`, `.xlsx`, subfolders supported) and it answers from them with
  semantic search (Ollama embeddings), citing the source.
- **✅ Reminders** — simple local to-do CRUD.
- **🖥️ Premium web dashboard** — Next.js "cockpit" UI to chat (text or mic),
  tune the personality, manage reminders, see your agenda, and upload knowledge
  files by drag-and-drop.
- **📱 Android app** — React Native (Expo) with a fluid push-to-talk screen;
  build an `.apk` via EAS.
- **⚙️ Settings panel** — one discreet drawer to switch the UI language (PT/EN),
  pick a theme (extensible), choose the assistant's voice (Piper voices listed
  per language), and browse the audit log.
- **🔐 Privacy controls** — chat history is saved by default, but a one-click
  **private mode** keeps a conversation ephemeral; you can also **save a
  conversation into the knowledge base** (any subfolder) so it teaches the
  assistant, and every interaction is written to a local **audit log** for
  debugging.
- **🌐 Remote access** — expose the backend with a Cloudflare Tunnel so the mobile
  app works from anywhere.

## 🧱 Tech Stack

| Layer | Tech |
| --- | --- |
| Backend | Node.js + TypeScript + **Fastify** |
| Database | **SQLite** + **Prisma** |
| LLM / Embeddings | **Ollama** (chat model + `nomic-embed-text`) |
| Speech-to-Text | **Whisper.cpp** (+ ffmpeg) |
| Text-to-Speech | **Piper** |
| Web | **Next.js 16** + React 19 + Tailwind v4 + Framer Motion |
| Mobile | **React Native (Expo SDK 57)** + `expo-audio` |
| Remote access | **Cloudflare Tunnel** |

## 🏗️ Architecture

```
                 ┌───────────────┐        ┌───────────────┐
  Web (Next.js)  │               │        │  Ollama       │  (LLM + embeddings)
  Mobile (Expo) ─┤   Backend     ├────────┤  Whisper.cpp  │  (STT)
  via Cloudflare │  (Fastify)    │        │  Piper        │  (TTS)
  Tunnel        ─┤               ├────┐   └───────────────┘
                 └──────┬────────┘    │
                        │             └── Google Calendar API (OAuth2)
              ┌─────────┴─────────┐
              │ SQLite (Prisma)   │  settings · reminders · chat · knowledge
              │ knowledge/ folder │  your documents (RAG source)
              └───────────────────┘
```

The **personality parameters** live in the DB and are injected into the system
prompt per request. For each chat message the backend: (1) retrieves relevant
knowledge chunks (RAG), (2) offers Calendar tools only when the message is about
scheduling, (3) calls the local LLM, (4) runs any tool calls, and (5) synthesizes
speech with Piper.

## 📁 Project Structure

```
├── src/                    # Backend (Fastify)
│   ├── routes/             # settings, reminders, chat, google, knowledge
│   ├── services/
│   │   ├── ollama.ts       # LLM chat client (+ tool-call loop)
│   │   ├── personality.ts  # personality matrix → system prompt
│   │   ├── stt.ts, tts.ts  # Whisper / Piper (via child_process)
│   │   ├── google/         # OAuth2 + Calendar + function-calling tools
│   │   └── knowledge/      # RAG: parse, embed, store, search
│   └── server.ts
├── prisma/                 # schema + migrations
├── web/                    # Next.js dashboard
├── mobile/                 # Expo app (push-to-talk, EAS build)
└── knowledge/              # your documents (RAG) — git-ignored except README
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 20+**
- **[Ollama](https://ollama.com)** running locally
- (optional, for real voice) **ffmpeg**, **Whisper.cpp**, **Piper**

### 1. Backend
```bash
cp .env.example .env          # adjust paths if needed
npm install
npx prisma migrate dev        # create the SQLite DB
npm run dev                   # http://localhost:3333
```

### 2. Pull the models
```bash
ollama pull mannix/llama3.1-8b-abliterated:tools-q4_k_m   # chat (or any model)
ollama pull nomic-embed-text                              # embeddings (RAG)
```
You can switch the chat model anytime via `PUT /settings { "llmModel": "..." }`.

### 3. Web dashboard
```bash
cd web && npm install && npm run dev   # http://localhost:3000
```

### 4. Mobile app (optional)
```bash
cd mobile && npm install
# set the backend URL in src/config.ts (LAN IP or tunnel URL)
npm start                # open with Expo Go
npm run build:apk        # eas build -p android --profile preview
```

## 🎙️ Real Voice (Whisper + Piper)

Optional — without it, STT/TTS run in a simulated stub mode. On Windows:
1. `winget install Gyan.FFmpeg`
2. Download a Whisper build ([whisper.cpp releases](https://github.com/ggml-org/whisper.cpp/releases))
   + a model (`ggml-medium.bin` recommended for PT-BR accuracy).
3. Download [Piper](https://github.com/rhasspy/piper/releases) + a voice
   (e.g., `pt_BR-faber-medium`).
4. Point `WHISPER_BIN`, `WHISPER_MODEL`, `PIPER_BIN`, `PIPER_MODEL`, `FFMPEG_BIN`
   in `.env` to those files.
5. Check `GET /chat/status` → `sttReal: true`, `ttsReal: true`.

## 📅 Google Calendar

1. In the [Google Cloud Console](https://console.cloud.google.com): create a
   project, enable the **Calendar API**, configure the OAuth consent screen
   (add yourself as a test user), and create an **OAuth Client (Web)** with
   redirect URI `http://localhost:3333/auth/google/callback`.
2. Put the `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env`.
3. Open `http://localhost:3333/auth/google` and authorize.

## 📚 Knowledge Base (RAG)

Put documents in `knowledge/` (subfolders welcome), then **Reindex** from the
dashboard or `POST /knowledge/reindex`. Supported: `.txt`, `.md`, `.pdf`,
`.docx`, `.csv`, `.xlsx`. The assistant answers from them and cites the source.
You can also upload files directly from the dashboard (drag & drop).

## 🌐 Remote Access

```bash
npm run tunnel   # cloudflared tunnel --url http://localhost:3333
```
Point the mobile app (`mobile/src/config.ts`) to the generated
`*.trycloudflare.com` URL.

## 🔌 API Overview

| Method | Route | Description |
| --- | --- | --- |
| GET | `/health`, `/chat/status` | Service & brain/voice status |
| GET/PUT | `/settings` | Read / update the personality matrix |
| GET/POST/PUT/DELETE | `/reminders` | Reminders CRUD |
| POST | `/chat`, `/chat/voice` | Chat by text / by audio (`saveHistory: false` for private mode) |
| DELETE | `/chat/history` | Reset conversation context |
| GET | `/logs` | Audit log of interactions/errors |
| GET | `/auth/google`, `/auth/google/status` | Calendar OAuth2 |
| GET/POST/DELETE | `/calendar/*` | List / create / delete events |
| GET/POST | `/knowledge/status`, `/knowledge/reindex`, `/knowledge/upload`, `/knowledge/save-conversation` | Knowledge base |

## 🔒 Privacy & Security

- Runs locally; the LLM, STT and TTS never leave your machine.
- Secrets and personal data are **never committed**: `.env`, `token.json`,
  `credentials.json`, `*.db`, and your `knowledge/` documents are all git-ignored.
- Google integration is opt-in; tokens are stored locally in `token.json`.

## 📄 License

[MIT](./LICENSE)
