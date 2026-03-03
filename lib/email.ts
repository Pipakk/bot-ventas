import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "no-reply@coldcall-trainer.local";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const t = getTransporter();
  const subject = "Restablecer tu contraseña - ColdCall Trainer";
  const text = `Has solicitado restablecer tu contraseña en ColdCall Trainer.

Para crear una nueva contraseña, haz clic en el siguiente enlace (o cópialo en tu navegador):

${resetUrl}

Si tú no has solicitado este cambio, puedes ignorar este correo.`;

  if (!t) {
    // En entorno de desarrollo, si no hay SMTP configurado, simplemente logueamos el enlace
    console.log("[Password reset] Enlace de restablecimiento para", to, "=>", resetUrl);
    return;
  }

  await t.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    text,
  });
}

