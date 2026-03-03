# Despliegue en producción y configuración de Stripe

Guía para poner ColdCall Trainer en producción y configurar pagos con Stripe.

---

## 1. Configuración de Stripe

### 1.1 Cuenta y claves

1. Entra en [Stripe Dashboard](https://dashboard.stripe.com) e inicia sesión (o crea una cuenta).
2. En **Developers → API keys**:
   - **Clave secreta**: usa la clave **Live** (empieza por `sk_live_...`) en producción. En pruebas usa **Test** (`sk_test_...`).
   - No expongas la clave secreta en el frontend; solo se usa en el servidor.

### 1.2 Productos y precios

Crea dos productos (uno por plan de pago) y asigna un precio recurrente mensual a cada uno:

1. **Developers → Products → Add product**
2. **Plan Crecimiento (40 €/mes)**:
   - Nombre: por ejemplo `ColdCall Trainer - Crecimiento`
   - Precio: **Recurring**, **Monthly**, **40 €**
   - Crear y anota el **Price ID** (empieza por `price_...`).
3. **Plan Pro ilimitado (60 €/mes)**:
   - Otro producto, nombre ej. `ColdCall Trainer - Pro ilimitado`
   - Precio: **Recurring**, **Monthly**, **60 €**
   - Anota su **Price ID**.

### 1.3 Variables de entorno

En tu servidor o plataforma de despliegue configura:

```env
# Clave secreta (Live o Test)
STRIPE_SECRET_KEY="sk_live_..."

# Price IDs de los dos planes
STRIPE_PRICE_GROWTH="price_..."
STRIPE_PRICE_UNLIMITED="price_..."

# Para que el webhook actualice el plan al usuario tras el pago (ver siguiente apartado)
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Sin `STRIPE_WEBHOOK_SECRET` el checkout funcionará, pero el plan del usuario no se activará solo al pagar; tendrías que actualizarlo a mano en la base de datos.

### 1.4 Webhook (activar plan automáticamente)

Para que, al completar el pago, el usuario pase a tener el plan correcto en la app:

1. En Stripe: **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL**:  
   `https://tu-dominio.com/api/billing/webhook`  
   (sustituye `tu-dominio.com` por tu URL de producción).
3. Eventos a escuchar: **checkout.session.completed**.
4. Crear el endpoint. Stripe te dará un **Signing secret** (empieza por `whsec_...`).
5. Pon ese valor en `STRIPE_WEBHOOK_SECRET` en tu servidor.

En **local** puedes usar el CLI de Stripe para reenviar eventos a `http://localhost:3000/api/billing/webhook` y obtener un `whsec_...` de prueba para desarrollo.

---

## 2. Despliegue en producción

La app es un **Next.js 14** con **Prisma** y **PostgreSQL**. Opciones habituales:

### 2.1 Vercel (recomendado para Next.js)

1. Sube el proyecto a GitHub y conéctalo en [Vercel](https://vercel.com).
2. **Environment variables** en Vercel:
   - `DATABASE_URL` (PostgreSQL de producción, ej. Vercel Postgres, Neon, Supabase).
   - `JWT_SECRET` (string largo y aleatorio).
   - `NEXT_PUBLIC_APP_URL` = `https://tu-dominio.vercel.app` (o tu dominio propio).
   - Las de Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_UNLIMITED`, `STRIPE_WEBHOOK_SECRET`.
   - Opcionales: SMTP si usas recuperación de contraseña por email.
3. **Build**: Vercel usa `npm run build` por defecto.
4. **Migraciones**: ejecuta una sola vez (o en cada deploy con un script):
   ```bash
   npx prisma migrate deploy
   ```
   Puedes hacerlo desde tu máquina con `DATABASE_URL` apuntando a la BD de producción, o con un job/post-deploy en Vercel.

El **webhook de Stripe** debe apuntar a:

`https://tu-dominio.vercel.app/api/billing/webhook`

---

### 2.2 Docker (VPS, Railway, etc.)

El proyecto incluye un **Dockerfile** y `next.config.mjs` ya tiene `output: "standalone"`.

**Build y ejecución:**

```bash
docker build -t coldcall-trainer .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/coldcall" \
  -e JWT_SECRET="tu-jwt-secret-muy-largo" \
  -e NEXT_PUBLIC_APP_URL="https://tu-dominio.com" \
  -e STRIPE_SECRET_KEY="sk_live_..." \
  -e STRIPE_PRICE_GROWTH="price_..." \
  -e STRIPE_PRICE_UNLIMITED="price_..." \
  -e STRIPE_WEBHOOK_SECRET="whsec_..." \
  coldcall-trainer
```

**Migraciones:** la primera vez (o cuando cambies el schema) ejecuta en un contenedor o en un host con acceso a la misma BD:

```bash
npx prisma migrate deploy
```

Asegura que PostgreSQL esté accesible desde donde corre el contenedor (misma red, seguridad de red, etc.).

---

### 2.3 Otras plataformas

- **Railway / Render / Fly.io**: suelen detectar Next.js; configura las mismas variables de entorno y ejecuta `prisma migrate deploy` en el release.
- **Servidor propio**: `npm run build && npm run start` (o PM2/systemd) con Node 18+. Necesitas PostgreSQL instalado o remoto y las mismas variables.

---

## 3. Checklist antes de producción

- [ ] `DATABASE_URL` apunta a una base PostgreSQL de producción.
- [ ] `JWT_SECRET` es un valor aleatorio fuerte (no el de desarrollo).
- [ ] `NEXT_PUBLIC_APP_URL` es la URL pública de la app (sin barra final).
- [ ] Stripe en modo **Live** si quieres cobrar de verdad; claves y Price IDs de Live.
- [ ] Webhook creado en Stripe con la URL `https://tu-dominio.com/api/billing/webhook` y evento `checkout.session.completed`.
- [ ] `STRIPE_WEBHOOK_SECRET` configurado con el signing secret del webhook.
- [ ] Migraciones aplicadas: `npx prisma migrate deploy`.
- [ ] Opcional: SMTP configurado si usas “olvidé contraseña”.

Con esto puedes desplegar la app en producción y que Stripe cobre y actualice el plan del usuario automáticamente tras el pago.
