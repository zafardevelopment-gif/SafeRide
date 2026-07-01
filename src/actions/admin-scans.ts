"use server";

import { getCurrentUser } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, Scan } from "@/types";

async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  if (user.role !== "admin") return { success: false, error: "Admin access required." };
  return null;
}

export interface ScanWithFlag extends Scan {
  same_ip_count: number;
}

export async function getAllScans(): Promise<ScanWithFlag[]> {
  const guard = await assertAdmin();
  if (guard) return [];

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("ss_scans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  const scans = data ?? [];
  const ipCounts = new Map<string, number>();
  for (const scan of scans) {
    if (!scan.ip_address) continue;
    ipCounts.set(scan.ip_address, (ipCounts.get(scan.ip_address) ?? 0) + 1);
  }

  return scans.map((scan) => ({
    ...scan,
    same_ip_count: scan.ip_address ? (ipCounts.get(scan.ip_address) ?? 1) : 1,
  }));
}
