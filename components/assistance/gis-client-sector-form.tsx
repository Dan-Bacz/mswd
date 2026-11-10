import Image from "next/image";
import { MAHAYAG_BARANGAYS } from "@/lib/locations";

type Beneficiary = {
  firstName: string;
  middleName: string | null;
  lastName: string;
  sex: string;
  dateOfBirth: Date | null;
  age: number | null;
  address: string;
  barangay: string | null;
  contactNumber: string | null;
  municipality: string | null;
  province: string | null;
};

type SavedFormData = Record<string, unknown>;

function value(data: SavedFormData | undefined, key: string, fallback = "") {
  const saved = data?.[key];
  if (Array.isArray(saved)) return saved.join(", ");
  return typeof saved === "string" || typeof saved === "number" ? String(saved) : fallback;
}

function dateValue(date: Date | null | undefined) {
  return date ? date.toISOString().slice(0, 10) : "";
}

const line = "h-7 w-full border-0 border-b border-black bg-transparent px-1 text-[10px] outline-none focus:border-[#0645AD] focus:ring-0";
const selectLine = `${line} cursor-pointer`;
const field = "flex items-end gap-1 text-[9px] leading-tight";

function TextField({ label, name, defaultValue = "", type = "text", className = "" }: { label: string; name: string; defaultValue?: string; type?: string; className?: string }) {
  return <label className={`${field} ${className}`}><span className="shrink-0">{label}</span><input name={name} type={type} defaultValue={defaultValue} className={`${line} min-w-0 flex-1`} /></label>;
}

function SelectField({ label, name, options, defaultValue = "", className = "" }: { label: string; name: string; options: readonly [string, string][]; defaultValue?: string; className?: string }) {
  return <label className={`${field} ${className}`}><span className="shrink-0">{label}</span><select name={name} defaultValue={defaultValue} className={`${selectLine} min-w-0 flex-1`}>{options.map(([option, optionLabel]) => <option key={option} value={option}>{optionLabel}</option>)}</select></label>;
}

function AreaField({ label, name, rows = 3, defaultValue = "", className = "" }: { label: string; name: string; rows?: number; defaultValue?: string; className?: string }) {
  return <label className={`block text-[9px] ${className}`}><span className="font-bold">{label}</span><textarea name={name} rows={rows} defaultValue={defaultValue} className="mt-1 block w-full resize-none border border-black bg-transparent p-1 text-[10px] outline-none focus:border-[#0645AD] focus:ring-1 focus:ring-[#0645AD]" /></label>;
}

function CheckField({ name, label, checked }: { name: string; label: string; checked?: boolean }) {
  return <label className="flex items-center gap-1 text-[8px]"><input type="checkbox" name={name} value={label} defaultChecked={checked} className="h-3 w-3 rounded-none border border-black accent-[#0645AD]" />{label}</label>;
}

