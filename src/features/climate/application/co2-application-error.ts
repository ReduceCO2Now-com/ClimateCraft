export type Co2ApplicationErrorCode = "CO2_SERVICE_NOT_INITIALIZED";

export class Co2ApplicationError extends Error {
  constructor(public readonly code: Co2ApplicationErrorCode) {
    super(code);
    this.name = "Co2ApplicationError";
  }
}
