import type { Logger } from "../../../shared/utilities/logging";

export const bedrockLogger: Logger = {
  info(message, context) {
    console.info(`[ClimateCraft] ${message}`, context ?? "");
  },

  warn(message, context) {
    console.warn(`[ClimateCraft] ${message}`, context ?? "");
  },

  error(message, error) {
    console.error(`[ClimateCraft] ${message}`, error ?? "");
  },
};
