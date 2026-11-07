"use client";

import Image from "next/image";
import type { RegistryCategory, RegistryOfficer } from "@/components/admin/beneficiary-registry";

const lineInput = "min-w-0 w-full border-0 border-b border-[#111827] bg-transparent px-1 py-0.5 text-[10px] leading-tight text-[#111827] outline-none focus:border-[#0645AD] focus:ring-0";
const errorText = "mt-0.5 text-[9px] text-red-700";

function Field({ label, name, type = "text", error, className = "", required = false }: { label: string; name: string; type?: string; error?: string; className?: string; required?: boolean }) {
  return <label className={`flex min-w-0 items-end gap-1 text-[9px] leading-tight text-[#111827] ${className}`}><span className="shrink-0">{label}{required && "*"}</span><span className="min-w-0 flex-1"><input name={name} type={type} required={required} className={lineInput} />{error && <span className={errorText}>{error}</span>}</span></label>;
}

function TextAreaLine({ label, name, error, rows = 2 }: { label: string; name: string; error?: string; rows?: number }) {
  return <label className="block text-[9px] leading-tight text-[#111827]"><span className="font-semibold">{label}</span><textarea name={name} rows={rows} className="mt-0.5 block w-full resize-none border-0 border-b border-[#111827] bg-transparent px-1 py-0.5 text-[10px] leading-tight outline-none focus:border-[#0645AD] focus:ring-0" />{error && <span className={errorText}>{error}</span>}</label>;
}

