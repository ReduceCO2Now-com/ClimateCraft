import { beforeEach, describe, expect, it, vi } from "vitest";

import { BEDROCK_HUD_CONFIG } from "../../../../../src/platform/bedrock/presentation";

const mocks = vi.hoisted(() => {
  const worldLoadListeners: Array<() => void> = [];

  const playerSpawnListeners: Array<(event: { player: unknown }) => void> = [];

  const intervalCallbacks: Array<() => void> = [];

  const players: Array<{
    onScreenDisplay: {
      setActionBar: (text: string) => void;
    };
  }> = [];

  const dynamicProperties = new Map<string, unknown>();

  const world = {
    afterEvents: {
      worldLoad: {
        subscribe: vi.fn((callback: () => void) => {
          worldLoadListeners.push(callback);
        }),
      },

      playerSpawn: {
        subscribe: vi.fn((callback: (event: { player: unknown }) => void) => {
          playerSpawnListeners.push(callback);
        }),
      },
    },

    getDynamicProperty: vi.fn((key: string) => {
      return dynamicProperties.get(key);
    }),

    setDynamicProperty: vi.fn((key: string, value: unknown) => {
      dynamicProperties.set(key, value);
    }),

    getAllPlayers: vi.fn(() => players),
  };

  const system = {
    runInterval: vi.fn((callback: () => void, _intervalTicks: number) => {
      intervalCallbacks.push(callback);
      return 1;
    }),
  };

  return {
    world,
    system,
    worldLoadListeners,
    playerSpawnListeners,
    intervalCallbacks,
    players,
    dynamicProperties,
  };
});

vi.mock("@minecraft/server", () => ({
  world: mocks.world,
  system: mocks.system,
}));

describe("Climate bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mocks.worldLoadListeners.length = 0;
    mocks.playerSpawnListeners.length = 0;
    mocks.intervalCallbacks.length = 0;
    mocks.players.length = 0;
    mocks.dynamicProperties.clear();
  });

  async function loadBootstrap() {
    return import("../../../../../src/platform/bedrock/bootstrap/climate-bootstrap");
  }

  function createMockPlayer() {
    const player = {
      onScreenDisplay: {
        setActionBar: vi.fn(),
      },
    };

    mocks.players.push(player);

    return player;
  }

  async function loadWorld() {
    const { registerClimate } = await loadBootstrap();

    registerClimate();

    mocks.worldLoadListeners[0]!();
  }

  it("registers the world load listener only once", async () => {
    const { registerClimate } = await loadBootstrap();

    registerClimate();
    registerClimate();

    expect(mocks.world.afterEvents.worldLoad.subscribe).toHaveBeenCalledTimes(1);

    expect(mocks.worldLoadListeners).toHaveLength(1);
  });

  it("initializes CO2 with the default value in a new world", async () => {
    await loadWorld();

    expect(mocks.world.setDynamicProperty).toHaveBeenCalledWith("climatecraft:co2", 280);
  });

  it("restores the saved CO2 value instead of overwriting it", async () => {
    mocks.dynamicProperties.set("climatecraft:co2", 420);

    const player = createMockPlayer();

    await loadWorld();

    expect(mocks.world.setDynamicProperty).not.toHaveBeenCalled();

    expect(player.onScreenDisplay.setActionBar).toHaveBeenCalledWith("CO₂: 420 ppm");
  });

  it("registers the player spawn listener", async () => {
    await loadWorld();

    expect(mocks.world.afterEvents.playerSpawn.subscribe).toHaveBeenCalledTimes(1);

    expect(mocks.playerSpawnListeners).toHaveLength(1);
  });

  it("displays the CO2 value when a player spawns", async () => {
    await loadWorld();

    const player = createMockPlayer();

    mocks.playerSpawnListeners[0]!({ player });

    expect(player.onScreenDisplay.setActionBar).toHaveBeenCalledWith("CO₂: 280 ppm");
  });

  it("registers periodic HUD refresh", async () => {
    await loadWorld();

    expect(mocks.system.runInterval).toHaveBeenCalledTimes(1);

    expect(mocks.system.runInterval).toHaveBeenCalledWith(
      expect.any(Function),
      BEDROCK_HUD_CONFIG.refreshIntervalTicks
    );
  });

  it("refreshes the HUD for all online players", async () => {
    await loadWorld();

    const firstPlayer = createMockPlayer();
    const secondPlayer = createMockPlayer();

    mocks.intervalCallbacks[0]!();

    expect(firstPlayer.onScreenDisplay.setActionBar).toHaveBeenCalledWith("CO₂: 280 ppm");

    expect(secondPlayer.onScreenDisplay.setActionBar).toHaveBeenCalledWith("CO₂: 280 ppm");
  });

  it("does not initialize Climate twice when world load fires again", async () => {
    const { registerClimate } = await loadBootstrap();

    registerClimate();

    const worldLoadCallback = mocks.worldLoadListeners[0]!;

    worldLoadCallback();
    worldLoadCallback();

    expect(mocks.world.setDynamicProperty).toHaveBeenCalledTimes(1);

    expect(mocks.system.runInterval).toHaveBeenCalledTimes(1);

    expect(mocks.world.afterEvents.playerSpawn.subscribe).toHaveBeenCalledTimes(1);
  });
});