export function GisClientSectorForm({ beneficiary, savedData }: { beneficiary?: Beneficiary; savedData?: SavedFormData }) {
  const fallbackName = beneficiary ? { first: beneficiary.firstName, middle: beneficiary.middleName ?? "", last: beneficiary.lastName } : { first: "", middle: "", last: "" };
  const fallbackAddress = beneficiary?.address ?? "";
  const savedCategories = savedData?.gisClientCategory;
  const categoryList = Array.isArray(savedCategories) ? savedCategories : typeof savedCategories === "string" ? [savedCategories] : [];

  return (
    <section className="overflow-hidden border-2 border-black bg-white text-black shadow-sm">
      <header className="grid grid-cols-[58px_1fr_150px] items-center border-b-2 border-black p-2 sm:grid-cols-[78px_1fr_180px]">
        <Image src="/images/municipal-seal.png" alt="Municipality of Mahayag seal" width={78} height={78} className="h-14 w-14 object-contain sm:h-[70px] sm:w-[70px]" />
        <div className="text-center text-[8px] leading-tight sm:text-[10px]"><p className="font-semibold">Republic of the Philippines</p><p>Municipality of Mahayag</p><p className="font-bold uppercase">Municipal Social Welfare and Development Office</p><p>MAHAYAG, ZAMBOANGA DEL SUR</p></div>
        <div className="border border-black text-center text-[12px] font-bold leading-tight sm:text-[15px]">GENERAL<br />INTAKE SHEET</div>
      </header>

      <div className="grid grid-cols-[1fr_160px] border-b border-black text-[8px] sm:grid-cols-[1fr_190px]"><p className="p-1 font-bold uppercase">I. Client&apos;s identifying information:</p><div className="grid grid-cols-3 text-center"><span className="border-l border-black p-1">MONTH</span><span className="border-l border-black p-1">DAY</span><span className="border-l border-black p-1">YEAR</span></div></div>

      <div className="space-y-1 border-b border-black p-2">
        <div className="grid gap-1 sm:grid-cols-4"><TextField label="PCN" name="gisPcn" defaultValue={value(savedData, "gisPcn")} /><TextField label="Status" name="gisClientStatus" defaultValue={value(savedData, "gisClientStatus")} /><div className="flex items-center gap-2"><CheckField name="gisStatus" label="Approved" checked={value(savedData, "gisStatus") === "Approved"} /><CheckField name="gisStatus" label="Disapproved" checked={value(savedData, "gisStatus") === "Disapproved"} /></div><TextField label="Remarks" name="gisRemarks" defaultValue={value(savedData, "gisRemarks")} /></div>
        <div className="grid gap-1 border-t border-black pt-1 sm:grid-cols-3"><TextField label="MOBILE NO." name="gisMobileNumber" type="tel" defaultValue={value(savedData, "gisMobileNumber", beneficiary?.contactNumber ?? "")} /><TextField label="Age" name="gisAge" type="number" defaultValue={value(savedData, "gisAge", beneficiary?.age ? String(beneficiary.age) : "")} /><SelectField label="2. Sex" name="gisSex" defaultValue={value(savedData, "gisSex", beneficiary?.sex ?? "")} options={[["", "Select"], ["MALE", "Male"], ["FEMALE", "Female"], ["OTHER", "Other"]]} /></div>
        <div className="grid gap-1 sm:grid-cols-[1.7fr_1fr]"><label className={`${field} min-w-0`}>1. Client&apos;s Name<span className="grid min-w-0 flex-1 grid-cols-3 gap-1"><input name="gisLastName" placeholder="Last Name" defaultValue={value(savedData, "gisLastName", fallbackName.last)} className={line} /><input name="gisFirstName" placeholder="First Name" defaultValue={value(savedData, "gisFirstName", fallbackName.first)} className={line} /><input name="gisMiddleName" placeholder="Middle Name" defaultValue={value(savedData, "gisMiddleName", fallbackName.middle)} className={line} /></span></label><TextField label="3. Date of Birth" name="gisDateOfBirth" type="date" defaultValue={value(savedData, "gisDateOfBirth", dateValue(beneficiary?.dateOfBirth))} /></div>
        <TextField label="4. Present Address" name="gisAddress" defaultValue={value(savedData, "gisAddress", fallbackAddress)} />
        <div className="grid gap-1 sm:grid-cols-[1.3fr_1fr_1fr]"><TextField label="5. Place of Birth" name="gisPlaceOfBirth" defaultValue={value(savedData, "gisPlaceOfBirth")} /><TextField label="6. Relationship to Beneficiary" name="gisRelationship" defaultValue={value(savedData, "gisRelationship")} /><SelectField label="Barangay" name="gisBarangay" defaultValue={value(savedData, "gisBarangay", beneficiary?.barangay ?? "")} options={[["", "Select barangay"], ...MAHAYAG_BARANGAYS.map((barangay) => [barangay, barangay] as [string, string])]} /></div>
        <div className="grid gap-1 sm:grid-cols-4"><SelectField label="7. Civil Status" name="gisCivilStatus" defaultValue={value(savedData, "gisCivilStatus")} options={[["", "Select"], ["SINGLE", "Single"], ["MARRIED", "Married"], ["WIDOWED", "Widowed"], ["SEPARATED", "Separated"], ["DIVORCED", "Divorced"], ["OTHERS", "Others"]]} /><TextField label="8. Religion" name="gisReligion" defaultValue={value(savedData, "gisReligion")} /><TextField label="9. Nationality" name="gisNationality" defaultValue={value(savedData, "gisNationality", "FILIPINO")} /><TextField label="10. Education" name="gisEducation" defaultValue={value(savedData, "gisEducation")} /></div>
        <div className="grid gap-1 sm:grid-cols-4"><TextField label="11. Skills/Occupation" name="gisOccupation" defaultValue={value(savedData, "gisOccupation")} /><TextField label="12. Est. Monthly Income" name="gisMonthlyIncome" type="number" defaultValue={value(savedData, "gisMonthlyIncome")} /><TextField label="13. PhilHealth No." name="gisPhilhealthNo" defaultValue={value(savedData, "gisPhilhealthNo")} /><TextField label="16. Contact" name="gisContact" type="tel" defaultValue={value(savedData, "gisContact", beneficiary?.contactNumber ?? "")} /></div>
        <div className="grid gap-1 sm:grid-cols-3"><TextField label="14. Mode of Admission" name="gisModeOfAdmission" defaultValue={value(savedData, "gisModeOfAdmission")} /><TextField label="15. Referring Party" name="gisReferringParty" defaultValue={value(savedData, "gisReferringParty")} /><TextField label="Contact of Referring Party" name="gisReferringContact" defaultValue={value(savedData, "gisReferringContact")} /></div>
      </div>

      <div className="border-b border-black p-2"><p className="text-[9px] font-bold uppercase">II. Beneficiary&apos;s family composition</p><div className="mt-1 overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-[8px]"><thead><tr>{["Last Name", "First Name", "Middle Name", "Sex", "Birthday", "Civil Status", "Relationship", "Skills/Occupation", "Est. Monthly Income"].map((heading) => <th key={heading} className="border border-black px-1 py-1 text-center">{heading}</th>)}</tr></thead><tbody>{Array.from({ length: 6 }, (_, row) => <tr key={row}>{["lastName", "firstName", "middleName", "sex", "birthday", "civilStatus", "relationship", "occupation", "income"].map((column) => <td key={column} className="h-7 border border-black p-0.5"><input name={`family${column[0].toUpperCase()}${column.slice(1)}_${row}`} defaultValue={value(savedData, `family${column[0].toUpperCase()}${column.slice(1)}_${row}`)} aria-label={`${headingLabel(column)} ${row + 1}`} className="h-6 w-full border-0 bg-transparent px-1 text-[8px] outline-none focus:bg-blue-50" /></td>)}</tr>)}</tbody></table></div></div>

      <div className="border-b border-black p-2"><p className="text-[9px] font-bold uppercase">IV. Assessment</p><div className="mt-1 grid gap-2 sm:grid-cols-[1fr_1fr_1fr]"><AreaField label="1. Problem Presented" name="gisAssessmentProblem" rows={8} defaultValue={value(savedData, "gisAssessmentProblem")} /><AreaField label="2. Social Worker&apos;s Assessment" name="gisSocialWorkerAssessment" rows={8} defaultValue={value(savedData, "gisSocialWorkerAssessment")} /><div className="border-l border-black pl-2"><p className="text-[9px] font-bold">3. Client&apos;s Category (check only one)</p>{["Children in Need of Special Protection", "Youth in Need of Special Protection", "Person with Disability", "Senior Citizen", "Family Head and other Needy Adult"].map((label) => <CheckField key={label} name="gisClientCategory" label={label} checked={categoryList.includes(label)} />)}<AreaField label="4. Client Sub-Category" name="gisClientSubCategory" rows={3} defaultValue={value(savedData, "gisClientSubCategory")} /></div></div></div>

      <div className="p-2 text-[9px]"><p className="font-bold">Financial / Material Assistance</p><div className="mt-1 grid gap-2 sm:grid-cols-[1fr_1fr_1fr]"><div className="space-y-1">{["Medical", "Burial", "Transportation", "Educational", "Food Subsidy", "Others"].map((label) => <CheckField key={label} name="gisFinancialType" label={label} checked={Array.isArray(savedData?.gisFinancialType) && savedData.gisFinancialType.includes(label)} />)}<TextField label="Specify" name="gisFinancialSpecify" defaultValue={value(savedData, "gisFinancialSpecify")} /></div><AreaField label="Value (Pesos)" name="gisFinancialValue" rows={4} defaultValue={value(savedData, "gisFinancialValue")} /><div className="space-y-2"><TextField label="Amount Extended" name="gisFinancialAmount" type="number" defaultValue={value(savedData, "gisFinancialAmount")} /><TextField label="Mode of Assistance" name="gisFinancialMode" defaultValue={value(savedData, "gisFinancialMode")} /><TextField label="Source of Assistance" name="gisFinancialSource" defaultValue={value(savedData, "gisFinancialSource")} /></div></div><div className="mt-2 grid gap-2 border-t border-black pt-2 sm:grid-cols-2"><div><p className="font-bold">Material Assistance</p>{["Food Pack", "Used Clothing", "Hot Meal", "Assistive Device", "Others"].map((label) => <CheckField key={label} name="gisMaterialType" label={label} checked={Array.isArray(savedData?.gisMaterialType) && savedData.gisMaterialType.includes(label)} />)}<TextField label="Specify" name="gisMaterialSpecify" defaultValue={value(savedData, "gisMaterialSpecify")} /></div><AreaField label="Source of Assistance" name="gisMaterialSource" rows={3} defaultValue={value(savedData, "gisMaterialSource")} /></div><div className="mt-2 grid gap-2 border-t border-black pt-2 sm:grid-cols-3"><TextField label="Client&apos;s Signature" name="gisClientSignature" defaultValue={value(savedData, "gisClientSignature")} /><TextField label="Interviewed by" name="gisInterviewedBy" defaultValue={value(savedData, "gisInterviewedBy")} /><TextField label="Date" name="gisIntakeDate" type="date" defaultValue={value(savedData, "gisIntakeDate")} /></div></div>
    </section>
  );
}

function headingLabel(column: string) {
  return { lastName: "Last Name", firstName: "First Name", middleName: "Middle Name", sex: "Sex", birthday: "Birthday", civilStatus: "Civil Status", relationship: "Relationship", occupation: "Skills/Occupation", income: "Income" }[column] ?? "Family member";
}
