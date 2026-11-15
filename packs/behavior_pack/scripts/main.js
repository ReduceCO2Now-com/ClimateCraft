// src/platform/bedrock/bootstrap/climate-bootstrap.ts
import { system, world as world2 } from "@minecraft/server";

// src/features/climate/config/climate.config.ts
var CLIMATE_CONFIG = {
  co2: {
    initialPpm: 280,
    minimumPpm: 0
  }
};

// src/features/climate/domain/co2-error.ts
var Co2DomainError = class extends Error {
  constructor(code, details) {
    super(code);
    this.code = code;
    this.details = details;
    this.name = "Co2DomainError";
  }
};

// src/features/climate/domain/co2-state.ts
function validatePpm(ppm) {
  if (!Number.isSafeInteger(ppm)) {
    throw new Co2DomainError("INVALID_CO2_VALUE", { value: ppm });
  }
  if (ppm < CLIMATE_CONFIG.co2.minimumPpm) {
    throw new Co2DomainError("CO2_BELOW_MINIMUM", {
      value: ppm,
      minimumPpm: CLIMATE_CONFIG.co2.minimumPpm
    });
  }
}
function validateAmount(amount) {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Co2DomainError("INVALID_CO2_AMOUNT", { value: amount });
  }
}
function createCo2State(initialPpm = CLIMATE_CONFIG.co2.initialPpm) {
  validatePpm(initialPpm);
  return { ppm: initialPpm };
}
function increaseCo2(state, amount) {
  validatePpm(state.ppm);
  validateAmount(amount);
  const newPpm = state.ppm + amount;
  if (!Number.isSafeInteger(newPpm)) {
    throw new Co2DomainError("INVALID_CO2_VALUE", { value: newPpm });
  }
  return { ppm: newPpm };
}
function decreaseCo2(state, amount) {
  validatePpm(state.ppm);
  validateAmount(amount);
  return {
    ppm: Math.max(CLIMATE_CONFIG.co2.minimumPpm, state.ppm - amount)
  };
}

// src/features/climate/application/co2-application-error.ts
var Co2ApplicationError = class extends Error {
  constructor(code) {
    super(code);
    this.code = code;
    this.name = "Co2ApplicationError";
  }
};

// src/features/climate/application/co2-service.ts
var Co2Service = class {
  constructor(repository) {
    this.repository = repository;
  }
  initialize() {
    const savedPpm = this.repository.load();
    const initialState = savedPpm === void 0 ? createCo2State() : createCo2State(savedPpm);
    if (savedPpm === void 0) {
      this.repository.save(initialState.ppm);
    }
    this.state = initialState;
    return { ...this.state };
  }
  getState() {
    if (!this.state) {
      throw new Co2ApplicationError("CO2_SERVICE_NOT_INITIALIZED");
    }
    return { ...this.state };
  }
  increase(amount) {
    const nextState = increaseCo2(this.getState(), amount);
    this.repository.save(nextState.ppm);
    this.state = nextState;
    return { ...nextState };
  }
  decrease(amount) {
    const nextState = decreaseCo2(this.getState(), amount);
    this.repository.save(nextState.ppm);
    this.state = nextState;
    return { ...nextState };
  }
};

// src/features/climate/presentation/co2-hud-model.ts
function createCo2HudModel(state) {
  return {
    ppm: state.ppm
  };
}

// src/platform/bedrock/presentation/bedrock-hud.config.ts
var BEDROCK_HUD_CONFIG = {
  refreshIntervalTicks: 40
};

// src/platform/bedrock/presentation/bedrock-co2-hud.ts
function displayCo2Hud(player, model) {
  player.onScreenDisplay.setActionBar(`CO\u2082: ${model.ppm} ppm`);
}

// src/platform/bedrock/persistence/world-co2-repository.ts
import { world } from "@minecraft/server";

// src/platform/bedrock/persistence/persistence-error.ts
var PersistenceError = class extends Error {
  constructor(code, options) {
    super(code, options);
    this.code = code;
    this.name = "PersistenceError";
  }
};

// src/platform/bedrock/persistence/world-co2-repository.ts
var CO2_PROPERTY_KEY = "climatecraft:co2";
var WorldCo2Repository = class {
  load() {
    try {
      const value = world.getDynamicProperty(CO2_PROPERTY_KEY);
      if (value === void 0) {
        return void 0;
      }
      if (typeof value !== "number" || !Number.isSafeInteger(value)) {
        throw new PersistenceError("CO2_LOAD_FAILED");
      }
      return value;
    } catch (error) {
      if (error instanceof PersistenceError) {
        throw error;
      }
      throw new PersistenceError("CO2_LOAD_FAILED", {
        cause: error
      });
    }
  }
  save(ppm) {
    try {
      world.setDynamicProperty(CO2_PROPERTY_KEY, ppm);
    } catch (error) {
      throw new PersistenceError("CO2_SAVE_FAILED", {
        cause: error
      });
    }
  }
};

// src/platform/bedrock/bootstrap/climate-bootstrap.ts
var isClimateRegistered = false;
var climateService;
function initializeClimate() {
  const repository = new WorldCo2Repository();
  const co2Service = new Co2Service(repository);
  co2Service.initialize();
  function renderPlayerHud(player) {
    const model = createCo2HudModel(co2Service.getState());
    displayCo2Hud(player, model);
  }
  function renderAllPlayerHuds() {
    const model = createCo2HudModel(co2Service.getState());
    for (const player of world2.getAllPlayers()) {
      displayCo2Hud(player, model);
    }
  }
  world2.afterEvents.playerSpawn.subscribe(({ player }) => {
    renderPlayerHud(player);
  });
  system.runInterval(renderAllPlayerHuds, BEDROCK_HUD_CONFIG.refreshIntervalTicks);
  renderAllPlayerHuds();
  return co2Service;
}
function registerClimate() {
  if (isClimateRegistered) {
    return;
  }
  isClimateRegistered = true;
  world2.afterEvents.worldLoad.subscribe(() => {
    if (climateService) {
      return;
    }
    climateService = initializeClimate();
  });
}

// src/main.ts
registerClimate();
