# Plano Diretor: Assistente Pessoal Inteligente (Open-Source)

## 1. Visão Geral do Projeto
Um assistente de voz pessoal, 100% hospedado localmente (com suporte a acesso remoto), focado em privacidade, gestão de tarefas e integração de calendário. Inspirado nos robôs de *Interestelar* (TARS/CASE), o assistente terá parâmetros ajustáveis de humor e empatia.

## 2. Stack Tecnológico
* **Backend & Orquestração:** Node.js (TypeScript) com Fastify ou Express.
* **Inteligência Artificial (Cérebro):** Ollama rodando LLM local (Llama 3.1 8B ou Qwen 2.5 7B).
* **Processamento de Voz:** Whisper.cpp (STT) e Piper TTS ou Coqui TTS (Voz).
* **Banco de Dados:** SQLite (com Prisma ORM).
* **Frontend Web (Painel de Controle):** Next.js com TailwindCSS e Framer Motion (foco em UI/UX premium).
* **Frontend Mobile (App):** React Native via Expo (NativeWind para UI, permissões de microfone e build do `.apk` via EAS Build).
* **Acesso Remoto Seguro:** Cloudflare Tunnels (gratuito) ou Tailscale.

## 3. Novas Funcionalidades e Integrações
* **Matriz de Personalidade:** O backend armazenará no banco de dados os parâmetros de personalidade do assistente (ex: Empatia 0-100%, Sarcasmo/Humor 0-100%). Esses valores alterarão dinamicamente o *System Prompt* injetado no Ollama a cada requisição.
* **Google Calendar:** Integração via Google APIs (OAuth2) para ler a agenda diária e adicionar novos compromissos via comandos de voz (usando *Function Calling* no LLM).
* **App Android (.apk):** O projeto Expo será configurado para gerar um executável Android para uso remoto, conectando-se ao túnel do backend.

---

## 4. Arquivo `.gitignore` Inicial
Proteção de dados e credenciais (como o `credentials.json` do Google) desde o primeiro commit.

```text
# Dependências
node_modules/
.pnp
.pnp.js

# Variáveis de Ambiente e Dados Sensíveis
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
*.pem
credentials.json
client_secret.json
token.json

# Bancos de dados locais e Áudios temporários
*.sqlite
*.db
*.db-journal
/temp_audio/
/uploads/

# Build e Logs
dist/
build/
.expo/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```
