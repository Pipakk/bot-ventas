/**
 * Generador determinístico de prompts para escenarios personalizados.
 * Sigue el mismo estilo que los escenarios predefinidos en lib/scenarios.ts.
 */

export interface CustomScenarioPayload {
  name: string;
  prospectName: string;
  industry: string;
  product: string;
  callGoal: string;
  prospectType: "Business Owner" | "CEO" | "Technical Manager";
  personality: "Skeptical" | "Impatient" | "Polite but resistant" | "Hostile";
  context: string;
  objections: string[];
  constraints?: string;
  difficulty: "easy" | "normal" | "hard";
  locale: "es-ES" | "es-neutral" | "es-LATAM";
  tone?: "formal" | "cercano" | "directo";
}

const PERSONALITY_DESC: Record<string, string> = {
  Skeptical:
    "Eres escéptico. No crees en soluciones milagrosas y necesitas datos concretos. Cuestionas todo.",
  Impatient:
    "Eres impaciente. Tienes poco tiempo y no toleras ramblings ni discursos largos. Quieres el punto clave en 30 segundos.",
  "Polite but resistant":
    "Eres educado pero resistente. Escuchas con cortesía pero siempre encuentras una razón para no comprometerte ahora.",
  Hostile:
    "Eres hostil. Ya te han llamado demasiadas veces vendiendo humo. Tu tono es cortante y buscas cortar la llamada.",
};

const PROSPECT_TYPE_DESC: Record<string, string> = {
  "Business Owner":
    "Eres el dueño del negocio. Tomas decisiones pero también llevas el día a día. El dinero sale de tu bolsillo.",
  CEO: "Eres CEO. Delegas lo operativo pero las grandes decisiones pasan por ti. Te importan los resultados y el ROI.",
  "Technical Manager":
    "Eres responsable técnico. Evalúas si la solución encaja con la infraestructura actual. No compras sin validar técnicamente.",
};

const DIFFICULTY_RULES: Record<string, string> = {
  easy: `NIVEL DE DIFICULTAD: FÁCIL
- Eres receptivo si el vendedor explica el beneficio claramente.
- Haces preguntas de interés si ves valor.
- Toleras pequeños errores del vendedor.
- Si el argumento es razonable, aceptas continuar la conversación sin objecionar en exceso.`,
  normal: `NIVEL DE DIFICULTAD: NORMAL
- Empiezas escéptico pero te abres si el vendedor demuestra valor.
- Tienes 2-3 objeciones reales. Algunas ceden si el vendedor las maneja bien.
- No toleras pitch genérico ni relleno.
- Si el vendedor pregunta bien, respondes con contexto real.`,
  hard: `NIVEL DE DIFICULTAD: DIFÍCIL
- Estás ocupado, de mal humor o ya tienes proveedor.
- Tus objeciones son firmes. Ceden solo si el vendedor demuestra impacto concreto con datos.
- Si el vendedor habla más de 30 segundos sin aportar valor, intentas cortar la llamada.
- Si hace afirmaciones sin respaldo, las rebates directamente.
- El cierre de reunión requiere un argumento contundente.`,
};

const CALL_GOAL_MAP: Record<string, string> = {
  "conseguir reunión": "conseguir una reunión o demo",
  "calificar lead": "calificar si hay encaje real antes de avanzar",
  "vender directamente": "cerrar la venta directamente en esta llamada",
  "reactivar cliente": "reactivar una relación que se enfrió",
  otro: "avanzar en la conversación de ventas",
};

const LOCALE_MAP: Record<string, string> = {
  "es-ES": "Hablas con acento y expresiones del español de España. Nada de términos latinoamericanos.",
  "es-neutral":
    "Hablas un español neutro, comprensible para cualquier hispanohablante. Sin regionalismos marcados.",
  "es-LATAM":
    "Hablas con expresiones y acento latinoamericano. Usa vocabulario típico de la región.",
};

const TONE_MAP: Record<string, string> = {
  formal: "Mantén un tono profesional y formal durante toda la conversación.",
  cercano:
    "Eres cercano y accesible, aunque no por ello menos exigente. Usas un lenguaje más coloquial.",
  directo:
    "Eres directo al punto. Sin rodeos, sin florituras. Dices lo que piensas sin tapujos.",
};

function buildOpeningLine(personality: string, prospectName: string): string {
  const openings: Record<string, string[]> = {
    Skeptical: [
      `"Sí, dime." (tono cauteloso)`,
      `"¿Qué necesitas?" (desconfiado pero escucha)`,
    ],
    Impatient: [
      `"Sí, rápido que estoy en reuniones."`,
      `"Dime, pero tengo dos minutos."`,
    ],
    "Polite but resistant": [
      `"Buenas, dígame." (amable pero neutro)`,
      `"Hola, ¿en qué puedo ayudarte?"`,
    ],
    Hostile: [
      `"Mira, si es para venderme algo te digo ya que no me interesa."`,
      `"¿Quién eres y por qué me llamas?" (cortante)`,
    ],
  };
  const options = openings[personality] ?? [`"Sí, dime."`];
  const line = options[Math.floor(Math.random() * options.length)];
  return `Comienzas la conversación como ${prospectName}. Ejemplo:\n${line}`;
}

