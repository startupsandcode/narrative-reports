"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ClientSummary {
  id: string;
  name: string;
  agencyName: string;
  primaryColor: string;
  contactEmail: string;
  schedule: "monthly" | "off";
  rowCount: number;
  updatedAt: string;
}

interface ClientFull extends Omit<ClientSummary, "rowCount"> {
  rows: Array<{ campaign: string; spend: number; impressions: number; clicks: number; conversions: number }>;
}

interface Narrative {
  periodLabel: string;
  headline: string;
  summary: string[];
  wins: string[];
  recommendations: string[];
  metrics: Record<string, number | string | null>;
  empty: boolean;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export default function Home() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [client, setClient] = useState<ClientFull | null>(null);
  const [narrative, setNarrative] = useState<Narrative | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [showNew, setShowNew] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshClients = useCallback(async () => {
    const data = await api<{ clients: ClientSummary[] }>("/api/clients");
    setClients(data.clients);
    return data.clients;
  }, []);

  const loadClient = useCallback(async (id: string) => {
    setSelectedId(id);
    const [{ client: c }, { narrative: n }] = await Promise.all([
      api<{ client: ClientFull }>(`/api/clients/${id}`),
      api<{ narrative: Narrative }>(`/api/clients/${id}/narrative`),
    ]);
    setClient(c);
    setNarrative(n);
  }, []);

  useEffect(() => {
    refreshClients()
      .then((cs) => {
        if (cs.length > 0) loadClient(cs[0].id).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshClients, loadClient]);

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const { client: c } = await api<{ client: ClientFull }>("/api/clients", {
        method: "POST",
        body: JSON.stringify({
          name: fd.get("name"),
          agencyName: fd.get("agencyName"),
          primaryColor: fd.get("primaryColor"),
          contactEmail: fd.get("contactEmail"),
        }),
      });
      setShowNew(false);
      await refreshClients();
      await loadClient(c.id);
      flash("Client created.");
    } catch (err) {
      flash((err as Error).message);
    }
  };

