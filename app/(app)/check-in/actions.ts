"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];

export async function recordAttendance(input: {
  memberId: string;
  status: AttendanceStatus;
  classId?: string | null;
  date?: string;
  note?: string;
}): Promise<{ ok?: boolean; checkedIn?: boolean; points?: number; error?: string }> {
  const profile = await requireProfile();
  if (profile.role !== "trainer" && !profile.is_admin) return { error: "Staff only." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_attendance", {
    p_member: input.memberId,
    p_status: input.status,
    p_class: input.classId ?? null,
    p_date: input.date ?? new Date().toISOString().slice(0, 10),
    p_note: input.note ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/check-in");
  const res = (data ?? {}) as { checked_in?: boolean; points?: number };
  return { ok: true, checkedIn: res.checked_in, points: res.points };
}
