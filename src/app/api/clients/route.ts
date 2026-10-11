import { createClient, listClients } from "@/lib/store";
import type { Client } from "@/lib/types";

export async function GET() {
  const clients = listClients().map(stripRows);
  return Response.json({ clients });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }
  if (typeof body.contactEmail !== "string" || !body.contactEmail.includes("@")) {
    return Response.json({ error: "a valid contactEmail is required" }, { status: 400 });
  }
  const client = createClient({
    name: body.name,
    agencyName: typeof body.agencyName === "string" && body.agencyName.trim() ? body.agencyName : "Your Agency",
    primaryColor: typeof body.primaryColor === "string" ? body.primaryColor : undefined,
    contactEmail: body.contactEmail,
  });
  return Response.json({ client }, { status: 201 });
}

function stripRows(c: Client) {
  return { ...c, rows: undefined, rowCount: c.rows.length };
}
