export async function GET() {
  return Response.json({ ok: true, service: "mswd-api", status: "healthy" });
}
