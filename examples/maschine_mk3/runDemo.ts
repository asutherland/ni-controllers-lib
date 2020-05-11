import jpeg, { BufferLike } from "jpeg-js";

import { MaschineMk3 } from "../../lib/maschine_mk3";

export const runDemo = (mk3: MaschineMk3, jpegData: BufferLike) =>
  mk3.init().then(() => {
    // ## Group Pads: Display colors with transient "flash" on press.
    for (let i = 1; i <= 8; i++) {
      const li = i;
      const li0 = li - 1;
      const name = `g${i}`;
      const led = mk3.indexed_leds[name];
      led.setColorByNumberHelper(li0, true, false);
      mk3.on(`${name}:pressed`, () => {
        led.setColorByNumberHelper(li0, true, true);
      });
      mk3.on(`${name}:released`, () => {
        led.setColorByNumberHelper(li0, true, false);
      });
    }

    // ## Big Pads: One color per pad, vary brightness based on pressure.
    for (let i = 1; i <= 16; i++) {
      const li = i;
      const li0 = li - 1;
      const name = `p${i}`;
      const led = mk3.indexed_leds[name];
      led.setColorByNumberHelper(li0, false, false);
      // note, could alternately do a single listen on "p:pressure", which passes
      // the index.
      mk3.on(`${name}:pressure`, (pressure) => {
        led.setColorByNumberHelper(
          li0,
          pressure > 2048,
          pressure % 2048 > 1024
        );
      });
    }

    // ## Knobs: On touch, override the pads and do RGB/spread for each
    for (let i = 1; i <= 8; i++) {
      mk3.on(`knobTouch${i}`, (touched) => {});
    }

    mk3.on(`stepper:step`, ({ direction }) => {
      console.log(`stepper: ${direction < 0 ? "decrement" : "increment"}`);
    });

    for (let i = 1; i <= 2; i++) {
      mk3.on(`touchStrip${i}:changed`, ({ value, timestamp }) => {
        const hexTime = timestamp.toString(16).padStart(4, "0");
        console.log(`touchStrip ${i}: ${hexTime} ${value}`);
      });
    }

    if (mk3.displays) {
      const { data: rgbData } = jpeg.decode(jpegData, {
        useTArray: true,
        formatAsRGBA: false,
      });

      mk3.displays?.paintDisplay(0, rgbData).catch(console.error);
    }

    console.log("init completing, stuff should theoretically happen now.");
  });
