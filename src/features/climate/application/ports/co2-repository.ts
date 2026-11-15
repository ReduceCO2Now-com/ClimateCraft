export interface Co2Repository {
  load(): number | undefined;
  save(ppm: number): void;
}
