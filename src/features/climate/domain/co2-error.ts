export type Co2ErrorCode = "CO2_BELOW_MINIMUM" | "INVALID_CO2_VALUE" | "INVALID_CO2_AMOUNT";

export class Co2DomainError extends Error {
  constructor(
    public readonly code: Co2ErrorCode,
    public readonly details?: {
      value?: number;
      minimumPpm?: number;
    }
  ) {
    super(code);
    this.name = "Co2DomainError";
  }
}
