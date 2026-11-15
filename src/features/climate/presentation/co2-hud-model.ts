import type { Co2State } from "../domain";

export interface Co2HudModel {
  ppm: number;
}

export function createCo2HudModel(state: Co2State): Co2HudModel {
  return {
    ppm: state.ppm,
  };
}
