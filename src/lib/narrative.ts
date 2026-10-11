import type { CampaignRow, Narrative, ReportMetrics } from "./types";
import { periodLabel } from "./types";

export const money = (n: number): string =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const num = (n: number): string => Math.round(n).toLocaleString("en-US");

export const pct = (n: number, digits = 2): string => `${n.toFixed(digits)}%`;

export function computeMetrics(rows: CampaignRow[]): ReportMetrics {
  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalConversions = rows.reduce((s, r) => s + r.conversions, 0);

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const costPerConversion = totalConversions > 0 ? totalSpend / totalConversions : 0;

  const byConv = [...rows].sort((a, b) => b.conversions - a.conversions);
  const withImpr = rows.filter((r) => r.impressions > 0);
  const topByCtr = [...withImpr].sort(
    (a, b) => b.clicks / b.impressions - a.clicks / a.impressions
  );

  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalConversions,
    ctr,
    avgCpc,
    costPerConversion,
    campaignCount: rows.length,
    topCampaignByConversions: byConv[0]?.campaign ?? null,
    topCampaignByCtr: topByCtr[0]?.campaign ?? null,
  };
}

/**
 * Turn campaign rows into a plain-English report narrative.
 * Everything is derived from the data itself — no invented benchmarks.
 */
export function buildNarrative(
  clientName: string,
  rows: CampaignRow[],
  period?: string
): Narrative {
  const label = period ?? periodLabel();
  const m = computeMetrics(rows);

  if (rows.length === 0) {
    return {
      periodLabel: label,
      headline: `No campaign data yet for ${label}`,
      summary: [
        `We don't have any campaign data for ${clientName} this period, so there's nothing to report. Upload a CSV of campaign metrics (campaign, spend, impressions, clicks, conversions) and we'll generate the full narrative automatically.`,
      ],
      wins: [],
      recommendations: [
        "Upload this month's campaign data (CSV) to unlock the automated summary, wins, and recommendations.",
      ],
      metrics: m,
      empty: true,
    };
  }

  const headline = `${label} at a glance: ${num(m.totalConversions)} conversions on ${money(m.totalSpend)} of spend`;

  const summary: string[] = [];
  summary.push(
    `In ${label}, ${clientName}'s account spent ${money(m.totalSpend)} across ${m.campaignCount} campaign${m.campaignCount === 1 ? "" : "s"}, generating ${num(m.totalImpressions)} impressions, ${num(m.totalClicks)} clicks, and ${num(m.totalConversions)} conversions.`
  );

  const ctrLine = `The account click-through rate was ${pct(m.ctr)}, with an average cost per click of ${money(m.avgCpc)}.`;
  summary.push(
    m.totalConversions > 0
      ? `${ctrLine} Each conversion cost ${money(m.costPerConversion)} on average.`
      : `${ctrLine} No conversions were recorded this period — spend went entirely toward traffic and visibility.`
  );

  if (m.topCampaignByConversions) {
    const top = rows.find((r) => r.campaign === m.topCampaignByConversions)!;
    const share =
      m.totalConversions > 0
        ? ` — ${pct((top.conversions / m.totalConversions) * 100, 1)} of all conversions`
        : "";
    summary.push(
      `"${top.campaign}" was the strongest performer by volume with ${num(top.conversions)} conversions on ${money(top.spend)} of spend${share}.`
    );
  }

  // --- Wins: data-relative, all true by construction ---
  const wins: string[] = [];
  const sortedByConv = [...rows].sort((a, b) => b.conversions - a.conversions);
  const topConv = sortedByConv[0];
  if (topConv && topConv.conversions > 0) {
    wins.push(
      `"${topConv.campaign}" led conversion volume with ${num(topConv.conversions)} conversions.`
    );
  }

  const withImpr = rows.filter((r) => r.impressions >= 1000);
  if (withImpr.length > 0) {
    const bestCtrRow = [...withImpr].sort(
      (a, b) => b.clicks / b.impressions - a.clicks / a.impressions
    )[0];
    const c = (bestCtrRow.clicks / bestCtrRow.impressions) * 100;
    wins.push(
      `"${bestCtrRow.campaign}" had the strongest engagement at ${pct(c)} click-through — a sign the creative and targeting are resonating.`
    );
  }

  const efficient = rows.filter((r) => r.conversions > 0 && r.spend / r.conversions <= m.costPerConversion && r.conversions >= 5);
  if (efficient.length > 0 && m.totalConversions > 0) {
    const names = efficient.slice(0, 3).map((r) => `"${r.campaign}"`).join(", ");
    wins.push(
      `${names} converted at or below the account average cost per conversion (${money(m.costPerConversion)}) — efficient budget to protect.`
    );
  }

  const zeroSpendWaste = rows.filter((r) => r.spend === 0);
  if (zeroSpendWaste.length > 0) {
    wins.push(
      `${zeroSpendWaste.length} campaign${zeroSpendWaste.length === 1 ? "" : "s"} paused or spent nothing this period — no wasted budget there.`
    );
  }

  if (wins.length === 0) {
    wins.push("No standout wins this period — the account stayed active and kept gathering signal.");
  }

  // --- Recommendations: driven by spend vs. output within the account ---
  const recommendations: string[] = [];
  const bigSpendersNoConv = rows.filter(
    (r) => m.totalSpend > 0 && r.spend / m.totalSpend >= 0.2 && r.conversions === 0
  );
  for (const r of bigSpendersNoConv) {
    recommendations.push(
      `"${r.campaign}" consumed ${pct((r.spend / m.totalSpend) * 100, 1)} of spend with zero conversions. Audit its targeting, landing page, and bid strategy before spending more — or reallocate to proven converters.`
    );
  }

  const lowCtr = rows.filter(
    (r) =>
      r.impressions >= 5000 &&
      m.ctr > 0 &&
      r.clicks / r.impressions < m.ctr * 0.5
  );
  for (const r of lowCtr.slice(0, 2)) {
    const c = (r.clicks / r.impressions) * 100;
    recommendations.push(
      `"${r.campaign}" has a ${pct(c)} CTR against an account average of ${pct(m.ctr)} — refresh ad copy and creative, and tighten the audience, to lift engagement.`
    );
  }

  const expensive = rows.filter(
    (r) =>
      r.conversions >= 5 &&
      m.costPerConversion > 0 &&
      r.spend / r.conversions > m.costPerConversion * 1.75
  );
  for (const r of expensive.slice(0, 2)) {
    recommendations.push(
      `"${r.campaign}" converts at ${money(r.spend / r.conversions)} per conversion vs. the account average of ${money(m.costPerConversion)}. Review the landing experience and qualification criteria before scaling it.`
    );
  }

  const cheapConv = rows.filter(
    (r) =>
      r.conversions > 0 &&
      m.costPerConversion > 0 &&
      r.spend / r.conversions < m.costPerConversion * 0.7 &&
      r.spend / m.totalSpend < 0.25
  );
  for (const r of cheapConv.slice(0, 2)) {
    recommendations.push(
      `"${r.campaign}" is converting efficiently (${money(r.spend / r.conversions)} per conversion) on a small share of budget — consider shifting incremental spend here and watch the cost curve.`
    );
  }

  if (m.totalConversions === 0) {
    recommendations.push(
      "No conversions were recorded, so the priority is measurement: confirm conversion tracking is firing on the thank-you page or lead form before optimizing anything else."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Nothing in the data demands urgent action. Keep budgets steady, keep the best performers funded, and revisit after the next cycle of data."
    );
  }

  return {
    periodLabel: label,
    headline,
    summary,
    wins: wins.slice(0, 4),
    recommendations: recommendations.slice(0, 4),
    metrics: m,
    empty: false,
  };
}
