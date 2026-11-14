export const CLIMATE_ERROR_MESSAGES = {
  CO2_BELOW_MINIMUM: (minimumPpm: number) => `CO₂ cannot be lower than ${minimumPpm} ppm.`,

  INVALID_CO2_VALUE: "The CO₂ value must be a valid whole number.",

  INVALID_CO2_AMOUNT: "The CO₂ change amount must be a non-negative whole number.",
} as const;
