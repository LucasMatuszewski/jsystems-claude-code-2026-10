import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLIENT_PHOTO_MAX_BYTES,
  isWithinSize,
  SERVER_PHOTO_MAX_BYTES,
  SNIFF_BYTES,
  sniffImage,
} from "./sniff";

const pad = (bytes: number[], length = SNIFF_BYTES): Uint8Array => {
  const out = new Uint8Array(Math.max(length, bytes.length));
  out.set(bytes);
  return out;
};

const ascii = (text: string): number[] =>
  Array.from(text, (char) => char.charCodeAt(0));

const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP_HEADER = [
  ...ascii("RIFF"),
  0x24,
  0x00,
  0x00,
  0x00,
  ...ascii("WEBP"),
  ...ascii("VP8 "),
];

describe("sniffImage", () => {
  it("detects JPEG from the FF D8 FF signature", () => {
    expect(sniffImage(pad(JPEG_HEADER))).toEqual({
      mediaType: "image/jpeg",
      type: "jpeg",
    });
  });

  it("detects PNG from the 8-byte signature", () => {
    expect(sniffImage(pad(PNG_SIGNATURE))).toEqual({
      mediaType: "image/png",
      type: "png",
    });
  });

  it("detects WebP from RIFF at 0-3 and WEBP at 8-11", () => {
    expect(sniffImage(pad(WEBP_HEADER))).toEqual({
      mediaType: "image/webp",
      type: "webp",
    });
  });

  it("returns unknown for RIFF with WAVE instead of WEBP", () => {
    const wave = [...ascii("RIFF"), 0x24, 0x00, 0x00, 0x00, ...ascii("WAVE")];
    expect(sniffImage(pad(wave))).toEqual({ mediaType: null, type: "unknown" });
  });

  it("returns unknown for HEIC (ftyp box)", () => {
    const heic = [
      0x00,
      0x00,
      0x00,
      0x18,
      ...ascii("ftypheic"),
      0x00,
      0x00,
      0x00,
      0x00,
    ];
    expect(sniffImage(pad(heic))).toEqual({ mediaType: null, type: "unknown" });
  });

  it("returns unknown for GIF", () => {
    expect(sniffImage(pad(ascii("GIF89a\x01\x00\x01\x00")))).toEqual({
      mediaType: null,
      type: "unknown",
    });
  });

  it("returns unknown for PDF", () => {
    expect(sniffImage(pad(ascii("%PDF-1.7\n%\xe2\xe3")))).toEqual({
      mediaType: null,
      type: "unknown",
    });
  });

  it("returns unknown for an empty array", () => {
    expect(sniffImage(new Uint8Array(0))).toEqual({
      mediaType: null,
      type: "unknown",
    });
  });

  it("detects JPEG with only 3 bytes (FF D8 FF E0 00 is jpeg, JPEG needs only 3 bytes)", () => {
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]))).toEqual({
      mediaType: "image/jpeg",
      type: "jpeg",
    });
  });

  it("returns unknown for a 5-byte RIFF prefix (too short for WebP)", () => {
    expect(sniffImage(new Uint8Array(ascii("RIFF\0")))).toEqual({
      mediaType: null,
      type: "unknown",
    });
  });

  it("accepts an ArrayBuffer with the same result as Uint8Array", () => {
    const bytes = pad(PNG_SIGNATURE);
    expect(sniffImage(bytes.buffer as ArrayBuffer)).toEqual(sniffImage(bytes));
    expect(sniffImage(pad(WEBP_HEADER).buffer as ArrayBuffer)).toEqual({
      mediaType: "image/webp",
      type: "webp",
    });
  });

  it("detects real files by content, ignoring their extension", () => {
    const assetsDir = path.resolve(process.cwd(), "../assets/example-images");
    const load = (name: string) =>
      new Uint8Array(readFileSync(path.join(assetsDir, name)));

    expect(sniffImage(load("laptop-1.png")).type).toBe("jpeg");
    expect(sniffImage(load("laptop-2.webp")).type).toBe("webp");
    expect(sniffImage(load("phone-1.jpg")).type).toBe("jpeg");
  });
});

describe("isWithinSize", () => {
  it("accepts the server limit exactly", () => {
    expect(isWithinSize(1_048_576, SERVER_PHOTO_MAX_BYTES)).toBe(true);
  });

  it("rejects one byte over the server limit", () => {
    expect(isWithinSize(1_048_577, SERVER_PHOTO_MAX_BYTES)).toBe(false);
  });

  it("rejects zero bytes", () => {
    expect(isWithinSize(0, SERVER_PHOTO_MAX_BYTES)).toBe(false);
  });

  it("accepts the client limit exactly", () => {
    expect(isWithinSize(10_485_760, CLIENT_PHOTO_MAX_BYTES)).toBe(true);
  });

  it("rejects one byte over the client limit", () => {
    expect(isWithinSize(10_485_761, CLIENT_PHOTO_MAX_BYTES)).toBe(false);
  });
});
