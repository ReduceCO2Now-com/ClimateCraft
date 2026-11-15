export type PersistenceErrorCode = "CO2_LOAD_FAILED" | "CO2_SAVE_FAILED";

export class PersistenceError extends Error {
  constructor(
    public readonly code: PersistenceErrorCode,
    options?: ErrorOptions
  ) {
    super(code, options);
    this.name = "PersistenceError";
  }
}
