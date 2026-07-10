/**
 * Normaliza texto para a fala (TTS): converte horários escritos em dígitos
 * ("13:00", "13h", "13h30") para a forma falada natural ("treze horas",
 * "treze e trinta"), evitando que o Piper leia "treze zero zero".
 *
 * Aplicado apenas ao texto enviado ao TTS — o texto exibido no chat é preservado.
 */

const unidades = [
  'zero',
  'um',
  'dois',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
];
const especiais = [
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
];
const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta'];

function numeroExtenso(n: number): string {
  if (n < 10) return unidades[n];
  if (n < 20) return especiais[n - 10];
  const d = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? dezenas[d] : `${dezenas[d]} e ${unidades[u]}`;
}

function horaExtenso(h: number): string {
  if (h === 1) return 'uma';
  if (h === 2) return 'duas';
  return numeroExtenso(h);
}

function tempoExtenso(h: number, m: number): string {
  if (m === 0) {
    if (h === 0) return 'meia-noite';
    if (h === 12) return 'meio-dia';
    return `${horaExtenso(h)} ${h === 1 ? 'hora' : 'horas'}`;
  }
  return `${horaExtenso(h)} e ${numeroExtenso(m)}`;
}

export function toSpeakableText(text: string): string {
  // "13:00" (dois pontos exige 2 dígitos) ou "13h" / "13h30".
  return text.replace(/\b(\d{1,2})(?::(\d{2})|h(\d{2})?)\b/gi, (match, hh, mmColon, mmH) => {
    const h = Number(hh);
    const m = mmColon != null ? Number(mmColon) : mmH != null ? Number(mmH) : 0;
    if (h > 23 || m > 59) return match; // não é um horário válido
    return tempoExtenso(h, m);
  });
}
