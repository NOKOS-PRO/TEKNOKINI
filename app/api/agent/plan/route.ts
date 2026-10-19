import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { runContentPlan } from "@/lib/services/plan-runner";

/** Vercel: batas 60 detik (paket Hobby). Penyusun draf berhenti sebelum itu. */
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const bearer = request.headers.get("authorization");
  if (process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`) return true;
  const shared = request.headers.get("x-agent-secret");
  return Boolean(process.env.AGENT_SECRET && shared === process.env.AGENT_SECRET);
}

async function run() {
  const supabase = createAdminClient();
  const results = await runContentPlan();

  // Pemeliharaan harian: tayangkan artikel terjadwal yang jatuh tempo, buang data trafik > 90 hari.
  const { data: publishedDue } = await supabase.rpc("publish_due_articles");
  const { data: purged } = await supabase.rpc("purge_old_page_views", { p_days: 90 });

  return {
    drafted: results.filter((r) => r.outcome === "drafted").length,
    failed: results.filter((r) => r.outcome === "failed").length,
    publishedDue: publishedDue ?? 0,
    purgedPageViews: purged ?? 0,
    results,
  };
}

/** Vercel Cron memanggil GET dengan "Authorization: Bearer $CRON_SECRET" (lihat vercel.json). */
export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await run());
}

/** Picu manual (header x-agent-secret), mis. dari scheduler Dokploy/VPS. */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await run());
}
