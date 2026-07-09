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

---

## 5. Master Prompt para o Claude Code
Copie o prompt abaixo e cole no Claude Code para iniciar o desenvolvimento passo a passo:

> Atue como um Engenheiro de Software Sênior e Especialista em UI/UX. Vamos construir um Assistente Pessoal de Voz full-stack, local e open-source para meu portfólio. 
> 
> **Regra de Ouro:** NENHUM dado sensível ou credencial (como chaves da API do Google) deve ser "hardcoded" ou versionado. 
> 
> Siga as fases abaixo sequencialmente, documentando o progresso em um `README.md` detalhado. Pause e aguarde minha validação ao final de cada fase.
> 
> **Fase 1: Setup do Backend e Banco de Dados**
> 1. Inicialize um projeto Node.js com TypeScript. Configure Eslint e Prettier.
> 2. Configure o SQLite com Prisma ORM. 
> 3. Crie os seguintes Models: `User`, `Reminders`, `ChatHistory` e `Settings` (esta tabela guardará as variáveis de "Personalidade": `humor_level` e `empathy_level` de 0 a 100, estilo robôs de *Interestelar*).
> 4. Crie rotas CRUD básicas para configurações e lembretes.
> 
> **Fase 2: Motor de Inteligência e Áudio**
> 1. Integre o Ollama (porta 11434). Crie um gerenciador de *System Prompt* que altere o tom da resposta com base nos parâmetros de personalidade do banco de dados.
> 2. Crie stubs de integração local para Whisper (STT) e Piper TTS.
> 3. Crie uma rota POST `/chat/voice` que receba áudio, transcreva, passe pelo LLM (com a personalidade correta) e retorne a resposta em áudio.
> 
> **Fase 3: Integração Google Calendar**
> 1. Configure o fluxo de autenticação OAuth2 para o Google Calendar API.
> 2. Adicione *Function Calling* ao LLM para que ele consiga ler eventos do dia e agendar novos compromissos quando o usuário pedir na conversa.
> 
> **Fase 4: Frontend Web (Next.js - UI/UX Premium)**
> 1. Em um diretório `/web`, crie um app Next.js com TailwindCSS.
> 2. Crie um painel bonito e minimalista para visualizar o histórico, editar os lembretes, a agenda do Google e ajustar os sliders de "Humor" e "Empatia".
> 
> **Fase 5: Frontend Mobile (React Native / Expo)**
> 1. Em um diretório `/mobile`, inicie um app Expo.
> 2. Desenvolva uma interface fluida com um botão central (Push-to-Talk) e animações de ondas sonoras quando o assistente estiver falando.
> 3. Crie um script no `package.json` utilizando o EAS Build (`eas build -p android --profile preview`) para gerar o arquivo `.apk` final.
> 
> Inicie pela Fase 1 agora, crie os arquivos básicos e me mostre o que foi feito.