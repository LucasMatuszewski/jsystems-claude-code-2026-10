export default function globalSetup(): void {
  const captureDir = process.env.AI_CAPTURE_DIR;
  if (typeof captureDir === "string" && captureDir.length > 0) {
    throw new Error(
      "AI_CAPTURE_DIR must not be set for contract/E2E runs; use npm run capture"
    );
  }
}
