"use client";

import { useEffect, useRef } from "react";
import { AsteroidsEngine, CANVAS_WIDTH, CANVAS_HEIGHT } from "./engine";

export interface GameEngineProps {
  paused: boolean;
  active: boolean; // false => detiene el loop y remueve listeners de inmediato, sin volver a notificar
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "Space"]);

export default function AsteroidsGame({
  paused,
  active,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: GameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AsteroidsEngine | null>(null);
  const pausedRef = useRef(paused);
  const handlersRef = useRef<{
    down: (e: KeyboardEvent) => void;
    up: (e: KeyboardEvent) => void;
  } | null>(null);

  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new AsteroidsEngine(canvas, {
      onScoreChange,
      onLivesChange,
      onLevelChange,
      onGameOver,
    });
    engineRef.current = engine;
    engine.start();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!GAME_KEYS.has(e.code)) return;
      if (pausedRef.current) return;
      e.preventDefault();
      engine.handleKeyDown(e.code);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!GAME_KEYS.has(e.code)) return;
      engine.handleKeyUp(e.code);
    };

    handlersRef.current = { down: handleKeyDown, up: handleKeyUp };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      handlersRef.current = null;
      engine.stop();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    if (active) return;
    const handlers = handlersRef.current;
    if (handlers) {
      window.removeEventListener("keydown", handlers.down);
      window.removeEventListener("keyup", handlers.up);
      handlersRef.current = null;
    }
    engineRef.current?.stop();
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}
