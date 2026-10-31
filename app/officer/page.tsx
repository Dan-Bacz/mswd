import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/permissions";

export default async function OfficerIndexPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(user.categoryIds.length > 1 ? "/officer/select-category" : "/officer/dashboard");
}
