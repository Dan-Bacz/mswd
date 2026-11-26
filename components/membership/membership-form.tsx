"use client";

import Image from "next/image";
import { useState } from "react";
import { Printer, ShieldCheck } from "lucide-react";

type Member = {
  id: string;
  beneficiaryNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  sex: string;
  age: number | null;
  address: string;
  barangay: string | null;
  municipality: string | null;
  province: string | null;
  categoryName: string;
  assignedOfficerName: string | null;
};

export function MembershipForm({
  beneficiaries,
  officerMode,
}: {
  beneficiaries: Member[];
  officerMode: boolean;
}) {
  const first = beneficiaries[0];
  const [selectedId, setSelectedId] = useState(first?.id ?? "");
  const name = (member: Member | undefined) =>
    member
      ? [member.firstName, member.middleName, member.lastName, member.suffix]
          .filter(Boolean)
          .join(" ")
      : "";
  return (
    <main className="mx-auto max-w-6xl space-y-6 pb-10 print:max-w-none print:space-y-0">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A88724]">
            MSWD records
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#102A4C]">
            Membership Form
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Generate a formal proof of membership for a registered beneficiary
            and category.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0B4599] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#073783]"
        >
          <Printer className="h-4 w-4" />
          Print form
        </button>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
        <label className="block max-w-2xl text-sm font-semibold text-slate-700">
          Select beneficiary
          <select
            id="membership-beneficiary"
            value={selectedId}
            onChange={(event) => setSelectedId(event.currentTarget.value)}
            className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none focus:border-[#0B4599] focus:ring-4 focus:ring-blue-100"
          >
            <option value="" disabled>
              Select a beneficiary
            </option>
            {beneficiaries.map((beneficiary) => (
              <option key={beneficiary.id} value={beneficiary.id}>
                {name(beneficiary)} — {beneficiary.beneficiaryNumber} —{" "}
                {beneficiary.categoryName}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-3 text-xs text-slate-500">
          {officerMode
            ? "Only beneficiaries assigned to your selected category are available."
            : "Only registered beneficiaries are available for certification."}
        </p>
      </section>
      <Certificate
        beneficiaries={beneficiaries}
        selectedId={selectedId}
        name={name}
      />
    </main>
  );
}

function Certificate({
  beneficiaries,
  selectedId,
  name,
}: {
  beneficiaries: Member[];
  selectedId: string;
  name: (member: Member | undefined) => string;
}) {
  return (
    <div className="membership-certificate mx-auto max-w-[850px] border border-slate-300 bg-white p-0 text-[#111827] shadow-sm print:max-w-none print:border print:shadow-none">
      <div className="bg-white p-6 sm:p-10">
        <header className="border-b-2 border-[#111827] pb-4 text-center">
          <div className="mx-auto grid max-w-[720px] grid-cols-[96px_1fr] items-center gap-4 sm:grid-cols-[132px_1fr] sm:gap-6">
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <Image
                src="/images/municipal-seal.png"
                alt="Municipality of Mahayag seal"
                width={78}
                height={78}
                className="h-[62px] w-[62px] object-contain sm:h-[78px] sm:w-[78px]"
              />
              <Image
                src="/images/new mswd.png"
                alt="Bagong Pilipinas logo"
                width={78}
                height={78}
                className="h-[62px] w-[62px] object-contain sm:h-[78px] sm:w-[78px]"
              />
            </div>
            <div className="leading-[1.15]">
              <p className="text-[11px] font-medium sm:text-sm">Republic of the Philippines</p>
              <p className="text-[11px] font-medium sm:text-sm">Region IX-Zamboanga Peninsula</p>
              <p className="text-[11px] font-medium sm:text-sm">Province of Zamboanga del Sur</p>
              <p className="text-[12px] font-bold sm:text-base">Municipality of Mahayag</p>
              <p className="mt-1 text-[10px] italic text-[#0645AD] underline sm:text-xs">bagaslaoft@gmail.com</p>
            </div>
          </div>
          <div className="mx-auto mt-4 max-w-[720px] border-t border-[#111827] pt-2">
            <p className="text-xs font-black uppercase tracking-[0.08em] sm:text-base">Municipal Social Welfare and Development Office</p>
          </div>
          <div className="mt-7">
            <h2 className="text-xl font-black uppercase tracking-[0.1em] text-[#111827] sm:text-2xl">
              Certificate of Membership
            </h2>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Official proof of beneficiary registration
            </p>
          </div>
        </header>
        <div className="mt-10 text-center">
          <p className="text-sm leading-7">This is to certify that</p>
          <div
            className="mt-5 border-b-2 border-[#0B1C3A] pb-2 text-2xl font-bold uppercase tracking-wide"
            data-membership-name
          >
            {name(beneficiaries.find((member) => member.id === selectedId))}
          </div>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
            Name of beneficiary
          </p>
          <p className="mx-auto mt-7 max-w-2xl text-sm leading-7">
            is a registered beneficiary of the Municipal Social Welfare and
            Development Office under the following program or service category:
          </p>
          <div
            className="mt-5 border border-slate-300 bg-white px-5 py-4 text-xl font-bold text-[#111827]"
            data-membership-category
          >
            {beneficiaries.find((member) => member.id === selectedId)
              ?.categoryName ?? ""}
          </div>
        </div>
        <div className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
          <Detail
            label="Client ID"
            value={
              beneficiaries.find((member) => member.id === selectedId)
                ?.beneficiaryNumber ?? ""
            }
          />
          <Detail
            label="Age"
            value={String(
              beneficiaries.find((member) => member.id === selectedId)?.age ??
                "Not recorded",
            )}
          />
          <Detail
            label="Address"
            value={[
              beneficiaries.find((member) => member.id === selectedId)?.address,
              beneficiaries.find((member) => member.id === selectedId)?.barangay,
            ]
              .filter(Boolean)
              .join(", ")}
          />
          <Detail
            label="Date issued"
            value={new Date().toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
        </div>
        <p className="mt-9 text-center text-sm leading-7">
          This certification is issued upon the request of the beneficiary for
          whatever lawful purpose it may serve. This document is valid only when
          signed and sealed by the authorized MSWD officer.
        </p>
        <div className="mt-16 grid gap-12 text-center sm:grid-cols-2">
          <div className="border-t border-[#0B1C3A] pt-2 text-xs font-semibold uppercase">
            Prepared / issued by
            <br />
            <span className="font-normal">MSWD Authorized Officer</span>
          </div>
          <div className="border-t border-[#0B1C3A] pt-2 text-xs font-semibold uppercase">
            Municipal Social Welfare and Development Officer
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between border-t border-dashed border-slate-300 pt-4 text-[10px] text-slate-500">
          <span>Document reference: MSWD-MEMBERSHIP</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Official record
          </span>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-200 pb-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-medium">{value || "Not recorded"}</p>
    </div>
  );
}
