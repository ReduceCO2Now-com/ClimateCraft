import { describe, expect, it } from "vitest";

import { Co2ApplicationError, Co2Service } from "../../../../src/features/climate";

import type { Co2Repository } from "../../../../src/features/climate";

class FakeCo2Repository implements Co2Repository {
  storedPpm: number | undefined;
  shouldFailOnLoad = false;
  shouldFailOnSave = false;

  constructor(initialValue?: number) {
    this.storedPpm = initialValue;
  }

  load(): number | undefined {
    if (this.shouldFailOnLoad) {
      throw new Error("Simulated load failure");
    }

    return this.storedPpm;
  }

  save(ppm: number): void {
    if (this.shouldFailOnSave) {
      throw new Error("Simulated save failure");
    }

    this.storedPpm = ppm;
  }
}

describe("Co2Service", () => {
  describe("initialize", () => {
    it("should initialize with the default CO2 value when nothing is saved", () => {
      const repository = new FakeCo2Repository();
      const service = new Co2Service(repository);

      const state = service.initialize();

      expect(state.ppm).toBe(280);
      expect(repository.storedPpm).toBe(280);
    });

    it("should restore the previously saved CO2 value", () => {
      const repository = new FakeCo2Repository(420);
      const service = new Co2Service(repository);

      const state = service.initialize();

      expect(state.ppm).toBe(420);
      expect(repository.storedPpm).toBe(420);
    });

    it("should propagate repository load failures", () => {
      const repository = new FakeCo2Repository();
      repository.shouldFailOnLoad = true;

      const service = new Co2Service(repository);

      expect(() => service.initialize()).toThrow("Simulated load failure");
    });

    it("should remain uninitialized if the initial save fails", () => {
      const repository = new FakeCo2Repository();
      repository.shouldFailOnSave = true;

      const service = new Co2Service(repository);

      expect(() => service.initialize()).toThrow("Simulated save failure");

      expect(() => service.getState()).toThrow(Co2ApplicationError);
    });
  });

  describe("getState", () => {
    it("should throw when the service has not been initialized", () => {
      const service = new Co2Service(new FakeCo2Repository());

      expect(() => service.getState()).toThrow(Co2ApplicationError);
    });

    it("should return a copy of the current state", () => {
      const service = new Co2Service(new FakeCo2Repository());
      service.initialize();

      const state = service.getState();
      state.ppm = 999;

      expect(service.getState().ppm).toBe(280);
    });
  });

  describe("increase", () => {
    it("should increase CO2 and persist the new value", () => {
      const repository = new FakeCo2Repository(280);
      const service = new Co2Service(repository);
      service.initialize();

      const state = service.increase(20);

      expect(state.ppm).toBe(300);
      expect(repository.storedPpm).toBe(300);
      expect(service.getState().ppm).toBe(300);
    });

    it("should not update the in-memory state if saving fails", () => {
      const repository = new FakeCo2Repository(280);
      const service = new Co2Service(repository);
      service.initialize();

      repository.shouldFailOnSave = true;

      expect(() => service.increase(20)).toThrow("Simulated save failure");

      expect(service.getState().ppm).toBe(280);
      expect(repository.storedPpm).toBe(280);
    });
  });

  describe("decrease", () => {
    it("should decrease CO2 and persist the new value", () => {
      const repository = new FakeCo2Repository(300);
      const service = new Co2Service(repository);
      service.initialize();

      const state = service.decrease(20);

      expect(state.ppm).toBe(280);
      expect(repository.storedPpm).toBe(280);
    });

    it("should not allow CO2 to go below the configured minimum", () => {
      const repository = new FakeCo2Repository(100);
      const service = new Co2Service(repository);
      service.initialize();

      const state = service.decrease(500);

      expect(state.ppm).toBe(0);
      expect(repository.storedPpm).toBe(0);
    });
  });
});
