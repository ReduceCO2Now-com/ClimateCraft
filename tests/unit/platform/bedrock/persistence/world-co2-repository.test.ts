import { describe, expect, it, vi, beforeEach } from "vitest";
import { world } from "@minecraft/server";

import { WorldCo2Repository, PersistenceError } from "../../../../../src/platform/bedrock";

vi.mock("@minecraft/server", () => ({
  world: {
    getDynamicProperty: vi.fn(),
    setDynamicProperty: vi.fn(),
  },
}));

describe("WorldCo2Repository", () => {
  let repository: WorldCo2Repository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new WorldCo2Repository();
  });

  describe("load", () => {
    it("should return undefined when no CO2 value exists", () => {
      vi.mocked(world.getDynamicProperty).mockReturnValue(undefined);

      expect(repository.load()).toBeUndefined();
    });

    it("should return the saved CO2 value", () => {
      vi.mocked(world.getDynamicProperty).mockReturnValue(280);

      expect(repository.load()).toBe(280);
    });

    it.each(["280", true, 280.5])("should throw when stored data is invalid: %s", (value) => {
      vi.mocked(world.getDynamicProperty).mockReturnValue(value);

      expect(() => repository.load()).toThrowError(PersistenceError);
      expect(() => repository.load()).toThrowError(
        expect.objectContaining({ code: "CO2_LOAD_FAILED" })
      );
    });

    it("should wrap Minecraft API failures in a PersistenceError", () => {
      const originalError = new Error("Minecraft storage failure");

      vi.mocked(world.getDynamicProperty).mockImplementation(() => {
        throw originalError;
      });

      try {
        repository.load();
        throw new Error("Expected repository.load() to throw.");
      } catch (error) {
        expect(error).toBeInstanceOf(PersistenceError);
        expect((error as PersistenceError).code).toBe("CO2_LOAD_FAILED");
        expect((error as PersistenceError).cause).toBe(originalError);
      }
    });
  });

  describe("save", () => {
    it("should save the CO2 value to the Minecraft world", () => {
      repository.save(350);

      expect(world.setDynamicProperty).toHaveBeenCalledWith("climatecraft:co2", 350);
    });

    it("should wrap Minecraft API failures in a PersistenceError", () => {
      const originalError = new Error("Minecraft storage failure");

      vi.mocked(world.setDynamicProperty).mockImplementation(() => {
        throw originalError;
      });

      try {
        repository.save(350);
        throw new Error("Expected repository.save() to throw.");
      } catch (error) {
        expect(error).toBeInstanceOf(PersistenceError);
        expect((error as PersistenceError).code).toBe("CO2_SAVE_FAILED");
        expect((error as PersistenceError).cause).toBe(originalError);
      }
    });
  });
});
