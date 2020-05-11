import * as NodeHid from "node-hid";
import * as NodeUsb from "usb";
import type {
  HidAdapter,
  HidAdapterFactory,
  UsbAdapter,
  UsbAdapterFactory,
} from "./adapter";

class NodeUsbAdapter implements UsbAdapter {
  nInterface: NodeUsb.Interface | null = null;

  constructor(readonly nDevice: NodeUsb.Device) {}

  async open() {
    return this.nDevice.open();
  }

  async claimInterface(interfaceId: number) {
    this.nInterface = this.nDevice.interface(interfaceId);
    this.nInterface.claim();
  }

  async transferOut(endpointId: number, data: BufferSource) {
    if (this.nInterface == null) {
      throw new Error(
        "The NodeUsbAdapter claimInterface method should be called before transferOut"
      );
    }

    const endpoint = this.nInterface.endpoint(
      endpointId
    ) as NodeUsb.OutEndpoint;

    return await new Promise((resolve, reject) => {
      endpoint.transfer(data as Buffer, (error) => {
        if (error != null) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

class NodeHidAdapter implements HidAdapter {
  constructor(readonly nDevice: NodeHid.HID) {
    this.nDevice.on("error", console.error);
  }

  open() {
    // the node implementation doesn't need to be opened
    return Promise.resolve();
  }

  async write(data: Array<number>) {
    return this.nDevice.write(data);
  }

  onData(callback: (data: Uint8Array) => void) {
    this.nDevice.on("data", callback);
  }
}

export const createNodeUsbAdapter: UsbAdapterFactory = async (
  vendorId: number,
  productId: number
) => new NodeUsbAdapter(NodeUsb.findByIds(vendorId, productId));

export const createNodeHidAdapter: HidAdapterFactory = async (
  vendorId: number,
  productId: number
) => new NodeHidAdapter(new NodeHid.HID(vendorId, productId));
