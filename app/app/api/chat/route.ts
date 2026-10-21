export const runtime = "nodejs";
export const maxDuration = 120;

export function POST() {
  return Response.json(
    { error: { code: "NOT_IMPLEMENTED", message: "Endpoint not implemented yet." } },
    { status: 501 }
  );
}
