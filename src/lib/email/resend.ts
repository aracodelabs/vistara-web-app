import { Resend } from "resend";
import { buildPasswordResetEmail } from "./templates/password-reset";

if (typeof window !== "undefined") {
  throw new Error("email/resend is server-only");
}

export interface EmailSendResult {
  sent: boolean;
  error?: string;
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<EmailSendResult> {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const from = (
    process.env.EMAIL_FROM || "Vistara Admin <onboarding@resend.dev>"
  ).trim();

  if (!apiKey) {
    console.warn(
      "RESEND_API_KEY is not configured; password reset email was not dispatched."
    );
    return {
      sent: false,
      error: "RESEND_API_KEY is not configured.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const email = buildPasswordResetEmail({ name, resetUrl, expiresMinutes: 30 });

    const { error } = await resend.emails.send({
      from,
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (error) {
      console.error("Resend delivery error:", error);
      return { sent: false, error: error.message };
    }

    return { sent: true };
  } catch (err) {
    console.error("Resend exception:", err);
    return {
      sent: false,
      error: err instanceof Error ? err.message : "Email delivery error",
    };
  }
}
