import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const game = await prisma.game.findUnique({ where: { id } });

  if (!game) {
    return Response.json({ error: "Juego no encontrado." }, { status: 404 });
  }

  const [best, plays, scores] = await Promise.all([
    prisma.score.aggregate({
      where: { gameId: id },
      _max: { score: true },
    }),
    prisma.score.count({ where: { gameId: id } }),
    prisma.score.findMany({
      where: { gameId: id },
      orderBy: { score: "desc" },
    }),
  ]);

  const bestByNickname = new Map<
    string,
    { nickname: string; score: number; createdAt: Date }
  >();
  for (const row of scores) {
    if (!bestByNickname.has(row.nickname)) {
      bestByNickname.set(row.nickname, {
        nickname: row.nickname,
        score: row.score,
        createdAt: row.createdAt,
      });
    }
  }

  const leaderboard = Array.from(bestByNickname.values())
    .slice(0, 12)
    .map((row, i) => ({
      rank: i + 1,
      nickname: row.nickname,
      score: row.score,
      createdAt: row.createdAt.toISOString(),
    }));

  return Response.json({
    ...game,
    best: best._max.score ?? 0,
    plays,
    leaderboard,
  });
}