  const handleSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!client) return;
    const fd = new FormData(e.currentTarget);
    try {
      const { client: c } = await api<{ client: ClientFull }>(`/api/clients/${client.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: fd.get("name"),
          agencyName: fd.get("agencyName"),
          primaryColor: fd.get("primaryColor"),
          contactEmail: fd.get("contactEmail"),
          schedule: fd.get("schedule"),
        }),
      });
      setClient(c);
      refreshClients();
      flash("White-label settings saved.");
    } catch (err) {
      flash((err as Error).message);
    }
  };

  const uploadCsv = async (csv: string) => {
    if (!client) return;
    try {
      const data = await api<{ client: ClientFull; imported: number; warnings: string[] }>(
        `/api/clients/${client.id}/upload`,
        { method: "POST", body: JSON.stringify({ csv }) }
      );
      await loadClient(client.id);
      flash(`Imported ${data.imported} campaign rows.${data.warnings.length ? ` ${data.warnings.length} line(s) skipped.` : ""}`);
      setCsvText("");
    } catch (err) {
      flash((err as Error).message);
    }
  };

  const loadSample = async () => {
    if (!client) return;
    await api(`/api/clients/${client.id}/sample`, { method: "POST" });
    await loadClient(client.id);
    flash("Sample data loaded.");
  };

  const toggleSchedule = async () => {
    if (!client) return;
    const next = client.schedule === "monthly" ? "off" : "monthly";
    const { client: c } = await api<{ client: ClientFull }>(`/api/clients/${client.id}`, {
      method: "PUT",
      body: JSON.stringify({ schedule: next }),
    });
    setClient(c);
    refreshClients();
    flash(next === "monthly" ? "Scheduled: reports generate on the 1st of each month (delivery stubbed)." : "Schedule turned off.");
  };

  if (loading) {
    return <main className="min-h-screen grid place-items-center text-zinc-500">Loading…</main>;
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Narrative Reports</h1>
            <p className="text-sm text-zinc-500">White-labeled client reports, written by the data. Delivery stubbed in v1.</p>
          </div>
          <button
            onClick={() => setShowNew((v) => !v)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New client
          </button>
        </div>
      </header>

      {status && (
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-900">{status}</div>
        </div>
      )}

      {showNew && (
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <form onSubmit={handleCreate} className="rounded-xl border bg-white p-5 grid gap-3 sm:grid-cols-2">
            <input name="name" required placeholder="Client name" className="input" />
            <input name="contactEmail" required type="email" placeholder="Contact email" className="input" />
            <input name="agencyName" placeholder="Agency name (white-label)" className="input" />
            <input name="primaryColor" placeholder="Brand color (e.g. #2563eb)" className="input" />
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Create</button>
              <button type="button" onClick={() => setShowNew(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border bg-white p-3 h-fit">
          <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Clients</h2>
          {clients.length === 0 && <p className="px-2 text-sm text-zinc-500">No clients yet.</p>}
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => loadClient(c.id)}
              className={`w-full text-left rounded-lg px-3 py-2 mb-1 hover:bg-zinc-100 ${c.id === selectedId ? "bg-zinc-100 ring-1 ring-zinc-300" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: c.primaryColor }} />
                <span className="font-medium text-sm truncate">{c.name}</span>
              </div>
              <div className="text-xs text-zinc-500 pl-5">
                {c.rowCount} rows · {c.schedule === "monthly" ? "📅 monthly" : "no schedule"}
              </div>
            </button>
          ))}
        </aside>

        <section>
          {!client ? (
            <div className="rounded-xl border bg-white p-8 text-center text-zinc-500">
              Create a client to get started.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{client.name}</h2>
                    <p className="text-sm text-zinc-500">{client.agencyName} → {client.contactEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={toggleSchedule} className="rounded-lg border px-3 py-1.5 text-sm">
                      {client.schedule === "monthly" ? "⏸ Turn off monthly schedule" : "📅 Schedule on the 1st"}
                    </button>
                    <a
                      href={`/api/clients/${client.id}/report`}
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
                    >
                      ⬇ Download PDF
                    </a>
                  </div>
                </div>
              </div>

              <details className="rounded-xl border bg-white p-5">
                <summary className="cursor-pointer font-medium">White-label & settings</summary>
                <form onSubmit={handleSettings} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">Client name<input name="name" defaultValue={client.name} className="input mt-1" /></label>
                  <label className="text-sm">Agency name<input name="agencyName" defaultValue={client.agencyName} className="input mt-1" /></label>
                  <label className="text-sm">Brand color<input name="primaryColor" defaultValue={client.primaryColor} className="input mt-1" /></label>
                  <label className="text-sm">Contact email<input name="contactEmail" defaultValue={client.contactEmail} className="input mt-1" /></label>
                  <label className="text-sm">Schedule
                    <select name="schedule" defaultValue={client.schedule} className="input mt-1">
                      <option value="off">Off</option>
                      <option value="monthly">Monthly (1st, delivery stubbed)</option>
                    </select>
                  </label>
                  <div className="sm:col-span-2">
                    <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Save</button>
                  </div>
                </form>
              </details>

              <details className="rounded-xl border bg-white p-5">
                <summary className="cursor-pointer font-medium">Campaign data ({client.rows.length} rows)</summary>
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => fileRef.current?.click()} className="rounded-lg border px-3 py-1.5 text-sm">Upload CSV</button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const r = new FileReader();
                          r.onload = () => uploadCsv(String(r.result ?? ""));
                          r.readAsText(f);
                        }
                        e.target.value = "";
                      }}
                    />
                    <button onClick={loadSample} className="rounded-lg border px-3 py-1.5 text-sm">Load sample data</button>
                    <a href="/sample-campaign-data.csv" download className="rounded-lg border px-3 py-1.5 text-sm">Download sample CSV</a>
                  </div>
                  <textarea
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder={"Paste CSV here — columns: campaign, spend, impressions, clicks, conversions"}
                    rows={4}
                    className="input font-mono text-xs"
                  />
                  <button
                    onClick={() => uploadCsv(csvText)}
                    disabled={!csvText.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                  >
                    Import pasted CSV
                  </button>
                  {client.rows.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-zinc-500 border-b">
                            <th className="py-1 pr-3">Campaign</th>
                            <th className="py-1 pr-3 text-right">Spend</th>
                            <th className="py-1 pr-3 text-right">Impr.</th>
                            <th className="py-1 pr-3 text-right">Clicks</th>
                            <th className="py-1 text-right">Conv.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {client.rows.map((r, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-1 pr-3">{r.campaign}</td>
                              <td className="py-1 pr-3 text-right">${r.spend.toLocaleString()}</td>
                              <td className="py-1 pr-3 text-right">{r.impressions.toLocaleString()}</td>
                              <td className="py-1 text-right">{r.clicks.toLocaleString()}</td>
                              <td className="py-1 text-right">{r.conversions.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </details>

              <div className="rounded-xl border bg-white p-5">
                <h3 className="font-bold text-lg mb-1">Report preview — {narrative?.periodLabel}</h3>
                {narrative ? (
                  <div className="space-y-4 text-sm">
                    <p className="text-zinc-700 font-medium">{narrative.headline}</p>
                    <div>
                      <h4 className="font-semibold mb-1">Summary</h4>
                      {narrative.summary.map((p, i) => <p key={i} className="text-zinc-700 mb-2">{p}</p>)}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Wins</h4>
                      <ul className="list-disc pl-5 space-y-1 text-zinc-700">
                        {narrative.wins.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Recommendations</h4>
                      <ul className="list-disc pl-5 space-y-1 text-zinc-700">
                        {narrative.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">Loading narrative…</p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #d4d4d8;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: #fff;
        }
        .input:focus {
          outline: 2px solid #2563eb;
          border-color: #2563eb;
        }
      `}</style>
    </main>
  );
}
