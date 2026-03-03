// Plantillas de objeciones por trigger (keywords). Sin LLM.
import type { ObjectionTemplate } from "./types";

export const OBJECTION_TEMPLATES: ObjectionTemplate[] = [
  {
    trigger: ["precio", "price", "caro", "coste", "coste", "presupuesto", "budget", "dinero"],
    normal: [
      "Es que me parece caro para lo que ofrecemos.",
      "No tenemos presupuesto para esto ahora mismo.",
      "El precio no encaja con lo que teníamos en mente.",
    ],
    hard: [
      "Es carísimo. Ni de lejos.",
      "Estás perdiendo mi tiempo. No tenemos budget.",
      "Qué precio ni qué niño muerto. Siguiente.",
    ],
  },
  {
    trigger: ["tiempo", "time", "ahora no", "después", "later", "prisa", "ocupado", "busy"],
    normal: [
      "Ahora no es buen momento, estamos muy ocupados.",
      "Llámame dentro de un par de meses.",
      "No tengo tiempo para esto.",
    ],
    hard: [
      "No tengo tiempo. Corta.",
      "¿No te he dicho que estoy ocupado? Adiós.",
      "Otra vez con lo mismo. Ya te he dicho que después.",
    ],
  },
  {
    trigger: ["competencia", "competitor", "ya tenemos", "otro proveedor", "otra empresa"],
    normal: [
      "Ya trabajamos con otra empresa para esto.",
      "Tenemos un proveedor que nos va bien.",
      "La competencia nos ofrece algo similar.",
    ],
    hard: [
      "Ya tenemos a alguien. No insistas.",
      "Otra empresa nos da mejor precio. ¿Algo más?",
      "Sí, la competencia. Y nos va bien. Hasta luego.",
    ],
  },
  {
    trigger: ["interesante", "cuéntame", "explícame", "más información", "info"],
    normal: [
      "Suena interesante, pero necesito pensarlo.",
      "Cuéntame un poco más, sin compromiso.",
      "Podría tener sentido. ¿Qué incluye exactamente?",
    ],
    hard: [
      "Interesante no significa que lo vaya a comprar.",
      "Más información sí, pero no me presiones.",
      "Vale, lo miro. No esperes que te llame.",
    ],
  },
  {
    trigger: ["no", "no me interesa", "no estamos interesados", "paso", "no gracias"],
    normal: [
      "La verdad es que no nos interesa por ahora.",
      "No creo que sea para nosotros.",
      "Gracias pero no, no encaja.",
    ],
    hard: [
      "He dicho que no. ¿Cuántas veces?",
      "No. N-O. ¿Entiendes?",
      "No me interesa. Punto. Cuelga.",
    ],
  },
  {
    trigger: ["hablar", "hablar con", "decision", "decisor", "jefe", "socio"],
    normal: [
      "Eso tendría que hablarlo con mi socio.",
      "No soy yo quien decide estas cosas.",
      "Tendrías que hablar con el que lleva compras.",
    ],
    hard: [
      "Yo no decido. Y el que decide no tiene tiempo para ti.",
      "Hablar con mi jefe. Claro. Como si tuviera tiempo.",
      "El decisor no va a coger el teléfono. Siguiente.",
    ],
  },
  {
    trigger: ["envía", "envíame", "email", "correo", "información por escrito"],
    normal: [
      "¿Me lo puedes enviar por email para revisarlo?",
      "Mándame algo por escrito y lo miro.",
      "Prefiero ver la información por correo.",
    ],
    hard: [
      "Envíamelo por email y si me interesa te llamo. O no.",
      "Sí, por correo. Y no me vuelvas a llamar sin avisar.",
      "Email, vale. No esperes respuesta esta semana.",
    ],
  },
];

// Respuestas de saludo según personalidad y dificultad
export const GREETING_TEMPLATES: Record<string, string[]> = {
  "normal_neutral": [
    "Sí, dígame.",
    "Hola, ¿quién es?",
    "Dígame, ¿en qué puedo ayudarle?",
  ],
  "normal_skeptical": [
    "Sí, ¿qué quiere?",
    "Hola. ¿De parte de quién?",
    "Dígame, pero sea breve.",
  ],
  "normal_impatient": [
    "Sí, rápido.",
    "Dígame, tengo poco tiempo.",
    "¿Sí? ¿Qué hay?",
  ],
  "normal_polite": [
    "Buenos días, dígame.",
    "Hola, ¿en qué puedo ayudarle?",
    "Sí, adelante, por favor.",
  ],
  "normal_hostile": [
    "¿Quién es?",
    "¿Qué quiere?",
    "Sí, diga.",
  ],
  "hard_neutral": [
    "¿Sí?",
    "Diga.",
    "¿Qué?",
  ],
  "hard_skeptical": [
    "¿Quién llama?",
    "Sí, ¿y?",
    "¿Qué vende?",
  ],
  "hard_impatient": [
    "Rápido, que tengo una reunión.",
    "Sí sí, ¿qué quiere?",
    "En 30 segundos, ¿vale?",
  ],
  "hard_polite": [
    "Buenos días. Tengo poco tiempo, ¿en qué va?",
    "Sí, sea breve por favor.",
    "Adelante, pero voy justo.",
  ],
  "hard_hostile": [
    "¿Qué?",
    "No he pedido que me llamen. ¿Qué quiere?",
    "Sí, diga ya.",
  ],
};

// Frases para reconocer lo que dice el usuario antes de objetar (conversación más natural)
export const ACKNOWLEDGMENT_PHRASES: string[] = [
  "Entiendo, pero ",
  "Mire, el tema es que ",
  "Sí, ya, lo que pasa es que ",
  "De acuerdo, pero ",
  "Le escucho, sin embargo ",
  "Vale, pero ",
];

// Cierre / despedida
export const CLOSE_TEMPLATES: string[] = [
  "Vale, entonces lo dejamos aquí. Un saludo.",
  "De acuerdo. Si cambia algo ya me llama. Hasta luego.",
  "Pues nada, gracias por su tiempo. Adiós.",
  "Entendido. Que tenga buen día. Adiós.",
];
