import path from "node:path";

/** Photos live in the repository assets folder and are referenced in place (never generated or modified). */
const PHOTO_DIR = path.resolve(process.cwd(), "../assets/example-images");

export type ExamplePhotoName =
  | "laptop-1.png"
  | "laptop-2.webp"
  | "phone-1.jpg"
  | "phone-2.jpeg"
  | "phone-3.jpeg";

export function examplePhotoPath(name: ExamplePhotoName): string {
  return path.resolve(PHOTO_DIR, name);
}

export type MultipartPart = {
  name: string | undefined;
  filename: string | undefined;
  headers: Record<string, string>;
  body: Buffer;
};

const CRLF = Buffer.from("\r\n");

function endsWithCrlf(buffer: Buffer): boolean {
  return (
    buffer.length >= 2 &&
    buffer.readUInt8(buffer.length - 2) === 0x0d &&
    buffer.readUInt8(buffer.length - 1) === 0x0a
  );
}

/** Splits a multipart/form-data body into parts using the boundary from the Content-Type header. */
export function parseMultipart(
  body: Buffer,
  contentType: string
): MultipartPart[] {
  const match = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType);
  const boundary = match?.[1] ?? match?.[2];
  if (boundary === undefined) {
    throw new Error("multipart boundary not found in content-type");
  }
  const delimiter = Buffer.from(`--${boundary}`);
  const parts: MultipartPart[] = [];
  let index = body.indexOf(delimiter);
  while (index !== -1) {
    const start = index + delimiter.length;
    const isClosing =
      body.readUInt8(start) === 0x2d && body.readUInt8(start + 1) === 0x2d;
    if (isClosing) {
      break;
    }
    const next = body.indexOf(delimiter, start);
    if (next === -1) {
      break;
    }
    let raw = body.subarray(start, next);
    if (raw.subarray(0, 2).equals(CRLF)) {
      raw = raw.subarray(2);
    }
    if (endsWithCrlf(raw)) {
      raw = raw.subarray(0, raw.length - 2);
    }
    const headerEnd = raw.indexOf("\r\n\r\n");
    if (headerEnd === -1) {
      throw new Error("multipart part without header terminator");
    }
    const headers: Record<string, string> = {};
    for (const line of raw
      .subarray(0, headerEnd)
      .toString("utf8")
      .split("\r\n")) {
      const colon = line.indexOf(":");
      if (colon > 0) {
        headers[line.slice(0, colon).trim().toLowerCase()] = line
          .slice(colon + 1)
          .trim();
      }
    }
    const disposition = headers["content-disposition"] ?? "";
    const name = /(?:^|;)\s*name="([^"]*)"/.exec(disposition)?.[1];
    const filename = /filename="([^"]*)"/.exec(disposition)?.[1];
    parts.push({
      body: raw.subarray(headerEnd + 4),
      filename,
      headers,
      name,
    });
    index = next;
  }
  return parts;
}

/** Returns the first part with the given form field name, or throws when absent. */
export function findPart(parts: MultipartPart[], name: string): MultipartPart {
  const part = parts.find((candidate) => candidate.name === name);
  if (part === undefined) {
    throw new Error(`multipart part "${name}" not found`);
  }
  return part;
}

export const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

export function isJpeg(bytes: Buffer): boolean {
  return bytes.length >= 3 && bytes.subarray(0, 3).equals(JPEG_MAGIC);
}

const SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

/** Reads width and height from the first SOF marker of a JPEG. */
export function jpegSize(bytes: Buffer): { width: number; height: number } {
  if (!isJpeg(bytes)) {
    throw new Error("not a JPEG (missing FF D8 FF)");
  }
  let offset = 2; // after FF D8
  while (offset + 1 < bytes.length) {
    if (bytes.readUInt8(offset) !== 0xff) {
      throw new Error(`invalid JPEG marker at offset ${offset}`);
    }
    // Skip fill bytes (FF FF ...) preceding a marker.
    while (bytes.readUInt8(offset + 1) === 0xff) {
      offset += 1;
    }
    const marker = bytes.readUInt8(offset + 1);
    // Standalone markers carry no length.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) {
      break;
    }
    if (SOF_MARKERS.has(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  throw new Error("JPEG SOF marker not found");
}
