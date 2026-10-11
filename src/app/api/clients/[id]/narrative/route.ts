import { getClient } from "@/lib/store";
import { buildNarrative } from "@/lib/narrative";

/** GET — JSON preview of the auto-generated narrative for a client. */
export async function GET(_req: Request, ctx: RouteContext<"/api/clients/[id]/narrative">) {
  const { id } = await ctx.params;
  const client = getClient(id);
  if (!client) return Response.json({ error: "client not found" }, { status: 404 });

  const narrative = buildNarrative(client.name, client.rows);
  return Response.json({ narrative, agencyName: client.agencyName });
}
