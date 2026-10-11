import { getClient } from "@/lib/store";
import { buildNarrative } from "@/lib/narrative";
import { renderReportPdf } from "@/lib/pdf";

/** GET — white-labeled PDF report download for a client. */
export async function GET(_req: Request, ctx: RouteContext<"/api/clients/[id]/report">) {
  const { id } = await ctx.params;
  const client = getClient(id);
  if (!client) return Response.json({ error: "client not found" }, { status: 404 });

  const narrative = buildNarrative(client.name, client.rows);
  const pdf = await renderReportPdf(client, narrative);
  const filename = `${client.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-report-${narrative.periodLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdf.length),
    },
  });
}
