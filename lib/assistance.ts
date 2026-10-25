export const ASSISTANCE_TYPE_VALUES = [
  "FINANCIAL_ASSISTANCE",
  "MEDICAL_ASSISTANCE",
  "FOOD_ASSISTANCE",
  "BURIAL_FUNERAL_ASSISTANCE",
  "TRANSPORTATION_ASSISTANCE",
  "EDUCATIONAL_ASSISTANCE",
  "PSYCHOSOCIAL_SUPPORT",
  "REFERRAL_LINKAGE",
  "OTHER",
] as const;

export type AssistanceType = (typeof ASSISTANCE_TYPE_VALUES)[number];

export const ASSISTANCE_OUTCOME_VALUES = [
  "PROVIDED",
  "REFERRED",
  "FOLLOW_UP",
  "NOT_PROVIDED",
] as const;

export type AssistanceOutcome = (typeof ASSISTANCE_OUTCOME_VALUES)[number];

export const ASSISTANCE_OUTCOME_LABELS: Record<AssistanceOutcome, string> = {
  PROVIDED: "Assistance Provided",
  REFERRED: "Referred to Another Office/Agency",
  FOLLOW_UP: "For Follow-up",
  NOT_PROVIDED: "Not Provided",
};

export const ASSISTANCE_TYPE_LABELS: Record<AssistanceType, string> = {
  FINANCIAL_ASSISTANCE: "Financial Assistance",
  MEDICAL_ASSISTANCE: "Medical Assistance",
  FOOD_ASSISTANCE: "Food Assistance",
  BURIAL_FUNERAL_ASSISTANCE: "Burial/Funeral Assistance",
  TRANSPORTATION_ASSISTANCE: "Transportation Assistance",
  EDUCATIONAL_ASSISTANCE: "Educational Assistance",
  PSYCHOSOCIAL_SUPPORT: "Psychosocial Support",
  REFERRAL_LINKAGE: "Referral/Linkage",
  OTHER: "Other",
};

export const ASSISTANCE_TYPE_OPTIONS = ASSISTANCE_TYPE_VALUES.map((value) => ({
  value,
  label: ASSISTANCE_TYPE_LABELS[value],
}));
