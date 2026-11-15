import type { Player } from "@minecraft/server";
import type { Co2HudModel } from "../../../features/climate";

export function displayCo2Hud(player: Player, model: Co2HudModel): void {
  player.onScreenDisplay.setActionBar(`CO₂: ${model.ppm} ppm`);
}
