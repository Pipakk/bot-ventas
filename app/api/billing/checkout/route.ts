import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { getBearerUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const bodySchema = z.object({
  plan: z.enum(["free", "professional", "premium", "growth", "unlimited"]),
});

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2022-11-15" })
  : null;

// Soporta tanto los nuevos IDs (professional/premium) como los legacy (growth/unlimited)
const PRICE_IDS: Record<string, string | undefined> = {
  professional: process.env.STRIPE_PRICE_GROWTH ?? process.env.STRIPE_PRICE_PROFESSIONAL,
  premium: process.env.STRIPE_PRICE_UNLIMITED ?? process.env.STRIPE_PRICE_PREMIUM,
  // legacy aliases
  growth: process.env.STRIPE_PRICE_GROWTH ?? process.env.STRIPE_PRICE_PROFESSIONAL,
  unlimited: process.env.STRIPE_PRICE_UNLIMITED ?? process.env.STRIPE_PRICE_PREMIUM,
};

// Normalizar plan al nuevo nombre
const PLAN_NORMALIZE: Record<string, string> = {
  growth: "professional",
  unlimited: "premium",
  professional: "professional",
  premium: "premium",
};

export async function POST(request: Request) {
  const userId = getBearerUserId(request.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { plan: rawPlan } = bodySchema.parse(body);
    const plan = PLAN_NORMALIZE[rawPlan] ?? rawPlan;

    if (rawPlan === "free") {
      await prisma.user.update({ where: { id: userId }, data: { plan: "free" } });
      return NextResponse.json({ url: null });
    }

    if (!stripe) {
      return NextResponse.json({ error: "Stripe no está configurado en el servidor." }, { status: 500 });
    }

    const priceId = PRICE_IDS[rawPlan];
    if (!priceId) {
      return NextResponse.json({ error: "ID de precio de Stripe no configurado para este plan." }, { status: 500 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) {
      return NextResponse.json({ error: "El usuario no tiene un email válido." }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, plan },
      payment_method_collection: "always",
      payment_method_types: ["card"],
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo crear la sesión de pago." }, { status: 500 });
  }
}
