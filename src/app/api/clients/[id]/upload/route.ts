import { getClient, setClientRows } from "@/lib/store";
import { parseCampaignCsv } from "@/lib/csv";

/**
 * POST { csv: string } — replace the client's campaign rows with parsed CSV data.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/clients/[id]/upload">) {
  const { id } = await ctx.params;
  const client = getClient(id);
  if (!client) return Response.json({ error: "client not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const csv = body?.csv;
  if (typeof csv !== "string" || !csv.trim()) {
    return Response.json({ error: "csv (string) is required in the request body" }, { status: 400 });
  }

  const { rows, errors } = parseCampaignCsv(csv);
  if (rows.length === 0) {
    return Response.json({ error: "no valid rows parsed", errors }, { status: 422 });
  }

  const updated = setClientRows(id, rows)!;
  return Response.json({ client: updated, imported: rows.length, warnings: errors });
}
