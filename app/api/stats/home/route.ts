import { prisma } from "@/lib/prisma";

export async function GET() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [gamesCount, playsCount, recent, today] = await Promise.all([
    prisma.game.count(),
    prisma.score.count(),
    prisma.score.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { game: true },
    }),
    prisma.score.findMany({
      where: { createdAt: { gte: startOfToday } },
      orderBy: { score: "desc" },
      take: 6,
    }),
  ]);

  const recentScores = recent.map((row) => ({
    nickname: row.nickname,
    gameId: row.gameId,
    gameTitle: row.game.title,
    score: row.score,
    createdAt: row.createdAt.toISOString(),
  }));

  const topToday = today.map((row, i) => ({
    rank: i + 1,
    nickname: row.nickname,
    score: row.score,
  }));

  return Response.json({ gamesCount, playsCount, recentScores, topToday });
}
