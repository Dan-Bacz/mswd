import { db } from "@/lib/db";

export async function notifyAdminsOfRegistration(officer: {
  id: string;
  name: string;
  email: string;
  position: string | null;
  createdAt: Date;
}) {
  const admins = await db.user.findMany({
    where: { role: { name: "ADMIN" }, status: "ACTIVE" },
    select: { id: true },
  });

  if (admins.length === 0) {
    return 0;
  }

  const submitted = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(officer.createdAt);

  const result = await db.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      title: "New staff registration awaiting approval",
      message: `${officer.name}${officer.position ? ` (${officer.position})` : ""} submitted a registration on ${submitted}. The account is pending administrator approval.`,
      type: "OFFICER_REGISTRATION",
      link: `/admin/officers/${officer.id}`,
      dedupeKey: `officer-registration:${officer.id}:${admin.id}`,
    })),
    skipDuplicates: true,
  });

  return result.count;
}

export async function markRegistrationNotificationsReviewed(officerId: string) {
  await db.notification.updateMany({
    where: {
      type: "OFFICER_REGISTRATION",
      dedupeKey: { startsWith: `officer-registration:${officerId}:` },
      isRead: false,
    },
    data: { isRead: true },
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  await db.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
