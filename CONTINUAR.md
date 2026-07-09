# 📌 Guia de Continuação — Meu Jarvis

Documento de retomada (handoff). Atualizado em **2026-07-09**.

## ✅ Estado geral — TODAS as 5 fases concluídas + extras

| Item | Status |
|---|---|
| Fase 1 — Backend Fastify + SQLite/Prisma + CRUD | ✅ |
| Fase 2 — Ollama + Matriz de Personalidade + STT/TTS + `/chat/voice` | ✅ |
| Fase 3 — Google Calendar OAuth2 + Function Calling | ✅ (código pronto; falta credenciais Google) |
| Fase 4 — Painel Web (Next.js) | ✅ |
| Fase 5 — App Mobile (Expo) + Push-to-Talk + EAS/APK | ✅ (código pronto; falta você rodar `eas build`) |
| Extra 1 — Acesso remoto (Cloudflare Tunnel) | ✅ funcionando |
| Extra 2 — Git (repo + commits) | ✅ 3 commits |
| Extra 3 — Whisper + Piper (voz real) | ✅ instalado e validado ponta a ponta |

Git: 3 commits em `main` (último `af44ed8`). Backend na raiz, `web/` e `mobile/` são subprojetos.

## 🔄 TAREFA EM ANDAMENTO (retomar aqui)

**Baixando o modelo `dolphin3`** (LLM sem censura, base Llama 3.1 8B, ~4.9GB) via API do Ollama.
- Comando: `curl -s http://127.0.0.1:11434/api/pull -d '{"name":"dolphin3"}'` (rodou em background).
- Log do progresso: `scratchpad/pull.log`.
- **Como checar se terminou:** `curl -s http://127.0.0.1:11434/api/tags | grep dolphin3` → se aparecer, está pronto.

### Assim que o download terminar, fazer os 2 testes prometidos:
1. **Personalidade (humor 90 / empatia 40):**
   ```bash
   curl -s -X POST http://127.0.0.1:3333/chat -H "Content-Type: application/json" \
     -d '{"message":"Bom dia, Jarvis. Como estou hoje?"}'
   ```
   Esperado: resposta com tom sarcástico/bem-humorado (dolphin3 segue o system prompt sem censura).

2. **Capacidade de function calling (isolado, sem depender do Google):**
   Chamar o Ollama direto com as tools do Calendar e um pedido de agendamento, e ver se retorna `message.tool_calls`:
   ```bash
   curl -s http://127.0.0.1:11434/api/chat -d '{
     "model":"dolphin3","stream":false,
     "messages":[{"role":"user","content":"Agende uma reunião amanhã às 14h chamada Dentista"}],
     "tools":[{"type":"function","function":{"name":"create_calendar_event",
       "description":"Agenda um compromisso","parameters":{"type":"object",
       "properties":{"summary":{"type":"string"},"startDateTime":{"type":"string"}},
       "required":["summary","startDateTime"]}}}]
   }'
   ```
   Se vier `tool_calls` → a agenda por voz vai funcionar com o dolphin3.
   Se **não** vier → cair para `hermes3` (bom em tools) ou um modelo abliterated. Trocar é fácil (ver abaixo).

## ⚙️ Configuração de modelo (já aplicada)
- O chat usa `settings.llmModel` do **banco** (fonte da verdade, coerente com o chip da UI), com fallback a `OLLAMA_MODEL` do `.env`.
- Banco já está com `llmModel = "dolphin3"` (via `PUT /settings`).
- `.env` e defaults do código também apontam para `dolphin3`.
- **Para trocar de modelo depois:** `curl -X PUT http://localhost:3333/settings -H "Content-Type: application/json" -d '{"llmModel":"NOME_DO_MODELO"}'` (e `ollama pull NOME` antes).

## 🖥️ O que está rodando (pode ter caído se a máquina reiniciou)
| Serviço | Como subir | Verificar |
|---|---|---|
| Backend (porta 3333) | `npm run dev` (na raiz) | `curl http://localhost:3333/health` |
| Painel Web (porta 3000) | `cd web && npm run dev` | abrir http://localhost:3000 |
| Túnel Cloudflare | `npm run tunnel` (na raiz) | gera URL `*.trycloudflare.com` |
| Ollama | já roda como serviço | `curl http://localhost:11434/api/tags` |

⚠️ **Túnel:** o quick tunnel gera **URL nova a cada `npm run tunnel`**. A URL atual está em `mobile/src/config.ts` (`API_URL`). Se reiniciar o túnel, atualize essa constante.

⚠️ **Reiniciar o backend sem derrubar o túnel:** o backend usa `tsx watch`. Basta salvar/`touch` um arquivo em `src/` que ele reinicia e relê o `.env` (não precisa matar processos — evita matar o `npm run tunnel` do usuário).

## 🎙️ Voz real (Whisper + Piper) — JÁ CONFIGURADA
Instalada em `C:\jarvis-voice\` e validada ponta a ponta (`/chat/voice` → `transcriptionReal:true`, `audioReal:true`). Caminhos no `.env`:
```
FFMPEG_BIN=".../Gyan.FFmpeg.../ffmpeg.exe"   (winget)
WHISPER_BIN="C:\jarvis-voice\whisper\whisper-cli.exe"
WHISPER_MODEL="C:\jarvis-voice\whisper\ggml-small.bin"
PIPER_BIN="C:\jarvis-voice\piper\piper\piper.exe"
PIPER_MODEL="C:\jarvis-voice\piper\pt_BR-faber-medium.onnx"
```
Status via `curl http://localhost:3333/chat/status` → deve mostrar `sttReal:true, ttsReal:true`.

## 📋 Ações pendentes DO USUÁRIO (nenhuma bloqueia o código)
1. **Modelo Ollama:** o `dolphin3` está baixando (ver acima). Sem ele, o chat responde "[Cérebro offline]".
2. **Google Calendar:** criar credenciais OAuth no Google Cloud e preencher `GOOGLE_CLIENT_ID`/`SECRET` no `.env` (passo a passo no `README.md`, seção 🔑). Sem isso, as tools do Calendar não são oferecidas ao LLM.
3. **Gerar o `.apk`:** `cd mobile && npx eas login && npm run build:apk` (roda na nuvem do Expo — login interativo).
4. *(opcional)* Túnel fixo (Cloudflare com conta+domínio) em vez do quick tunnel efêmero.

## 🗂️ Onde está cada coisa
- Backend: `src/` (rotas em `src/routes`, serviços em `src/services`, voz em `src/services/stt.ts`, `tts.ts`, `voice/proc.ts`, Google em `src/services/google/`).
- Web: `web/` (componentes em `web/components/`, cliente API em `web/lib/api.ts`).
- Mobile: `mobile/` (tela em `mobile/App.tsx`, config da URL em `mobile/src/config.ts`, build em `mobile/eas.json`).
- Plano original: `Ponto de Início.md`. Progresso detalhado: `README.md`.
- Arquivos temporários de teste/screenshots: pasta `scratchpad` da sessão (fora do projeto).
