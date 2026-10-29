export type PersonName = {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
};

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function buildFullName({ firstName, middleName, lastName, suffix }: PersonName) {
  return [firstName, middleName, lastName, suffix].filter(Boolean).join(" ").trim();
}

export function formatPersonName({ firstName, middleName, lastName, suffix }: PersonName) {
  const middle = middleName?.trim();
  const extension = suffix?.trim();
  const given = [firstName.trim(), middle].filter(Boolean).join(" ");
  return `${lastName.trim()}, ${given}${extension ? ` ${extension}` : ""}`.trim();
}

export function buildBeneficiaryIdentityKey(input: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dateOfBirth?: Date | null;
  barangay?: string | null;
}) {
  if (!input.dateOfBirth) {
    return null;
  }

  const date = input.dateOfBirth.toISOString().slice(0, 10);
  return [
    normalize(input.lastName),
    normalize(input.firstName),
    normalize(input.middleName),
    date,
    normalize(input.barangay),
  ].join("|");
}
