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

**Escolha do modelo LLM.** Histórico:
- `dolphin3` testado: personalidade OK, mas **NÃO suporta tools** ("does not support tools") e o usuário achou que **ainda tem censura**. Descartado para o objetivo.
- Objetivo do usuário: **sem censura TOTAL**. Decisão: usar modelo **abliterated**.
- **Baixando agora:** `mannix/llama3.1-8b-abliterated:tools-q4_k_m` (abliterated = remove recusa nos pesos; a tag `tools-` mantém function calling). Log: `scratchpad/pull2.log`.
- **Checar se terminou:** `curl -s http://127.0.0.1:11434/api/tags | grep abliterated`.

### Assim que o download terminar:
1. Apontar o backend para ele:
   ```bash
   curl -X PUT http://localhost:3333/settings -H "Content-Type: application/json" \
     -d '{"llmModel":"mannix/llama3.1-8b-abliterated:tools-q4_k_m"}'
   ```
2. **Teste personalidade + sem censura:** `POST /chat` com uma pergunta que o dolphin recusaria — confirmar que responde sem freios.
3. **Teste tools:** `POST http://localhost:11434/api/chat` com `model` = a tag acima, um pedido de agendamento e o array `tools` (ver exemplo no histórico do chat / código em src/services/google/tools.ts). Se vier `tool_calls` → agenda por voz funciona também. 🎯
4. Se decepcionar, alternativas: `mannix/llama3.1-8b-abliterated:tools-q6_k` (mais fiel) ou `huihui_ai/dolphin3-abliterated`.

Fontes sobre abliterated: ollama.com/mannix/llama3.1-8b-abliterated , locallyuncensored.com/blog/abliterated-models-guide.html

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
