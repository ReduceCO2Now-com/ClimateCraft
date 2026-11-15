import { system, world } from "@minecraft/server";
import type { Player } from "@minecraft/server";

import { Co2Service, createCo2HudModel } from "../../../features/climate";

import { BEDROCK_HUD_CONFIG } from "../presentation/bedrock-hud.config";
import { displayCo2Hud } from "../presentation";
import { WorldCo2Repository } from "../persistence";

let isClimateRegistered = false;
let climateService: Co2Service | undefined;

function initializeClimate(): Co2Service {
  const repository = new WorldCo2Repository();
  const co2Service = new Co2Service(repository);

  co2Service.initialize();

  function renderPlayerHud(player: Player): void {
    const model = createCo2HudModel(co2Service.getState());
    displayCo2Hud(player, model);
  }

  function renderAllPlayerHuds(): void {
    const model = createCo2HudModel(co2Service.getState());

    for (const player of world.getAllPlayers()) {
      displayCo2Hud(player, model);
    }
  }

  world.afterEvents.playerSpawn.subscribe(({ player }) => {
    renderPlayerHud(player);
  });

  system.runInterval(renderAllPlayerHuds, BEDROCK_HUD_CONFIG.refreshIntervalTicks);

  renderAllPlayerHuds();

  return co2Service;
}

export function registerClimate(): void {
  if (isClimateRegistered) {
    return;
  }

  isClimateRegistered = true;

  world.afterEvents.worldLoad.subscribe(() => {
    if (climateService) {
      return;
    }

    climateService = initializeClimate();
  });
}
