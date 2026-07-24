import { prisma } from "@/lib/prisma";

export async function GET() {
  const games = await prisma.game.findMany();

  const items = await Promise.all(
    games.map(async (game) => {
      const [best, plays] = await Promise.all([
        prisma.score.aggregate({
          where: { gameId: game.id },
          _max: { score: true },
        }),
        prisma.score.count({ where: { gameId: game.id } }),
      ]);

      return {
        ...game,
        best: best._max.score ?? 0,
        plays,
      };
    }),
  );

  return Response.json(items);
}