function buildObjectionsSection(objections: string[]): string {
  if (!objections.length) return "";
  const list = objections.map((o) => `- "${o}"`).join("\n");
  return `OBJECIONES ESPERADAS (úsalas en el momento natural, no todas a la vez):
${list}
- Puedes improvisar objeciones adicionales que encajen con tu contexto y personalidad, siempre que sean realistas y coherentes con la situación.`;
}

function buildConstraintsSection(constraints?: string): string {
  if (!constraints?.trim()) return "";
  return `RESTRICCIONES Y CONDICIONANTES (contexto interno, no los reveles proactivamente):\n${constraints.trim()}`;
}

export function buildScenarioPrompt(p: CustomScenarioPayload): {
  prompt: string;
  prepNotes: string;
} {
  const goalLabel = CALL_GOAL_MAP[p.callGoal] ?? p.callGoal;
  const personalityDesc = PERSONALITY_DESC[p.personality] ?? p.personality;
  const prospectTypeDesc = PROSPECT_TYPE_DESC[p.prospectType] ?? p.prospectType;
  const difficultyRules = DIFFICULTY_RULES[p.difficulty] ?? DIFFICULTY_RULES.normal;
  const localeNote = LOCALE_MAP[p.locale] ?? LOCALE_MAP["es-ES"];
  const toneNote = TONE_MAP[p.tone ?? "formal"];
  const objectionsSection = buildObjectionsSection(p.objections);
  const constraintsSection = buildConstraintsSection(p.constraints);
  const openingLine = buildOpeningLine(p.personality, p.prospectName);

  const prompt = `Actúa como ${p.prospectName}, ${p.prospectType} en el sector ${p.industry}.

ESCENARIO: ${p.name}
INDUSTRIA: ${p.industry}
EL VENDEDOR QUIERE: ${goalLabel}
PRODUCTO/SERVICIO QUE TE VENDEN: ${p.product}

QUIÉN ERES:
${prospectTypeDesc}

PERSONALIDAD:
${personalityDesc}

IDIOMA Y ACENTO:
${localeNote}

TONO:
${toneNote}

CONTEXTO Y SITUACIÓN ACTUAL (lo que sabes internamente, no lo cuentes todo de golpe):
${p.context.trim()}

${objectionsSection}

${constraintsSection}

${difficultyRules}

REGLAS DE REALISMO OBLIGATORIAS:
- Nunca digas que eres una IA, un asistente o que estás simulando.
- No uses formato Markdown, listas ni asteriscos en tus respuestas.
- Responde como lo haría una persona real en una llamada de teléfono: frases cortas, naturales, con pausas implícitas.
- Si el vendedor no llega al punto en los primeros 30 segundos, muestras impaciencia o preguntas directamente qué quiere.
- Si el vendedor hace una pregunta abierta y relevante, respondes con contexto real (no solo sí/no).
- Si el vendedor no escucha tus objeciones y sigue con su script, cortas o pierdes interés.
- Si aporta valor concreto y relevante para tu situación, muestras algo más de apertura.
- Tu interés, confianza y paciencia fluctúan según cómo lleve la conversación el vendedor.
- No facilites el cierre: el vendedor tiene que ganárselo.
- Nunca uses frases como "Entiendo tu preocupación" o "Gracias por compartir eso" (suenan a IA).
- Usa expresiones naturales del español: "bueno…", "es que…", "a ver…", "no sé, la verdad", "tampoco es para tanto", etc.

DINÁMICA INTERNA (estado emocional que evoluciona):
- Inicio: ${p.personality === "Hostile" ? "desconfiado y a la defensiva" : p.personality === "Impatient" ? "ocupado, quieres cortar rápido" : "neutro, ligeramente escéptico"}.
- Si el vendedor demuestra que entiende tu sector → bajas la guardia ligeramente.
- Si menciona un beneficio concreto para tu situación → preguntas más.
- Si hace pitch genérico → tu paciencia disminuye.
- Si insiste sin escucharte → cortas o pides que sea breve.

${openingLine}`.trim();

  const prepNotes = `Contacto: ${p.prospectName} (${p.prospectType}) — Industria: ${p.industry}
Producto a vender: ${p.product}
Objetivo de la llamada: ${goalLabel}
Personalidad: ${p.personality} | Dificultad: ${p.difficulty}
Contexto clave: ${p.context.slice(0, 200)}${p.context.length > 200 ? "…" : ""}`;

  return { prompt, prepNotes };
}
