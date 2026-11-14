import { CLIMATE_CONFIG } from "../config";
import { Co2DomainError } from "./co2-error";

export interface Co2State {
  ppm: number;
}

function validatePpm(ppm: number): void {
  if (!Number.isSafeInteger(ppm)) {
    throw new Co2DomainError("INVALID_CO2_VALUE", { value: ppm });
  }

  if (ppm < CLIMATE_CONFIG.co2.minimumPpm) {
    throw new Co2DomainError("CO2_BELOW_MINIMUM", {
      value: ppm,
      minimumPpm: CLIMATE_CONFIG.co2.minimumPpm,
    });
  }
}

function validateAmount(amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Co2DomainError("INVALID_CO2_AMOUNT", { value: amount });
  }
}

export function createCo2State(initialPpm: number = CLIMATE_CONFIG.co2.initialPpm): Co2State {
  validatePpm(initialPpm);

  return { ppm: initialPpm };
}

export function increaseCo2(state: Co2State, amount: number): Co2State {
  validatePpm(state.ppm);
  validateAmount(amount);

  const newPpm = state.ppm + amount;

  if (!Number.isSafeInteger(newPpm)) {
    throw new Co2DomainError("INVALID_CO2_VALUE", { value: newPpm });
  }

  return { ppm: newPpm };
}

export function decreaseCo2(state: Co2State, amount: number): Co2State {
  validatePpm(state.ppm);
  validateAmount(amount);

  return {
    ppm: Math.max(CLIMATE_CONFIG.co2.minimumPpm, state.ppm - amount),
  };
}
