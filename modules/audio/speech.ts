/**
 * TTS mejorado: prioriza voces neurales/enhanced/premium disponibles en el navegador.
 * En Chrome/Edge desktop hay voces Google/Microsoft Neural gratuitas que suenan muy bien.
 * En Safari/iOS hay voces "Enhanced" también de alta calidad.
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
    }, 200);
  });
}

/**
 * Puntuación de calidad de una voz. Cuanto más alto, mejor.
 * Prioridad: Neural > Enhanced > Online > local
 */
function voiceQualityScore(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  let score = 0;

  // Voces neurales de Google Chrome (muy naturales)
  if (name.includes("google") && name.includes("español")) score += 100;
  if (name.includes("google") && name.includes("spanish")) score += 100;
  if (name.includes("google") && v.lang.startsWith("es")) score += 90;

  // Voces Microsoft Neural en Edge (las mejores en Windows)
  if (name.includes("microsoft") && name.includes("neural")) score += 100;
  if (name.includes("microsoft") && (name.includes("alvaro") || name.includes("jorge") || name.includes("pablo"))) score += 110;

  // Voces Apple Enhanced en Safari/iOS (muy naturales)
  if (name.includes("enhanced")) score += 85;
  if (name.includes("premium")) score += 90;

  // Voces online generalmente mejores que locales
  if (!v.localService) score += 30;

  // Preferencia por español de España
  if (v.lang === "es-ES") score += 20;
  else if (v.lang.startsWith("es")) score += 10;

  // Preferencia masculina (suena más a prospecto CEO/businessman)
  if (/pablo|carlos|jorge|diego|antonio|raúl|alvaro|andrés|miguel|male/i.test(name)) score += 15;

  // Penalizar voces que suenan robóticas conocidas
  if (name.includes("espeak")) score -= 50;
  if (name.includes("mbrola")) score -= 50;

  return score;
}

/**
 * Devuelve todas las voces en español ordenadas por calidad (mejor primero).
 */
export function getSpanishVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const allEs = voices.filter((v: SpeechSynthesisVoice) => v.lang.startsWith("es"));
  return [...allEs].sort((a: SpeechSynthesisVoice, b: SpeechSynthesisVoice) =>
    voiceQualityScore(b) - voiceQualityScore(a)
  );
}

function selectBestVoice(list: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const sorted = getSpanishVoices(list);
  return sorted[0] || null;
}

/**
 * Reproduce texto con la mejor voz disponible.
 * Si voiceUri está definido, usa esa voz específica.
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
    u.volume = 1;

    const voice = voiceUri
      ? list.find((v: SpeechSynthesisVoice) => v.voiceURI === voiceUri) ?? selectBestVoice(list)
      : selectBestVoice(list);

    if (voice) {
      u.voice = voice;
      const name = voice.name.toLowerCase();

      // Ajustar rate/pitch según tipo de voz para máxima naturalidad
      if (name.includes("google") || name.includes("microsoft")) {
        // Las voces neurales suenan mejor a velocidad casi normal
        u.rate = 0.95;
        u.pitch = 1.0;
      } else if (name.includes("enhanced") || name.includes("premium")) {
        u.rate = 0.92;
        u.pitch = 1.0;
      } else {
        // Voces locales del sistema: bajar pitch y rate para sonar menos robótico
        u.rate = 0.85;
        u.pitch = 0.9;
      }
    } else {
      // Fallback sin voz asignada
      u.rate = 0.88;
      u.pitch = 0.95;
    }

    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
  });
}

/** Reproduce una frase corta de prueba con la voz indicada. */
export function previewVoice(
  voiceUri: string | null,
  phrase = "Buenos días, ¿en qué le puedo ayudar?",
  onEnd?: () => void
): void {
  window.speechSynthesis.cancel();
  speakAsHuman(phrase, onEnd, voiceUri || undefined);
}

export function cancelSpeech(): void {
  window.speechSynthesis.cancel();
}
