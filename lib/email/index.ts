import { sendViaResend } from "./resend";
import { sendViaGmail } from "./gmail";
import type { SendContactEmailInput, SendContactEmailResult } from "./types";

export type { SendContactEmailInput, SendContactEmailResult, EmailProvider } from "./types";

export async function sendContactEmail(
  input: SendContactEmailInput
): Promise<SendContactEmailResult> {
  const provider = process.env.EMAIL_PROVIDER;

  switch (provider) {
    case "resend":
      return sendViaResend(input);
    case "gmail":
      return sendViaGmail(input);
    default:
      return { ok: false, error: `EMAIL_PROVIDER no reconocido: "${provider}".` };
  }
}
