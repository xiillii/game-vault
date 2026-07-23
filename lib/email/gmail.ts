import { google } from "googleapis";
import type { SendContactEmailInput, SendContactEmailResult } from "./types";

function encodeRawMessage(params: {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  body: string;
}): string {
  const message = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Reply-To: ${params.replyTo}`,
    `Subject: =?UTF-8?B?${Buffer.from(params.subject, "utf-8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    params.body,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendViaGmail(
  input: SendContactEmailInput
): Promise<SendContactEmailResult> {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const senderEmail = process.env.GMAIL_SENDER_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!clientId || !clientSecret || !refreshToken || !senderEmail || !to) {
    return {
      ok: false,
      error:
        "Falta configuración de Gmail (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER_EMAIL o CONTACT_TO_EMAIL).",
    };
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const raw = encodeRawMessage({
      from: senderEmail,
      to,
      replyTo: input.email,
      subject: `[Arcade Vault] Nuevo mensaje de ${input.name}`,
      body: `De: ${input.name} <${input.email}>\n\n${input.msg}`,
    });

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Error desconocido al enviar el correo vía Gmail.";
    return { ok: false, error };
  }
}
