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
