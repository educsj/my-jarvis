/**
 * URL do backend do Jarvis.
 *
 * Em um dispositivo físico (ou Expo Go), `localhost` aponta para o PRÓPRIO
 * celular — não para o seu PC. Use um destes:
 *   - URL do túnel Cloudflare (acesso de qualquer lugar, inclusive 4G) — em uso abaixo.
 *   - IP da máquina na rede local (Wi-Fi), ex.: http://172.20.156.52:3333 (só na mesma rede).
 *
 * ATENÇÃO: o Cloudflare "quick tunnel" gera uma URL NOVA a cada `npm run tunnel`.
 * Se reiniciar o túnel, atualize esta constante com a nova URL.
 */
export const API_URL = 'https://SEU-TUNEL.trycloudflare.com';

// Alternativa para testes na mesma rede Wi-Fi (sem túnel):
// export const API_URL = 'http://192.168.0.10:3333';
