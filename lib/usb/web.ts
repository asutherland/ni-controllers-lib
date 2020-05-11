import type {
  HidAdapter,
  HidAdapterFactory,
  UsbAdapter,
  UsbAdapterFactory,
} from "./adapter";

class WebUsbAdapter implements UsbAdapter {
  constructor(readonly nDevice: USBDevice) {}

  async open() {
    return await this.nDevice.open();
  }

  async claimInterface(interfaceId: number) {
    return await this.nDevice.claimInterface(interfaceId);
  }

  async transferOut(endpointId: number, data: BufferSource) {
    return await this.nDevice.transferOut(endpointId, data);
  }
}

const WebHidAdapterHandler = Symbol("WebHidAdapterHandler");
class WebHidAdapter implements HidAdapter {
  constructor(readonly nDevice: HIDDevice) {}

  async open() {
    return await this.nDevice.open();
  }

  async write([reportId, ...data]: Array<number>) {
    return await this.nDevice.sendReport(reportId, new Uint8Array(data));
  }

  onData(callback: (data: Uint8Array) => void) {
    const handler = ({ reportId, data }: HIDInputReportEvent) => {
      const tmp = new Uint8Array(data.byteLength + 1);
      tmp.set([reportId], 0);
      tmp.set(new Uint8Array(data.buffer), 1);
      callback(tmp);
    };

    // keep the handler around because the device seems to not hold a strong
    // reference to it which allows Chrome to garbage collect it
    // cf. https://bugs.chromium.org/p/chromium/issues/detail?id=890096#c51
    ((globalThis as unknown) as { [WebHidAdapterHandler]: unknown })[
      WebHidAdapterHandler
    ] = handler;

    this.nDevice.addEventListener("inputreport", handler);
  }
}

export const createWebUsbAdapter: UsbAdapterFactory = async (
  vendorId: number,
  productId: number
) =>
  new WebUsbAdapter(
    await navigator.usb.requestDevice({
      filters: [{ vendorId, productId }],
    })
  );

export const createWebHidAdapter: HidAdapterFactory = async (
  vendorId: number,
  productId: number
) =>
  new WebHidAdapter(
    (
      await navigator.hid.requestDevice({
        filters: [{ vendorId, productId }],
      })
    )[0]
  );
