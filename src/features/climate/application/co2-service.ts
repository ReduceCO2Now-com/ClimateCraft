import { createCo2State, increaseCo2, decreaseCo2 } from "../domain";
import type { Co2State } from "../domain";
import type { Co2Repository } from "./ports/co2-repository";
import { Co2ApplicationError } from "./co2-application-error";

export class Co2Service {
  private state: Co2State | undefined;

  constructor(private readonly repository: Co2Repository) {}

  initialize(): Co2State {
    const savedPpm = this.repository.load();

    const initialState = savedPpm === undefined ? createCo2State() : createCo2State(savedPpm);

    if (savedPpm === undefined) {
      this.repository.save(initialState.ppm);
    }

    this.state = initialState;

    return { ...this.state };
  }

  getState(): Co2State {
    if (!this.state) {
      throw new Co2ApplicationError("CO2_SERVICE_NOT_INITIALIZED");
    }

    return { ...this.state };
  }

  increase(amount: number): Co2State {
    const nextState = increaseCo2(this.getState(), amount);

    this.repository.save(nextState.ppm);
    this.state = nextState;

    return { ...nextState };
  }

  decrease(amount: number): Co2State {
    const nextState = decreaseCo2(this.getState(), amount);

    this.repository.save(nextState.ppm);
    this.state = nextState;

    return { ...nextState };
  }
}
