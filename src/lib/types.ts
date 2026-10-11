export interface CampaignRow {
  campaign: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface Client {
  id: string;
  name: string;
  agencyName: string;
  primaryColor: string;
  contactEmail: string;
  rows: CampaignRow[];
  schedule: "monthly" | "off";
  updatedAt: string;
}

export interface ReportMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  ctr: number; // %
  avgCpc: number;
  costPerConversion: number;
  campaignCount: number;
  topCampaignByConversions: string | null;
  topCampaignByCtr: string | null;
}

export interface Narrative {
  periodLabel: string;
  headline: string;
  summary: string[];
  wins: string[];
  recommendations: string[];
  metrics: ReportMetrics;
  empty: boolean;
}

export const PERIOD_OFFSET_MONTHS = 1; // reports on the 1st cover the prior month

export function periodLabel(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth() - PERIOD_OFFSET_MONTHS, 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}
