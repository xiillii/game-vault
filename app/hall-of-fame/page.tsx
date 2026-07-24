"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Game } from "@/lib/data";

interface AvUser {
  name: string;
}

interface GameDetail extends Game {
  leaderboard: {
    rank: number;
    nickname: string;
    score: number;
    createdAt: string;
  }[];
}

interface HallOfFameRow {
  rank: number;
  nickname: string;
  gameId: string;
  gameTitle: string;
  score: number;
  createdAt: string;
}

export default function HallOfFamePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [tab, setTab] = useState<string | null>(null);
  const [gameDetail, setGameDetail] = useState<GameDetail | null>(null);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameRow[]>([]);
  const [user, setUser] = useState<AvUser | null>(null);

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("av_user") || "null"));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetch("/api/games")
      .then((r) => r.json())
      .then((data: Game[]) => {
        setGames(data);
        setTab((current) => current ?? data[0]?.id ?? null);
      });
    fetch("/api/hall-of-fame")
      .then((r) => r.json())
      .then(setHallOfFame);
  }, []);

  useEffect(() => {
    if (!tab) return;
    setGameDetail(null);
    fetch(`/api/games/${tab}`)
      .then((r) => r.json())
      .then(setGameDetail);
  }, [tab]);

  const game = games.find((g) => g.id === tab) ?? null;
  const youRank = user && tab ? Math.floor(8 + (tab.length % 4)) : null;
  const youScore = user && tab ? 96000 - tab.length * 1200 : null;

  return (
    <main className="av-main av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="hall-tabs">
        {games.map((g) => (
          <button
            key={g.id}
            className={"chip" + (tab === g.id ? " active" : "")}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {hallOfFame.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "var(--ink-faint)",
          }}
        >
          AÚN SIN PUNTUACIONES
        </div>
      ) : (
        <div className="podium">
          {hallOfFame[1] && (
            <div className="podium-slot silver">
              <div className="rank-num">02</div>
              <div className="name">{hallOfFame[1].nickname}</div>
              <div className="score">
                {hallOfFame[1].score.toLocaleString("es-ES")}
              </div>
              <div className="date">
                {new Date(hallOfFame[1].createdAt).toLocaleDateString("es-ES")}
              </div>
            </div>
          )}
          <div className="podium-slot gold">
            <div
              className="pixel"
              style={{
                fontSize: 9,
                color: "var(--gold)",
                letterSpacing: "0.18em",
              }}
            >
              CAMPEÓN
            </div>
            <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
              01
            </div>
            <div className="name">{hallOfFame[0].nickname}</div>
            <div className="score" style={{ fontSize: 20 }}>
              {hallOfFame[0].score.toLocaleString("es-ES")}
            </div>
            <div className="date">
              {new Date(hallOfFame[0].createdAt).toLocaleDateString("es-ES")}
            </div>
          </div>
          {hallOfFame[2] && (
            <div className="podium-slot bronze">
              <div className="rank-num">03</div>
              <div className="name">{hallOfFame[2].nickname}</div>
              <div className="score">
                {hallOfFame[2].score.toLocaleString("es-ES")}
              </div>
              <div className="date">
                {new Date(hallOfFame[2].createdAt).toLocaleDateString("es-ES")}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {(gameDetail?.leaderboard.length ?? 0) === 0 ? (
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
          gameDetail!.leaderboard.map((r, i) => (
            <div
              key={r.nickname + i}
              className={
                "tr" +
                (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "")
              }
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
              <div className="pl">{r.nickname}</div>
              <div className="sc">{r.score.toLocaleString("es-ES")}</div>
              <div className="dt">
                {new Date(r.createdAt).toLocaleDateString("es-ES")}
              </div>
            </div>
          ))
        )}
        {user && game && (
          <>
            <div className="tr you-label">▸ TU MEJOR MARCA EN {game.title}</div>
            <div
              className="tr you"
              style={{
                animationDelay: `${(gameDetail?.leaderboard.length ?? 0) * 50 + 50}ms`,
              }}
            >
              <div className="rk" style={{ color: "var(--yellow)" }}>
                #{String(youRank).padStart(2, "0")}
              </div>
              <div className="pl" style={{ color: "var(--yellow)" }}>
                {user.name}
              </div>
              <div
                className="sc"
                style={{
                  color: "var(--yellow)",
                  textShadow: "0 0 6px rgba(245,255,0,0.5)",
                }}
              >
                {(youScore || 9999).toLocaleString("es-ES")}
              </div>
              <div className="dt">11/05/2026</div>
            </div>
          </>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </main>
  );
}
