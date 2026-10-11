import { listClients } from "@/lib/store";
import { buildNarrative } from "@/lib/narrative";
import { renderReportPdf } from "@/lib/pdf";
import { sendReportEmailStub } from "@/lib/delivery";

/**
 * Monthly scheduled-send scaffold. Runs on the 1st of each month via the
 * vercel.json cron. For every client with schedule === "monthly", the report
 * is generated and delivery is STUBBED (console log only — never emailed).
 *
 * If CRON_SECRET is set, callers must pass `Authorization: Bearer <secret>`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const results: Array<{
    clientId: string;
    clientName: string;
    generated: boolean;
    pdfBytes?: number;
    delivery?: "stubbed";
    note?: string;
  }> = [];

  for (const client of listClients()) {
    if (client.schedule !== "monthly") continue;

    const narrative = buildNarrative(client.name, client.rows);
    const pdf = await renderReportPdf(client, narrative);
    await sendReportEmailStub({
      to: client.contactEmail,
      agencyName: client.agencyName,
      clientName: client.name,
      periodLabel: narrative.periodLabel,
      pdfBytes: pdf.length,
    });

    results.push({
      clientId: client.id,
      clientName: client.name,
      generated: true,
      pdfBytes: pdf.length,
      delivery: "stubbed",
      note: narrative.empty ? "no campaign data this period" : undefined,
    });
  }

  console.log(`[CRON] monthly-reports ran: ${results.length} client(s) processed (all deliveries stubbed).`);
  return Response.json({ ranAt: new Date().toISOString(), processed: results.length, results });
}
