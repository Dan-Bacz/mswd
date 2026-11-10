import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  const [settings, categories, beneficiaries, assistance, auditLogs] = await Promise.all([
    db.systemSetting.findMany({ select: { key: true, value: true, description: true, updatedAt: true } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.beneficiary.findMany({ orderBy: { createdAt: "asc" } }),
    db.beneficiaryAssistance.findMany({ orderBy: { createdAt: "asc" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "asc" }, include: { user: { select: { name: true, email: true } } } }),
  ]);

  await db.auditLog.create({
    data: { userId: admin.id, action: "EXPORT", module: "BACKUP", description: "Downloaded a system backup." },
  });

  const payload = {
    format: "MSWD_BACKUP",
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedBy: { name: admin.name, email: admin.email },
    settings,
    categories,
    beneficiaries,
    assistance,
    auditLogs,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mswd-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const body = await request.formData();
  const file = body.get("backup");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Choose an MSWD backup file." }, { status: 400 });
  }

  let backup: unknown;
  try {
    backup = JSON.parse(await file.text());
  } catch {
    return NextResponse.json({ message: "The selected file is not valid JSON." }, { status: 400 });
  }

  if (!backup || typeof backup !== "object" || (backup as { format?: unknown }).format !== "MSWD_BACKUP") {
    return NextResponse.json({ message: "This is not a recognized MSWD backup file." }, { status: 400 });
  }

  const data = backup as { settings?: unknown; categories?: unknown };
  const settings = Array.isArray(data.settings) ? data.settings : [];
  const categories = Array.isArray(data.categories) ? data.categories : [];

  await db.$transaction(async (transaction) => {
    for (const item of settings) {
      if (!item || typeof item !== "object") continue;
      const setting = item as { key?: unknown; value?: unknown; description?: unknown };
      if (typeof setting.key !== "string" || typeof setting.value !== "string") continue;
      await transaction.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value, description: typeof setting.description === "string" ? setting.description : null },
        create: { key: setting.key, value: setting.value, description: typeof setting.description === "string" ? setting.description : null },
      });
    }
    for (const item of categories) {
      if (!item || typeof item !== "object") continue;
      const category = item as { id?: unknown; name?: unknown; description?: unknown };
      if (typeof category.id !== "string" || typeof category.name !== "string") continue;
      await transaction.category.upsert({
        where: { id: category.id },
        update: { name: category.name, description: typeof category.description === "string" ? category.description : null },
        create: { id: category.id, name: category.name, description: typeof category.description === "string" ? category.description : null },
      });
    }
    await transaction.auditLog.create({
      data: { userId: admin.id, action: "IMPORT", module: "BACKUP", description: `Restored ${settings.length} settings and ${categories.length} program definitions from an MSWD backup.` },
    });
  });

  return NextResponse.redirect(new URL("/admin/settings?recovered=1", request.url), 303);
}
