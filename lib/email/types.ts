export interface SendContactEmailInput {
  name: string;
  email: string;
  msg: string;
}

export interface SendContactEmailResult {
  ok: boolean;
  error?: string;
}

export type EmailProvider = "resend" | "gmail";
