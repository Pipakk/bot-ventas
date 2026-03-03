# ColdCall Trainer

SaaS MVP para practicar llamadas en frío (cold call) en español (España) con un avatar 2D por voz.

## Características

- **Simulación solo con IA**: OpenAI / Groq / Ollama con API key del usuario.
- **Avatar 2D**: animación labios, parpadeo y expresiones según estado.
- **Experiencia de llamada**: tono de llamada, retraso de contestación, barge-in (cortar al hablar).
- **Scoring**: puntuación por objeciones, preguntas, control, ratio hablar/escuchar, confianza, persistencia, SPIN y tonalidad.
- **Auth**: email/contraseña y JWT. Límites: Free (5 llamadas locales/día), Pro (ilimitado + AI).

## Requisitos

- Node.js 18+
- PostgreSQL
- Navegador con Web Speech API (Chrome/Edge recomendado)

## Instalación

```bash
npm install
cp .env.example .env
# Editar .env con DATABASE_URL y JWT_SECRET
npx prisma migrate dev
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` – Desarrollo
- `npm run build` – Build producción
- `npm run start` – Servir build
- `npm run lint` – ESLint
- `npm run test` – Tests (Vitest)
- `npx prisma migrate dev` – Migraciones
- `npx prisma generate` – Generar cliente Prisma

## Despliegue y Stripe

Para **desplegar en producción** (Vercel, Docker, VPS) y **configurar Stripe** (productos, precios, webhook), sigue la guía **[DEPLOY.md](./DEPLOY.md)**.

Resumen rápido con Docker (el proyecto ya tiene `output: 'standalone'` en `next.config.mjs`):

```bash
docker build -t coldcall-trainer .
docker run -p 3000:3000 -e DATABASE_URL="..." -e JWT_SECRET="..." -e STRIPE_SECRET_KEY="..." coldcall-trainer
```

Migraciones: `npx prisma migrate deploy`.

## Estructura

- `app/` – Rutas y páginas (Next.js App Router)
- `components/` – Avatar, CallTrainer
- `lib/` – DB, auth, store (Zustand)
- `modules/ai-engine/` – Cliente IA (OpenAI / Groq / Ollama)
- `modules/scoring/` – Cálculo de puntuación
- `modules/audio/` – Tono de llamada y voz
- `prisma/` – Schema y migraciones

## Planes

- **Free**: sin acceso a modo IA (o limitado según configuración de backend).
- **Pro**: Simulaciones IA con API key propia y scoring avanzado.

Para dar Pro a un usuario: actualizar en BD `User.role` a `pro`.
