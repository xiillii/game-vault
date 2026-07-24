import { prisma } from "@/lib/prisma";

interface ScoreRequestBody {
  gameId: string;
  nickname: string;
  score: number;
}

export async function POST(request: Request) {
  let body: ScoreRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Cuerpo de la petición inválido." },
      { status: 400 },
    );
  }

  const { gameId, nickname, score } = body;
  const trimmedNickname = nickname?.trim() ?? "";

  if (!trimmedNickname) {
    return Response.json(
      { error: "El nickname no puede estar vacío." },
      { status: 400 },
    );
  }

  if (typeof score !== "number" || !Number.isFinite(score)) {
    return Response.json(
      { error: "La puntuación no es válida." },
      { status: 400 },
    );
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return Response.json({ error: "Juego no encontrado." }, { status: 404 });
  }

  const created = await prisma.score.create({
    data: { gameId, nickname: trimmedNickname, score },
  });

  return Response.json(
    {
      id: created.id,
      gameId: created.gameId,
      nickname: created.nickname,
      score: created.score,
      createdAt: created.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
