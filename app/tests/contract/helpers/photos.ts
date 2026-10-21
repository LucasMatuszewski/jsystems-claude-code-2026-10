import { readFileSync } from "node:fs";
import path from "node:path";

/** Photos live in the repository assets folder and are referenced in place. */
// Relative to app/ (the Playwright run directory), as in playwright.config.ts.
const PHOTO_DIR = path.resolve(process.cwd(), "../assets/example-images");

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export type PhotoName =
  | "laptop-1.png"
  | "laptop-2.webp"
  | "phone-1.jpg"
  | "phone-2.jpeg"
  | "phone-3.jpeg";

export type PhotoEntry = { path: string; mimeType: string };

/**
 * Allowed photos. The mimeType follows the file extension on purpose: the
 * server must ignore it and detect the real content (laptop-1.png is JPEG).
 */
export const PHOTOS: Record<PhotoName, PhotoEntry> = {
  "laptop-1.png": photoEntry("laptop-1.png"),
  "laptop-2.webp": photoEntry("laptop-2.webp"),
  "phone-1.jpg": photoEntry("phone-1.jpg"),
  "phone-2.jpeg": photoEntry("phone-2.jpeg"),
  "phone-3.jpeg": photoEntry("phone-3.jpeg"),
};

function photoEntry(name: string): PhotoEntry {
  const extension = path.extname(name).toLowerCase();
  const mimeType = MIME_BY_EXTENSION[extension];
  if (mimeType === undefined) {
    throw new Error(`No MIME type mapped for ${name}`);
  }
  return { mimeType, path: path.join(PHOTO_DIR, name) };
}

/** Playwright multipart file part for a photo from PHOTOS. */
export function photoPart(name: PhotoName): {
  name: string;
  mimeType: string;
  buffer: Buffer;
} {
  const entry = PHOTOS[name];
  return {
    buffer: readFileSync(entry.path),
    mimeType: entry.mimeType,
    name,
  };
}
