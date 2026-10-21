// Browser-only client-side photo reduction (ADR-004 §3.4 step 2, AC-19).
// Uses createImageBitmap and canvas, so it must not be imported on the server.

import { SERVER_PHOTO_MAX_BYTES } from "@/lib/image/sniff";

export const MAX_EDGE = 1568;
export const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55, 0.45] as const;
export const MAX_ROUNDS = 5;
export const SCALE_STEP = 0.85;

const WHITE = "#ffffff";

/** Target size so that the longer edge ≤ maxEdge, never upscaling, aspect ratio preserved (rounded to integers, each ≥ 1). */
export function targetSize(
  width: number,
  height: number,
  maxEdge: number = MAX_EDGE
): { width: number; height: number } {
  const longer = Math.max(width, height);
  if (longer <= maxEdge) {
    return { height, width };
  }
  const scale = maxEdge / longer;
  return {
    height: Math.max(1, Math.round(height * scale)),
    width: Math.max(1, Math.round(width * scale)),
  };
}

export class ReductionError extends Error {}

type BitmapLike = {
  width: number;
  height: number;
  close?: () => void;
};

type CanvasLike = {
  getContext: (id: "2d") => CanvasRenderingContext2D | null;
  toBlob: (cb: (b: Blob | null) => void, type: string, q: number) => void;
};

export type ReduceDeps = {
  createImageBitmap: (b: Blob, o?: ImageBitmapOptions) => Promise<BitmapLike>;
  createCanvas: (w: number, h: number) => CanvasLike;
};

function defaultDeps(): ReduceDeps {
  return {
    createCanvas: (w, h) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      return canvas;
    },
    createImageBitmap: (b, o) => globalThis.createImageBitmap(b, o),
  };
}

function encodeJpeg(canvas: CanvasLike, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

/**
 * Reduces a photo to a JPEG no larger than maxBytes and with its longer edge at most maxEdge.
 * Tries each quality step; if none fits, scales the dimensions by SCALE_STEP and retries,
 * for at most MAX_ROUNDS rounds. Throws ReductionError when nothing fits.
 */
export async function reducePhoto(
  file: Blob,
  opts: {
    maxEdge?: number;
    maxBytes?: number;
    deps?: ReduceDeps;
  } = {}
): Promise<{ blob: Blob; width: number; height: number }> {
  const maxEdge = opts.maxEdge ?? MAX_EDGE;
  const maxBytes = opts.maxBytes ?? SERVER_PHOTO_MAX_BYTES;
  const deps = opts.deps ?? defaultDeps();

  const bitmap = await deps.createImageBitmap(file, {
    imageOrientation: "from-image",
  });

  try {
    let size = targetSize(bitmap.width, bitmap.height, maxEdge);

    for (let round = 0; round < MAX_ROUNDS; round += 1) {
      if (round > 0) {
        size = {
          height: Math.max(1, Math.round(size.height * SCALE_STEP)),
          width: Math.max(1, Math.round(size.width * SCALE_STEP)),
        };
      }

      const canvas = deps.createCanvas(size.width, size.height);
      const context = canvas.getContext("2d");
      if (context === null) {
        throw new ReductionError("Canvas 2D context is unavailable");
      }
      context.fillStyle = WHITE;
      context.fillRect(0, 0, size.width, size.height);
      // The bitmap is a valid canvas image source in browsers; the fake deps in tests are not.
      context.drawImage(
        bitmap as unknown as CanvasImageSource,
        0,
        0,
        size.width,
        size.height
      );

      for (const quality of QUALITY_STEPS) {
        // biome-ignore lint/performance/noAwaitInLoops: qualities are tried in order and the first that fits wins
        const blob = await encodeJpeg(canvas, quality);
        if (blob !== null && blob.size <= maxBytes) {
          return { blob, height: size.height, width: size.width };
        }
      }
    }

    throw new ReductionError(
      `Photo does not fit into ${maxBytes} bytes after ${MAX_ROUNDS} rounds`
    );
  } finally {
    bitmap.close?.();
  }
}
