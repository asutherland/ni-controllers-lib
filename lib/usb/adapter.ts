export interface UsbAdapter {
  open(): Promise<unknown>;

  claimInterface(interfaceId: number): Promise<unknown>;

  transferOut(endpointId: number, data: BufferSource): Promise<unknown>;
}

export interface HidAdapter {
  open(): Promise<unknown>;

  write(data: Array<number>): Promise<unknown>;

  onData(callback: (data: Uint8Array) => void): void;
}

export type HidAdapterFactory = (
  vendorId: number,
  productId: number
) => Promise<HidAdapter>;

export type UsbAdapterFactory = (
  vendorId: number,
  productId: number
) => Promise<UsbAdapter>;
