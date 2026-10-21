// Pure, shared (client + server) image sniffing and size checks.
// Uses no Node-only APIs so it runs in the browser as well. See ADR-003 §3.

export type SniffedImageType = "jpeg" | "png" | "webp" | "unknown";

export const SNIFF_BYTES = 12;
export const SERVER_PHOTO_MAX_BYTES = 1_048_576;
export const CLIENT_PHOTO_MAX_BYTES = 10_485_760;

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF_TAG = [0x52, 0x49, 0x46, 0x46];
const WEBP_TAG = [0x57, 0x45, 0x42, 0x50];

const MEDIA_TYPES = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

function matchesAt(
  bytes: Uint8Array,
  offset: number,
  signature: readonly number[]
): boolean {
  if (bytes.length < offset + signature.length) {
    return false;
  }
  return signature.every((value, index) => bytes[offset + index] === value);
}

export function sniffImage(bytes: Uint8Array | ArrayBuffer): {
  type: SniffedImageType;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | null;
} {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const header = view.subarray(0, SNIFF_BYTES);

  let type: SniffedImageType = "unknown";
  if (matchesAt(header, 0, JPEG_SIGNATURE)) {
    type = "jpeg";
  } else if (matchesAt(header, 0, PNG_SIGNATURE)) {
    type = "png";
  } else if (matchesAt(header, 0, RIFF_TAG) && matchesAt(header, 8, WEBP_TAG)) {
    type = "webp";
  }

  return {
    mediaType: type === "unknown" ? null : MEDIA_TYPES[type],
    type,
  };
}

export function isWithinSize(byteLength: number, limit: number): boolean {
  return byteLength > 0 && byteLength <= limit;
}
