"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";

export type MaintenanceActionState = {
  ok: boolean;
  message: string;
};

export async function setMaintenanceModeAction(
  _previousState: MaintenanceActionState,
  formData: FormData,
): Promise<MaintenanceActionState> {
  const admin = await requireAdmin();
  const enabled = String(formData.get("maintenanceMode") ?? "") === "true";

  await db.$transaction([
    db.systemSetting.upsert({
      where: { key: "maintenance_mode" },
      update: { value: String(enabled), description: "Displays a maintenance notice in the officer workspace." },
      create: { key: "maintenance_mode", value: String(enabled), description: "Displays a maintenance notice in the officer workspace." },
    }),
    db.auditLog.create({
      data: {
        userId: admin.id,
        action: enabled ? "ENABLE" : "DISABLE",
        module: "SYSTEM_SETTINGS",
        description: `${enabled ? "Enabled" : "Disabled"} officer maintenance notice.`,
      },
    }),
  ]);

  revalidatePath("/admin/settings");
  revalidatePath("/officer");
  revalidatePath("/officer/dashboard");
  revalidatePath("/officer/assistance");

  return { ok: true, message: `Maintenance notice ${enabled ? "enabled" : "disabled"}.` };
}
