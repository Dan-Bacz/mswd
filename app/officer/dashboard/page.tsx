import { redirect } from "next/navigation";
import { requireSelectedOfficerCategory } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function OfficerDashboardPage() {
  const { categoryId } = await requireSelectedOfficerCategory();
  redirect(`/officer/categories/${categoryId}`);
}
