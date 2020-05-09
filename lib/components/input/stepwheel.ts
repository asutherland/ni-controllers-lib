import type { EventEmitter } from "events";
import type { Widget } from "./Widget";

export interface StepWheelConfig {
  addr: number;
}

/**
 * Step wheel is a 4-bit clicky rotary encoder.
 */
export class StepWheel implements Widget {
  readonly addr: number;

  step = 0;

  constructor(
    readonly name: string,
    config: StepWheelConfig,
    readonly controller: EventEmitter
  ) {
    this.addr = config.addr;
  }

  parseInput(data: Uint8Array) {
    const newStep = data[this.addr];
    if (this.step === newStep) {
      return;
    }

    // Maschine MK3 wheel goes cyclically from 0 to 15
    const isJumpBackward = this.step === 0 && newStep === 15;
    const isJumpForward = this.step === 15 && newStep === 0;

    const isIncrement =
      (this.step < newStep && !isJumpBackward) || isJumpForward;

    this.controller.emit(`${this.name}:step`, {
      direction: isIncrement ? 1 : -1,
    });

    this.step = newStep;
  }
}
