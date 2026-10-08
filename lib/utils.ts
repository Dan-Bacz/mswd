export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function shouldShowBeneficiaryCategory(name: string) {
  const normalizedName = name.trim().toLowerCase();

  return !(
    normalizedName === "juvenile" ||
    normalizedName.startsWith("eccd") ||
    normalizedName === "women" ||
    normalizedName.includes("maifip")
  );
}

export function getCaseStatusClassName(status: string) {
  const safeStatus = status?.toUpperCase() ?? "DEFAULT";

  switch (safeStatus) {
    case "ACTIVE":
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-700";
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "CLOSED":
    case "CANCELLED":
      return "bg-slate-200 text-slate-700";
    case "UNDER_ASSESSMENT":
    case "NEW":
      return "bg-sky-100 text-sky-700";
    case "FOR_REFERRAL":
      return "bg-violet-100 text-violet-700";
    case "FOR_FOLLOW_UP":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
