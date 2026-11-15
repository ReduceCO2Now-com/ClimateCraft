import { world } from "@minecraft/server";
import type { Co2Repository } from "../../../features/climate";
import { PersistenceError } from "./persistence-error";

const CO2_PROPERTY_KEY = "climatecraft:co2";

export class WorldCo2Repository implements Co2Repository {
  load(): number | undefined {
    try {
      const value = world.getDynamicProperty(CO2_PROPERTY_KEY);

      if (value === undefined) {
        return undefined;
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
        cause: error,
      });
    }
  }

  save(ppm: number): void {
    try {
      world.setDynamicProperty(CO2_PROPERTY_KEY, ppm);
    } catch (error) {
      throw new PersistenceError("CO2_SAVE_FAILED", {
        cause: error,
      });
    }
  }
}
