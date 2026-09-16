"use client";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat, type Result } from "@zxing/library";
import { isDangerousPayload } from "./registry";

export interface ScanResult {
  format: string;
  value: string;
  isQr: boolean;
  isUnsafe: boolean;
}

let readerInstance: BrowserMultiFormatReader | null = null;

function getReader(): BrowserMultiFormatReader {
  if (readerInstance) return readerInstance;
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.PDF_417,
    BarcodeFormat.AZTEC,
  ]);
  readerInstance = new BrowserMultiFormatReader(hints);
  return readerInstance;
}

function toScanResult(result: Result): ScanResult {
  const format = BarcodeFormat[result.getBarcodeFormat()];
  const value = result.getText();
  return {
    format,
    value,
    isQr: format === "QR_CODE",
    isUnsafe: isDangerousPayload(value),
  };
}

export async function scanImageFile(file: File): Promise<ScanResult> {
  const url = URL.createObjectURL(file);
  try {
    const reader = getReader();
    const result = await reader.decodeFromImageUrl(url);
    return toScanResult(result);
  } catch {
    throw new Error("No barcode or QR code was found in this image.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function scanFromVideoDevice(
  videoElement: HTMLVideoElement,
  deviceId: string | undefined,
  onResult: (result: ScanResult) => void
): Promise<() => void> {
  const reader = getReader();
  const controls = await reader.decodeFromVideoDevice(deviceId, videoElement, (result) => {
    if (result) onResult(toScanResult(result));
  });
  return () => controls.stop();
}

export async function listVideoInputDevices(): Promise<MediaDeviceInfo[]> {
  return BrowserMultiFormatReader.listVideoInputDevices();
}
