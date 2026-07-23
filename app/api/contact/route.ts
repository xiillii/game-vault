import { sendContactEmail } from "@/lib/email";

interface ContactRequestBody {
  name: string;
  email: string;
  msg: string;
  hp?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: ContactRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  const { name, email, msg, hp } = body;

  if (hp) {
    return Response.json({ ok: true });
  }

  if (!name?.trim() || !email?.trim() || !msg?.trim()) {
    return Response.json({ ok: false, error: "Faltan campos requeridos." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email.trim())) {
    return Response.json({ ok: false, error: "El correo no tiene un formato válido." }, { status: 400 });
  }

  const result = await sendContactEmail({ name: name.trim(), email: email.trim(), msg: msg.trim() });

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 500 });
  }

  return Response.json({ ok: true });
}