export function SoloParentOfficialFields({
  category,
  officers,
  officerMode,
  fieldErrors,
}: {
  category: RegistryCategory;
  officers: RegistryOfficer[];
  officerMode: boolean;
  fieldErrors?: Record<string, string>;
}) {
  const error = (field: string) => fieldErrors?.[field];
  return (
    <>
      <input type="hidden" name="categoryId" value={category.id} />
      <div className="solo-parent-paper mx-auto w-full max-w-[820px] border border-[#111827] bg-white p-4 text-[#111827] shadow-sm sm:p-7">
        <header className="border-b-2 border-[#111827] pb-2">
          <div className="grid grid-cols-[58px_1fr_58px] items-center gap-2 sm:grid-cols-[72px_1fr_72px]">
            <Image src="/images/municipal-seal.png" alt="Municipality of Mahayag seal" width={72} height={72} className="h-14 w-14 object-contain sm:h-[70px] sm:w-[70px]" />
            <div className="text-center text-[8px] leading-[1.15] sm:text-[10px]">
              <p>Republic of the Philippines</p><p>Province of Zamboanga del Sur</p><p className="font-bold uppercase">Municipal Social Welfare and Development Office</p><p>Mahayag, Zamboanga del Sur</p><p>Mobile Nos. 0963-286-8189 / 0953-267-8147</p><p>E-mail Address: bagaslaoft@gmail.com</p>
            </div>
            <Image src="/images/solo-parent-mswd-seal.png" alt="Municipal Social Welfare and Development Office seal" width={72} height={72} className="h-14 w-14 object-contain sm:h-[70px] sm:w-[70px]" />
          </div>
        </header>

        <h1 className="mt-2 text-[11px] font-bold uppercase sm:text-[13px]">Application Form:</h1>
        <h2 className="text-center text-[12px] font-bold underline sm:text-[15px]">SOLO PARENT IDENTIFICATION CARD</h2>

        <section className="mt-3 space-y-1">
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-[1.55fr_1fr_1fr]"><label className="flex min-w-0 items-end gap-1 text-[9px] leading-tight"><span className="shrink-0">Name:</span><span className="grid min-w-0 flex-1 grid-cols-3 gap-1"><input name="firstName" placeholder="First" required className={lineInput} /><input name="middleName" placeholder="Middle" className={lineInput} /><input name="lastName" placeholder="Last" required className={lineInput} /></span></label><Field label="Age:" name="age" /><label className="flex items-end gap-1 text-[9px]">Sex:<select name="sex" defaultValue="MALE" required className={lineInput}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></label></div>
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2"><Field label="Date of Birth:" name="dateOfBirth" type="date" error={error("dateOfBirth")} /><Field label="Place of Birth:" name="placeOfBirth" error={error("placeOfBirth")} /></div>
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-[2fr_1fr]"><Field label="Address:" name="address" error={error("address")} required /><Field label="Barangay:" name="barangay" error={error("barangay")} required /></div>
          <Field label="Highest Educational Attainment:" name="highestEducationalAttainment" error={error("highestEducationalAttainment")} />
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2"><Field label="Occupation:" name="occupation" error={error("occupation")} /><Field label="Monthly Income:" name="monthlyIncome" type="number" error={error("monthlyIncome")} /></div>
          <Field label="Total Monthly Family Income:" name="totalMonthlyFamilyIncome" type="number" error={error("totalMonthlyFamilyIncome")} />
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2"><Field label="Age:" name="ageForm" /><Field label="MOBILE NUMBER:" name="mobileNumber" type="tel" error={error("mobileNumber")} /></div>
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2"><Field label="Religion:" name="religion" error={error("religion")} /><Field label="Contact No.:" name="contactNumber" type="tel" error={error("contactNumber")} /></div>
        </section>

        <section className="mt-2 text-[9px]">
          <p className="font-semibold">Marital Status (Please check):</p>
          <div className="grid grid-cols-2 gap-y-1 pl-10 sm:grid-cols-3">
            {[['SINGLE', 'Single'], ['ANNULLED', 'Annulled'], ['WIDOWED', 'Widow / Widower'], ['MARRIED', 'Married'], ['SEPARATED', 'Separated (w / certificate of Legal Separation)']].map(([value, label]) => <label key={value} className="inline-flex items-center gap-1"><input type="radio" name="soloParentMaritalStatus" value={value} required className="h-3 w-3 appearance-none rounded-none border border-[#111827] checked:bg-[#111827]" />{label}</label>)}
          </div>
        </section>

        <section className="mt-3">
          <p className="text-[10px] font-bold">I. FAMILY COMPOSITION</p><p className="text-[8px]">(Include all family members and other members of the household.)</p>
          <div className="mt-1 overflow-x-auto"><table className="w-full min-w-[650px] border-collapse text-[8px]"><thead><tr>{['Name', 'Relationship', 'Age', 'Civil\nStatus', 'Educational\nAttainment', 'Occupation & Monthly\nIncome'].map((heading) => <th key={heading} className="border border-[#111827] px-1 py-1 text-center font-semibold whitespace-pre-line">{heading}</th>)}</tr></thead><tbody>{Array.from({ length: 8 }, (_, index) => <tr key={index}>{['familyMemberName', 'familyMemberRelationship', 'familyMemberAge', 'familyMemberCivilStatus', 'familyMemberEducation', 'familyMemberOccupationIncome'].map((name) => <td key={name} className="h-6 border border-[#111827] p-0.5"><input name={name} aria-label={`${name} ${index + 1}`} className="h-5 w-full border-0 bg-transparent px-1 text-[8px] outline-none focus:bg-blue-50" /></td>)}</tr>)}</tbody></table></div>
          <p className="text-center text-[7px]">(Please fill-out entirely and attach separate sheet if necessary.)</p>
        </section>

        <section className="mt-3 space-y-1 text-[9px]"><p className="font-bold">II. Classification/ Circumstances of being a Solo Parent:</p><TextAreaLine label="Incidence:" name="classification" error={error("classification")} rows={1} /><Field label="When:" name="incidenceDate" type="date" error={error("incidenceDate")} /></section>
        <section className="mt-3"><p className="text-[9px] font-bold">III. Needs/ Problems of Solo Parent:</p><TextAreaLine label="" name="needsProblems" error={error("needsProblems")} rows={3} /></section>
        <section className="mt-3"><p className="text-[9px] font-bold">IV. Family Resources:</p><TextAreaLine label="" name="familyResources" error={error("familyResources")} rows={3} /></section>

        <p className="mt-4 text-center text-[8px] leading-tight">I hereby certify that the information given above are true and correct. I further UNDERSTAND that any misinterpretations that may have made will subject me to criminal and civil liabilities provided by the existing laws.</p>
        <div className="mt-4 grid grid-cols-2 gap-10 text-center text-[8px]"><div><input name="signatureDate" type="date" className={`${lineInput} text-center`} /><p>Date</p></div><div><input name="applicantSignatureName" className={`${lineInput} text-center`} /><p>Signature/ Thumbmark over Printed Name</p></div></div>

        <div className="mt-5 border-t border-[#111827] pt-2"><p className="text-center text-[8px]">----Portion to be filled up by the worker----</p><div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr]"><div className="border border-[#111827] p-1 text-[8px]"><p className="font-semibold">Submitted Requirements:</p><textarea name="submittedRequirements" rows={2} className="mt-1 w-full resize-none border-b border-[#111827] bg-transparent text-[9px] outline-none" /><Field label="ID No." name="soloParentIdNumber" error={error("idNumber")} /></div><div className="border border-[#111827] p-1 text-[8px]"><p className="font-semibold">(pls. check the letter)</p><label className="block"><input type="radio" name="povertyThreshold" value="ABOVE" required className="mr-1 h-3 w-3 appearance-none rounded-none border border-[#111827] checked:bg-[#111827]" />A (Above Poverty Threshold)</label><label className="block"><input type="radio" name="povertyThreshold" value="BELOW" required className="mr-1 h-3 w-3 appearance-none rounded-none border border-[#111827] checked:bg-[#111827]" />B (Below Poverty Threshold)</label><div className="mt-1 grid grid-cols-2 gap-2"><Field label="Date Issued" name="dateIssued" type="date" /><Field label="Expiry Date" name="expiryDate" type="date" /></div></div></div><div className="mt-2 grid gap-1 sm:grid-cols-2"><Field label="Interviewed and Assessed by:" name="interviewedAssessedBy" error={error("interviewedAssessedBy")} /><Field label="Date:" name="assessmentDate" type="date" /></div><p className="mt-2 text-[7px]">CSWDO Form _Prog _ No. 001 (2017)</p></div>
      </div>
      {!officerMode && <div className="mx-auto mt-4 max-w-[820px] rounded-lg border border-dashed border-[#9CB6DA] bg-[#F8FAFE] p-3"><p className="text-xs font-semibold text-[#173B70]">System assignment (not part of the official form)</p><label className="mt-2 block text-xs text-[#405B80]">Assigned officer<select name="assignedOfficerId" defaultValue="" className="mt-1 h-10 w-full rounded-lg border border-[#DCE3EE] bg-white px-3 text-sm"><option value="">Unassigned</option>{officers.map((officer) => <option key={officer.id} value={officer.id}>{officer.name}</option>)}</select></label></div>}
    </>
  );
}
