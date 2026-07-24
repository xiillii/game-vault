import type { ComponentType } from "react";
import AsteroidsGame, { type GameEngineProps } from "./asteroids/AsteroidsGame";

export const GAME_COMPONENTS: Record<string, ComponentType<GameEngineProps>> = {
  asteroides: AsteroidsGame,
};
