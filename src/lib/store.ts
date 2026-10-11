import type { CampaignRow, Client } from "./types";

/**
 * In-memory client store. Seeded with two sample clients so the demo works
 * out of the box. v1 keeps everything in process memory — no database.
 */
const clients = new Map<string, Client>();

export function getClient(id: string): Client | undefined {
  return clients.get(id);
}

export function listClients(): Client[] {
  return [...clients.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function createClient(input: {
  name: string;
  agencyName: string;
  primaryColor?: string;
  contactEmail: string;
}): Client {
  const id = `cli_${Math.random().toString(36).slice(2, 10)}`;
  const client: Client = {
    id,
    name: input.name.trim(),
    agencyName: input.agencyName.trim(),
    primaryColor: input.primaryColor?.trim() || "#2563eb",
    contactEmail: input.contactEmail.trim(),
    rows: [],
    schedule: "off",
    updatedAt: new Date().toISOString(),
  };
  clients.set(id, client);
  return client;
}

export function updateClient(
  id: string,
  patch: Partial<Pick<Client, "agencyName" | "primaryColor" | "contactEmail" | "schedule" | "name">>
): Client | undefined {
  const existing = clients.get(id);
  if (!existing) return undefined;
  const updated: Client = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  clients.set(id, updated);
  return updated;
}

export function setClientRows(id: string, rows: CampaignRow[]): Client | undefined {
  const existing = clients.get(id);
  if (!existing) return undefined;
  const updated: Client = {
    ...existing,
    rows,
    updatedAt: new Date().toISOString(),
  };
  clients.set(id, updated);
  return updated;
}

export function deleteClient(id: string): boolean {
  return clients.delete(id);
}

function seed() {
  if (clients.size > 0) return;

  const bluePeak: Client = {
    id: "cli_bluepeak",
    name: "BluePeak Outfitters",
    agencyName: "Summit PPC Co.",
    primaryColor: "#1d4ed8",
    contactEmail: "reports@example.com",
    rows: [
      { campaign: "Brand Search — Q4 Push", spend: 1240.5, impressions: 45210, clicks: 3210, conversions: 118 },
      { campaign: "Non-Brand — Outdoor Gear", spend: 3890.25, impressions: 210400, clicks: 8420, conversions: 96 },
      { campaign: "Shopping — Best Sellers", spend: 2115.8, impressions: 132900, clicks: 6110, conversions: 141 },
      { campaign: "Retargeting — Cart Abandoners", spend: 640.0, impressions: 98400, clicks: 4120, conversions: 87 },
      { campaign: "YouTube — Awareness", spend: 980.0, impressions: 510300, clicks: 2890, conversions: 4 },
    ],
    schedule: "monthly",
    updatedAt: new Date().toISOString(),
  };

  const harbor: Client = {
    id: "cli_harborlaw",
    name: "Harbor & Vale Law",
    agencyName: "Summit PPC Co.",
    primaryColor: "#0f766e",
    contactEmail: "reports@example.com",
    rows: [
      { campaign: "Search — Personal Injury", spend: 8420.0, impressions: 62300, clicks: 2140, conversions: 41 },
      { campaign: "Search — Family Law", spend: 3150.75, impressions: 48900, clicks: 1830, conversions: 52 },
      { campaign: "Display — Geo Retargeting", spend: 910.5, impressions: 402000, clicks: 1980, conversions: 6 },
    ],
    schedule: "off",
    updatedAt: new Date().toISOString(),
  };

  clients.set(bluePeak.id, bluePeak);
  clients.set(harbor.id, harbor);
}

seed();
