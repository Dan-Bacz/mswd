import Link from "next/link";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions/auth";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

export default async function AdminNotificationsPage() {
  const user = await requireAdmin();
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="rounded-2xl border border-[#E3E9F2] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#073783]/10 text-[#073783]">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A88724]">Administration</p>
              <h1 className="mt-1 text-2xl font-bold text-[#0B1A3E]">Notifications</h1>
              <p className="mt-1 text-sm text-[#7184A0]">
                Staff registrations, approvals, and other system activity that needs administrator attention.
              </p>
            </div>
          </div>
          {unread > 0 && (
            <form action={markAllNotificationsReadAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <CheckCheck className="h-4 w-4" aria-hidden="true" />
                Mark all read
              </button>
            </form>
          )}
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-[#E3E9F2] bg-white shadow-sm">
        {notifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-slate-700">No notifications yet</p>
            <p className="mt-1 text-sm text-slate-500">New staff registrations will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <li key={notification.id} className={`px-4 py-4 sm:px-6 ${notification.isRead ? "bg-white" : "bg-[#FFFBEA]"}`}>
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-slate-300" : "bg-[#E31837]"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0B1A3E]">{notification.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(notification.createdAt)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {notification.link && (
                        <Link
                          href={notification.link}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#073783] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0B4599]"
                        >
                          View registration
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      )}
                      {!notification.isRead && (
                        <form action={markNotificationReadAction}>
                          <input type="hidden" name="notificationId" value={notification.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Mark as read
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
