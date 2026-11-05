import nodemailer from "nodemailer";

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type SendResult =
  // Sent through the configured SMTP server.
  | { delivered: true }
  // Local development with no SMTP server: the message was printed to the server log.
  | { delivered: false; loggedForDevelopment: true };

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email sending isn't configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM.");
  }
}

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

// True only for `next dev` with no SMTP server: the one case where we may skip real
// delivery (and show verification links on screen) so the app can be demoed offline.
export function isDevelopmentEmailFallback() {
  return process.env.NODE_ENV === "development" && !isSmtpConfigured();
}

const globalForEmail = globalThis as unknown as { smtpTransport?: nodemailer.Transporter };

function getTransport() {
  if (!globalForEmail.smtpTransport) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    globalForEmail.smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // Port 465 uses TLS from the start; other ports upgrade with STARTTLS.
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
    });
  }

  return globalForEmail.smtpTransport;
}

export async function sendEmail(message: OutgoingEmail): Promise<SendResult> {
  if (isSmtpConfigured()) {
    await getTransport().sendMail({
      from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html
    });
    return { delivered: true };
  }

  if (isDevelopmentEmailFallback()) {
    console.info(`\n[email:dev] No SMTP server configured; not sent.\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`);
    return { delivered: false, loggedForDevelopment: true };
  }

  // Never silently skip verification outside local development.
  throw new EmailNotConfiguredError();
}
