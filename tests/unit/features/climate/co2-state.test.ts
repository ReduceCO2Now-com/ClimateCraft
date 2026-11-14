import { describe, expect, it } from "vitest";
import {
  CLIMATE_CONFIG,
  Co2DomainError,
  createCo2State,
  decreaseCo2,
  increaseCo2,
} from "../../../../src/features/climate";

function expectCo2Error(action: () => unknown, expectedCode: string): void {
  try {
    action();
    throw new Error("Expected a CO2 domain error, but none was thrown.");
  } catch (error) {
    expect(error).toBeInstanceOf(Co2DomainError);
    expect((error as Co2DomainError).code).toBe(expectedCode);
  }
}

describe("CO2 state", () => {
  it("initializes with the configured default CO2 value", () => {
    expect(createCo2State()).toEqual({
      ppm: CLIMATE_CONFIG.co2.initialPpm,
    });
  });

  it("initializes with a custom CO2 value", () => {
    expect(createCo2State(400)).toEqual({ ppm: 400 });
  });

  it("increases CO2", () => {
    expect(increaseCo2(createCo2State(), 20).ppm).toBe(300);
  });

  it("decreases CO2", () => {
    expect(decreaseCo2(createCo2State(), 10).ppm).toBe(270);
  });

  it("does not allow CO2 to fall below the configured minimum", () => {
    const state = createCo2State(5);

    expect(decreaseCo2(state, 10).ppm).toBe(CLIMATE_CONFIG.co2.minimumPpm);
  });

  it("rejects an initial CO2 value below the configured minimum", () => {
    expectCo2Error(() => createCo2State(CLIMATE_CONFIG.co2.minimumPpm - 1), "CO2_BELOW_MINIMUM");
  });

  it("rejects negative CO2 change amounts", () => {
    expectCo2Error(() => increaseCo2(createCo2State(), -1), "INVALID_CO2_AMOUNT");

    expectCo2Error(() => decreaseCo2(createCo2State(), -1), "INVALID_CO2_AMOUNT");
  });

  it("rejects decimal CO2 values and amounts", () => {
    expectCo2Error(() => createCo2State(280.5), "INVALID_CO2_VALUE");

    expectCo2Error(() => increaseCo2(createCo2State(), 1.5), "INVALID_CO2_AMOUNT");
  });

  it("does not mutate the original state", () => {
    const original = createCo2State(280);

    increaseCo2(original, 20);

    expect(original.ppm).toBe(280);
  });
});
