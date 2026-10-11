import type { CampaignRow } from "./types";

/**
 * Minimal CSV parser for campaign metrics.
 * Expected header columns (case-insensitive, order-independent):
 *   campaign, spend, impressions, clicks, conversions
 * Blank lines are skipped; rows with a non-numeric metric are dropped.
 */
export function parseCampaignCsv(text: string): { rows: CampaignRow[]; errors: string[] } {
  const rows: CampaignRow[] = [];
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows, errors: ["CSV is empty."] };
  }

  const header = splitLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s_-]+/g, ""));
  const required = ["campaign", "spend", "impressions", "clicks", "conversions"] as const;
  const missing = required.filter((r) => !header.includes(r));
  if (missing.length > 0) {
    return {
      rows,
      errors: [`Missing required column(s): ${missing.join(", ")}. Expected: campaign, spend, impressions, clicks, conversions.`],
    };
  }

  const idx = (name: string) => header.indexOf(name);

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    try {
      const campaign = (cells[idx("campaign")] ?? "").trim();
      if (!campaign) throw new Error("campaign name is blank");
      const num = (name: string): number => {
        const raw = (cells[idx(name)] ?? "").replace(/[$,]/g, "").trim();
        const v = Number(raw);
        if (!Number.isFinite(v) || v < 0) throw new Error(`${name} is not a valid number ("${raw}")`);
        return v;
      };
      rows.push({
        campaign,
        spend: num("spend"),
        impressions: num("impressions"),
        clicks: num("clicks"),
        conversions: num("conversions"),
      });
    } catch (e) {
      errors.push(`Line ${i + 1}: ${(e as Error).message}`);
    }
  }

  return { rows, errors };
}

function splitLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

export const SAMPLE_CSV = `campaign,spend,impressions,clicks,conversions
Brand Search — Q4 Push,1240.50,45210,3210,118
Non-Brand — Outdoor Gear,3890.25,210400,8420,96
Shopping — Best Sellers,2115.80,132900,6110,141
Retargeting — Cart Abandoners,640.00,98400,4120,87
YouTube — Awareness,980.00,510300,2890,4`;
