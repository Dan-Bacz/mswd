"use client";

type VawcData = Record<string, unknown>;

const pageFields = [
  ["Page 1 — Administrative and victim-survivor information", ["vawcIntakeDate", "vawcInterviewedBy", "vawcHandlingOrganization", "vawcReportingType", "lastName", "firstName", "middleName", "sex", "dateOfBirth", "address", "vawcVictimNationality", "vawcVictimCivilStatus", "vawcVictimAge"]],
  ["Page 2 — Victim-survivor information continuation", ["vawcVictimEthnicity", "vawcVictimOccupation", "vawcVictimMonthlyIncome", "vawcVictimEmployment", "vawcVictimMigratoryStatus", "vawcVictimCurrentAddress", "vawcInShelter", "vawcIsPwd", "vawcDisabilityType"]],
  ["Page 3 — Incident classification", ["vawcIncidentType", "vawcIncidentOtherCategory", "vawcIncidentSubcategory", "vawcIncidentNotes"]],
  ["Page 4 — Details of the incident", ["vawcIncidentDescription", "vawcIncidentDate", "vawcIncidentTime", "vawcIncidentLocation", "vawcIncidentPlaceType", "vawcElectronicMeans", "vawcElectronicMedium"]],
  ["Page 5 — Alleged perpetrator information", ["vawcPerpetratorLastName", "vawcPerpetratorFirstName", "vawcPerpetratorMiddleName", "vawcPerpetratorSex", "vawcPerpetratorBirthdate", "vawcPerpetratorAge", "vawcPerpetratorGuardian", "vawcPerpetratorNationality", "vawcPerpetratorOccupation", "vawcPerpetratorReligion", "vawcPerpetratorAddress", "vawcPerpetratorRelationship"]],
] as const;

const labels: Record<string, string> = {
  vawcIntakeDate: "Date of intake", vawcInterviewedBy: "Interviewed by", vawcHandlingOrganization: "Handling organization", vawcReportingType: "Type of reporting",
  lastName: "Last name", firstName: "First name", middleName: "Middle name", sex: "Sex", dateOfBirth: "Birthdate", address: "Address", vawcVictimNationality: "Nationality", vawcVictimCivilStatus: "Civil status", vawcVictimAge: "Age",
  vawcVictimEthnicity: "Ethnicity", vawcVictimOccupation: "Occupation", vawcVictimMonthlyIncome: "Monthly income", vawcVictimEmployment: "Employment", vawcVictimMigratoryStatus: "Migratory status", vawcVictimCurrentAddress: "Current address", vawcInShelter: "Staying in shelter", vawcIsPwd: "Person with disability", vawcDisabilityType: "Disability type",
  vawcIncidentType: "Incident category", vawcIncidentOtherCategory: "Other category", vawcIncidentSubcategory: "Subcategory", vawcIncidentNotes: "Incident notes", vawcIncidentDescription: "Description of incident", vawcIncidentDate: "Incident date", vawcIncidentTime: "Incident time", vawcIncidentLocation: "Geographic location", vawcIncidentPlaceType: "Type of place", vawcElectronicMeans: "Electronic means", vawcElectronicMedium: "Electronic medium",
  vawcPerpetratorLastName: "Perpetrator last name", vawcPerpetratorFirstName: "Perpetrator first name", vawcPerpetratorMiddleName: "Perpetrator middle name", vawcPerpetratorSex: "Perpetrator sex", vawcPerpetratorBirthdate: "Perpetrator birthdate", vawcPerpetratorAge: "Perpetrator age", vawcPerpetratorGuardian: "Parent or guardian", vawcPerpetratorNationality: "Perpetrator nationality", vawcPerpetratorOccupation: "Perpetrator occupation", vawcPerpetratorReligion: "Perpetrator religion", vawcPerpetratorAddress: "Perpetrator address", vawcPerpetratorRelationship: "Relationship to victim-survivor",
};

function displayValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  return String(value ?? "");
}

export function VawcIntakeProfile({ data }: { data: VawcData }) {
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Saved official form</p><h2 className="mt-1 text-xl font-bold text-slate-900">Annex D VAW Intake Form</h2><p className="mt-1 text-sm text-slate-500">Completed values are stored with this beneficiary and visible to authorized administrators and the assigned officer.</p></div><a href="/forms/Annex-D_VAW-Intake-Form.pdf" target="_blank" rel="noreferrer" className="rounded-lg border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50">Open blank official PDF</a></div>
    <div className="space-y-3">{pageFields.map(([title, fields], index) => { const entries = fields.filter((field) => displayValue(data[field] ?? "").trim()); return <details key={title} open className="overflow-hidden rounded-xl border border-slate-200"><summary className="cursor-pointer bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">{title}</summary><div className="grid gap-4 p-4 lg:grid-cols-[minmax(220px,38%)_1fr]"><img src={`/forms/annex-d-vawc/page-${index + 1}.png`} alt={`${title} official document page`} className="w-full rounded border border-slate-200" />{entries.length ? <dl className="grid content-start gap-3 sm:grid-cols-2">{entries.map((field) => <div key={field}><dt className="text-xs font-semibold text-slate-500">{labels[field] ?? field}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">{displayValue(data[field])}</dd></div>)}</dl> : <p className="text-sm text-slate-500">No saved responses on this page.</p>}</div></details>; })}</div>
  </section>;
}
