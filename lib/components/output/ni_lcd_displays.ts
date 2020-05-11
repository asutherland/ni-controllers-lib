/*
 * Handles Native Instrument LCD display protocol as used by the Traktor D2 and
 * Maschine Mk3.  May be further generalized in the future.
 *
 * Note that this isn't an HID protocol so we use 'usb' instead of 'node-hid'
 */
import { UsbAdapter } from "../../usb/adapter";

const HEADER_LENGTH = 16;
const COMMAND_LENGTH = 4;
const PIXEL_LENGTH = 2;
const DATA_START = HEADER_LENGTH + COMMAND_LENGTH;

/**
 * Converts a 3 bytes rgb color value (0 -> 255) to a 16 bit value.
 */
const toRgb565 = (red: number, green: number, blue: number) =>
  ((red & 0xf8) << 8) + ((green & 0xfc) << 3) + (blue >> 3);

function fillHeader(
  view: DataView,
  displayNum: number,
  x: number,
  y: number,
  width: number,
  height: number
) {
  view.setUint8(0, 0x84);
  // 0x2 is 0
  view.setUint8(2, displayNum);
  view.setUint8(3, 0x60);
  // last 4 bytes are 0x0 too.

  view.setUint16(8, x);
  view.setUint16(10, y);
  view.setUint16(12, width);
  view.setUint16(14, height);
}

function fillTransmitCommand(view: DataView, numPixels: number) {
  const halfPixels = numPixels / 2;
  // We want a big endian 24-bit value, so write it 32-bit then clobber the MSB
  // with the command.
  view.setUint32(0, halfPixels, false);
  view.setUint8(0, 0);
}

export interface LcdDisplaysConfig {
  interface: number;
  endpoint: number;
  numDisplays: number;
  eachHeight: number;
  eachWidth: number;
}

export class LCDDisplays {
  readonly device: UsbAdapter;
  readonly endpointId: number;
  readonly numDisplays: number;
  readonly width: number;
  readonly height: number;

  constructor({
    device,
    displayConfig,
  }: {
    device: UsbAdapter;
    displayConfig: LcdDisplaysConfig;
  }) {
    this.device = device;
    this.endpointId = displayConfig.endpoint;

    this.numDisplays = displayConfig.numDisplays;
    this.width = displayConfig.eachWidth;
    this.height = displayConfig.eachHeight;
  }

  createDisplayBuffer() {
    return new ArrayBuffer(
      HEADER_LENGTH +
        COMMAND_LENGTH * 3 +
        this.width * this.height * PIXEL_LENGTH
    );
  }

  /**
   * Given an existing Uint8Array that contains data to display, blit it to the
   * given display.
   *
   * @param displayNum the index of the screen to draw to
   * @param rgbData the array containing the data in RGB order, as integers in
   * the range 0 to 255.
   * @param buf if given the buffer is not be created by this method and therefor
   * can be reused from call to call to reduce allocation
   */
  async paintDisplay(
    displayNum: number,
    rgbData: Uint8Array,
    buf = this.createDisplayBuffer()
  ) {
    const allData = new DataView(buf);
    const pixelCount = this.width * this.height;

    fillHeader(allData, displayNum, 0, 0, this.width, this.height);
    fillTransmitCommand(new DataView(buf, HEADER_LENGTH), pixelCount);

    const dataStop = DATA_START + pixelCount * PIXEL_LENGTH;

    for (let idxPixel = 0; idxPixel < pixelCount; idxPixel++) {
      const rgbOffset = idxPixel * 3;
      const r = rgbData[rgbOffset];
      const g = rgbData[rgbOffset + 1];
      const b = rgbData[rgbOffset + 2];

      // set the 16 bits pixel data in a big endian way
      allData.setUint16(
        DATA_START + idxPixel * PIXEL_LENGTH,
        toRgb565(r, g, b)
      );
    }

    // the blit command
    allData.setUint8(dataStop, 0x03);
    // the end command
    allData.setUint8(dataStop + COMMAND_LENGTH, 0x40);

    await this.device.transferOut(this.endpointId, allData.buffer);
  }
}
