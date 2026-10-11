import { deleteClient, getClient, updateClient } from "@/lib/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/clients/[id]">) {
  const { id } = await ctx.params;
  const client = getClient(id);
  if (!client) return Response.json({ error: "client not found" }, { status: 404 });
  return Response.json({ client });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/clients/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "invalid JSON body" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  for (const key of ["name", "agencyName", "primaryColor", "contactEmail"] as const) {
    if (typeof body[key] === "string") patch[key] = body[key];
  }
  if (body.schedule === "monthly" || body.schedule === "off") patch.schedule = body.schedule;

  const updated = updateClient(id, patch as Parameters<typeof updateClient>[1]);
  if (!updated) return Response.json({ error: "client not found" }, { status: 404 });
  return Response.json({ client: updated });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/clients/[id]">) {
  const { id } = await ctx.params;
  if (!deleteClient(id)) return Response.json({ error: "client not found" }, { status: 404 });
  return Response.json({ deleted: true });
}
