/**
 * TTS con voz más humana: preferencia por voz masculina española,
 * velocidad y tono naturales. Permite elegir voz desde la UI.
 */

let voicesCache: SpeechSynthesisVoice[] | null = null;

export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (voicesCache?.length) {
      resolve(voicesCache);
      return;
    }
    const list = window.speechSynthesis.getVoices();
    if (list.length) {
      voicesCache = list;
      resolve(list);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      voicesCache = window.speechSynthesis.getVoices();
      resolve(voicesCache || []);
    };
    setTimeout(() => {
      voicesCache = window.speechSynthesis.getVoices();
      resolve(voicesCache || []);
    }, 100);
  });
}

/**
 * Devuelve TODAS las voces en español que ofrece el navegador (es-ES, es-MX, es-AR, etc.),
 * ordenadas: es-ES primero, luego preferencia por masculinas por nombre. Sin límite: todas las gratuitas.
 */
export function getSpanishVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const allEs = voices.filter((v) => v.lang.startsWith("es"));
  return [...allEs].sort((a, b) => {
    const aES = a.lang === "es-ES" ? 1 : 0;
    const bES = b.lang === "es-ES" ? 1 : 0;
    if (bES !== aES) return bES - aES;
    const male = (v: SpeechSynthesisVoice) => /male|pablo|carlos|jorge|diego|antonio|raúl|man/i.test(v.name) ? 1 : 0;
    return male(b) - male(a);
  });
}

function selectFromVoices(list: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const es = getSpanishVoices(list);
  return es[0] || null;
}

/**
 * Reproduce texto con la voz indicada (o la por defecto española).
 * voiceUri: opcional, voiceURI de la voz elegida en el selector.
 */
export function speakAsHuman(text: string, onEnd?: () => void, voiceUri?: string | null): void {
  if (!text.trim()) {
    onEnd?.();
    return;
  }
  getVoices().then((list) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = 0.9;
    u.pitch = 1.0;
    u.volume = 1;
    const voice = voiceUri ? list.find((v) => v.voiceURI === voiceUri) : null;
    if (voice) {
      u.voice = voice;
    } else {
      const fallback = selectFromVoices(list);
      if (fallback) u.voice = fallback;
    }
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
  });
}

/** Reproduce una frase corta de prueba con la voz indicada (para vista previa). */
export function previewVoice(
  voiceUri: string | null,
  phrase = "Hola, soy el prospecto. ¿En qué puedo ayudarle?",
  onEnd?: () => void
): void {
  window.speechSynthesis.cancel();
  speakAsHuman(phrase, onEnd, voiceUri || undefined);
}

export function cancelSpeech(): void {
  window.speechSynthesis.cancel();
}
