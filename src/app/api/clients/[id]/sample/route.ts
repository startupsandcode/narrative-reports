import { getClient, setClientRows } from "@/lib/store";
import { parseCampaignCsv, SAMPLE_CSV } from "@/lib/csv";

/** POST — load the built-in sample dataset into the client (demo convenience). */
export async function POST(_req: Request, ctx: RouteContext<"/api/clients/[id]/sample">) {
  const { id } = await ctx.params;
  const client = getClient(id);
  if (!client) return Response.json({ error: "client not found" }, { status: 404 });

  const { rows } = parseCampaignCsv(SAMPLE_CSV);
  const updated = setClientRows(id, rows)!;
  return Response.json({ client: updated, imported: rows.length });
}
