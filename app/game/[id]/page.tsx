"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Game } from "@/lib/data";

interface GameDetail extends Game {
  leaderboard: {
    rank: number;
    nickname: string;
    score: number;
    createdAt: string;
  }[];
}

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setGame(null);
    setNotFound(false);
    fetch(`/api/games/${id}`).then(async (res) => {
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      setGame(await res.json());
    });
  }, [id]);

  if (notFound) return null;
  if (!game) return null;

  return (
    <main className="av-main av-detail fade-in">
      <div>
        <div className="detail-cover">
          <div className={"cover-bg " + game.cover}></div>
        </div>
        <div style={{ marginTop: 20 }} className="detail-info">
          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.long}</p>
          <div className="stat-strip">
            <div>
              <div className="l">Partidas</div>
              <div className="v">{game.plays}</div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div
                className="v"
                style={{
                  color: "var(--magenta)",
                  textShadow: "0 0 6px rgba(255,0,110,0.5)",
                }}
              >
                {game.best.toLocaleString("es-ES")}
              </div>
            </div>
            <div>
              <div className="l">Dificultad</div>
              <div
                className="v"
                style={{
                  color: "var(--yellow)",
                  textShadow: "0 0 6px rgba(245,255,0,0.5)",
                }}
              >
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>
          <div className="detail-actions">
            <Link href={`/game/${game.id}/play`} className="btn xl pulse">
              ▶ JUGAR AHORA
            </Link>
            <Link href="/" className="btn ghost lg">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          {game.leaderboard.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 24,
                color: "var(--ink-faint)",
              }}
            >
              AÚN SIN PUNTUACIONES
            </div>
          ) : (
            game.leaderboard.map((r, i) => (
              <div
                key={r.nickname}
                className={
                  "lb-row" +
                  (i === 0
                    ? " top1"
                    : i === 1
                      ? " top2"
                      : i === 2
                        ? " top3"
                        : "")
                }
              >
                <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
                <div className="pl">
                  {r.nickname}
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ink-faint)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {new Date(r.createdAt).toLocaleDateString("es-ES")}
                  </div>
                </div>
                <div className="sc">{r.score.toLocaleString("es-ES")}</div>
              </div>
            ))
          )}
        </div>
      </aside>
    </main>
  );
}
