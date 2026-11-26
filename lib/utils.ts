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
    normalizedName.includes("maifip") ||
    normalizedName === "pwd" ||
    normalizedName.includes("person with disabilit") ||
    normalizedName.includes("persons with disabilit")
  );
}

export function isPwdCategory(name: string) {
  const normalizedName = name.trim().toLowerCase();
  return normalizedName === "pwd" || normalizedName.includes("person with disabilit");
}

export function beneficiaryIntakeHref(categoryName: string, categoryId: string, area: "admin" | "officer" = "officer") {
  const name = categoryName.trim().toLowerCase();
  const base = `/${area}/beneficiaries/new`;
  const query = `?categoryId=${encodeURIComponent(categoryId)}`;
  if (name.includes("solo parent")) return `${base}/solo-parent${query}`;
  if (name.includes("vawc") || (name.includes("special protection") && !name.includes("children in need of special protection"))) {
    return `${base}/vawc-intake${query}`;
  }
  return `${base}/general-intake${query}`;
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function conciseDescription(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  if (!normalized) return fallback;
  const firstSentence = normalized.match(/^(.+?[.!?])(?:\s|$)/)?.[1] ?? normalized;
  return firstSentence.length > 140 ? `${firstSentence.slice(0, 137).trimEnd()}...` : firstSentence;
}
