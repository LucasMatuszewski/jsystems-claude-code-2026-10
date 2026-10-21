import { describe, expect, it, vi } from "vitest";
import {
  MAX_EDGE,
  MAX_ROUNDS,
  QUALITY_STEPS,
  type ReduceDeps,
  ReductionError,
  reducePhoto,
  SCALE_STEP,
  targetSize,
} from "@/lib/image/reduce";

type CanvasLog = { width: number; height: number; quality: number }[];

/** Fake deps: encoded size depends only on the JPEG quality, so tests control every step. */
function fakeDeps(options: {
  sourceWidth?: number;
  sourceHeight?: number;
  sizeForQuality: (quality: number, width: number, height: number) => number;
  log?: CanvasLog;
  ctxLog?: string[];
}): ReduceDeps & { close: ReturnType<typeof vi.fn> } {
  const close = vi.fn();
  const log = options.log ?? [];
  return {
    close,
    createCanvas: (width, height) => ({
      getContext: () => {
        let fillStyle = "";
        return {
          drawImage: vi.fn(() => options.ctxLog?.push("drawImage")),
          fillRect: vi.fn(() => options.ctxLog?.push(`fillRect:${fillStyle}`)),
          set fillStyle(value: string) {
            fillStyle = value;
          },
        } as unknown as CanvasRenderingContext2D;
      },
      toBlob: (cb, type, quality) => {
        log.push({ height, quality, width });
        const size = options.sizeForQuality(quality, width, height);
        cb(new Blob([new Uint8Array(size)], { type }));
      },
    }),
    createImageBitmap: async () => ({
      close,
      height: options.sourceHeight ?? 3135,
      width: options.sourceWidth ?? 3024,
    }),
  };
}

describe("targetSize", () => {
  it("scales a portrait-ish photo so the longer edge is at most MAX_EDGE", () => {
    const size = targetSize(3024, 3135);
    expect(size.height).toBe(MAX_EDGE);
    expect(Math.abs(size.width - 1513)).toBeLessThanOrEqual(1);
  });

  it("keeps the aspect ratio within one pixel", () => {
    const size = targetSize(3024, 3135);
    expect(Math.abs(size.width / size.height - 3024 / 3135)).toBeLessThan(
      1 / MAX_EDGE
    );
  });

  it("never upscales a small image", () => {
    expect(targetSize(863, 843)).toEqual({ height: 843, width: 863 });
  });

  it("scales a wide image to the exact maximum edge", () => {
    expect(targetSize(4000, 1000)).toEqual({ height: 392, width: 1568 });
  });

  it("uses an explicit maxEdge when given", () => {
    expect(targetSize(1000, 500, 500)).toEqual({ height: 250, width: 500 });
  });

  it("keeps each edge at least 1 pixel", () => {
    const size = targetSize(10_000, 1, 100);
    expect(size.height).toBeGreaterThanOrEqual(1);
    expect(size.width).toBe(100);
  });
});

describe("reducePhoto", () => {
  it("stops at the first quality step whose blob fits and returns a JPEG", async () => {
    const log: CanvasLog = [];
    const sizes: Record<number, number> = {
      0.45: 100,
      0.55: 300,
      0.65: 500,
      0.75: 700,
      0.85: 900,
    };
    const deps = fakeDeps({
      log,
      sizeForQuality: (quality) => sizes[quality] ?? 0,
    });

    const result = await reducePhoto(new Blob(["x"]), {
      deps,
      maxBytes: 600,
    });

    expect(result.blob.type).toBe("image/jpeg");
    expect(result.blob.size).toBe(500);
    expect(log.map((entry) => entry.quality)).toEqual([0.85, 0.75, 0.65]);
    expect(result).toMatchObject(targetSize(3024, 3135));
  });

  it("scales by SCALE_STEP in the second round when no quality fits in the first", async () => {
    const log: CanvasLog = [];
    const deps = fakeDeps({
      log,
      // Only blobs from canvases narrower than 1400 px fit the limit.
      sizeForQuality: (_quality, width) => (width < 1400 ? 10 : 10_000),
    });

    const result = await reducePhoto(new Blob(["x"]), {
      deps,
      maxBytes: 1000,
    });

    const firstRound = targetSize(3024, 3135);
    expect(log[0]).toMatchObject({
      height: firstRound.height,
      width: firstRound.width,
    });
    const secondRoundWidth = Math.round(firstRound.width * SCALE_STEP);
    const secondRoundHeight = Math.round(firstRound.height * SCALE_STEP);
    expect(result).toMatchObject({
      height: secondRoundHeight,
      width: secondRoundWidth,
    });
    expect(
      log.filter((entry) => entry.width === secondRoundWidth).length
    ).toBeGreaterThan(0);
  });

  it("throws ReductionError after MAX_ROUNDS rounds when nothing fits", async () => {
    const log: CanvasLog = [];
    const deps = fakeDeps({
      log,
      sizeForQuality: () => 10_000,
    });

    await expect(
      reducePhoto(new Blob(["x"]), { deps, maxBytes: 1000 })
    ).rejects.toBeInstanceOf(ReductionError);

    expect(log).toHaveLength(MAX_ROUNDS * QUALITY_STEPS.length);
    const widths = new Set(log.map((entry) => entry.width));
    expect(widths.size).toBe(MAX_ROUNDS);
  });

  it("fills a white background before drawing the photo", async () => {
    const ctxLog: string[] = [];
    const deps = fakeDeps({
      ctxLog,
      sizeForQuality: () => 10,
    });

    await reducePhoto(new Blob(["x"]), { deps, maxBytes: 1000 });

    expect(ctxLog[0]).toBe("fillRect:#ffffff");
    expect(ctxLog[1]).toBe("drawImage");
  });

  it("closes the source bitmap after encoding", async () => {
    const deps = fakeDeps({ sizeForQuality: () => 10 });

    await reducePhoto(new Blob(["x"]), { deps, maxBytes: 1000 });

    expect(deps.close).toHaveBeenCalled();
  });
});
