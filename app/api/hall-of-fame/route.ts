import { prisma } from "@/lib/prisma";

export async function GET() {
  const scores = await prisma.score.findMany({
    orderBy: { score: "desc" },
    take: 12,
    include: { game: true },
  });

  const rows = scores.map((row, i) => ({
    rank: i + 1,
    nickname: row.nickname,
    gameId: row.gameId,
    gameTitle: row.game.title,
    score: row.score,
    createdAt: row.createdAt.toISOString(),
  }));

  return Response.json(rows);
}
