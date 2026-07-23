import { Resend } from "resend";
import type { SendContactEmailInput, SendContactEmailResult } from "./types";

export async function sendViaResend(
  input: SendContactEmailInput
): Promise<SendContactEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !to) {
    return { ok: false, error: "Falta configuración de Resend (RESEND_API_KEY o CONTACT_TO_EMAIL)." };
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: "Arcade Vault <onboarding@resend.dev>",
    to,
    replyTo: input.email,
    subject: `[Arcade Vault] Nuevo mensaje de ${input.name}`,
    text: `De: ${input.name} <${input.email}>\n\n${input.msg}`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
