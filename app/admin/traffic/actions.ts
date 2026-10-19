"use server";

import { requireRole } from "@/lib/auth/session";
import { getRecentVisits, getTrafficOverview, type RecentVisit } from "@/lib/services/traffic";

export interface LiveSnapshot {
  live: number;
  todayViews: number;
  todayVisitors: number;
  recent: RecentVisit[];
}

/** Dipanggil LiveTraffic tiap beberapa detik. Hanya admin/editor. */
export async function getLiveTrafficAction(): Promise<LiveSnapshot | null> {
  await requireRole(["admin", "editor"]);
  const [overview, recent] = await Promise.all([getTrafficOverview(1), getRecentVisits(15)]);
  if (!overview) return null;
  return {
    live: overview.live,
    todayViews: overview.today.views,
    todayVisitors: overview.today.visitors,
    recent,
  };
}
