"use client";

import {
  CalendarDays,
  Check,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  HeartPulse,
  IndianRupee,
  Phone,
  Pill,
  ShieldCheck,
  Sparkles,
  Star
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { currency, documents, instructions, invoiceItems, medicines, patient } from "@/lib/data";
import { downloadPdf } from "@/lib/pdf";

export function PatientPreview({ compact = false }: { compact?: boolean }) {
  const [reviewed, setReviewed] = useState(false);
  const total = invoiceItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className={compact ? "space-y-3" : "mx-auto w-full max-w-[480px] px-4 py-5 sm:py-8"}>
      {!compact && (
        <section className="overflow-hidden rounded-[30px] border border-softgold/60 bg-paper shadow-card">
          <div className="clinic-visual min-h-52 p-6">
            <p className="text-sm font-semibold text-gold">Visit summary</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink">Hi {patient.firstName}</h1>
            <p className="mt-3 max-w-72 text-base leading-7 text-muted">
              Your consultation is complete. Here are your medicines, care steps and documents.
            </p>
          </div>
          <div className="grid grid-cols-2 border-t border-softgold/50 bg-white/55">
            <Meta label="Patient ID" value={patient.id} />
            <Meta label="Updated" value={patient.visitDate} />
          </div>
        </section>
      )}

      <section className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Appointment completed</p>
            <p className="mt-1 text-sm text-emerald-700">{patient.visitDate} at {patient.visitTime}</p>
          </div>
        </div>
      </section>

      <Section title="Treatment Summary" icon={<Star className="h-5 w-5" />}>
        <SummaryRow label="What we found" value={patient.finding} />
        <SummaryRow label="Recommended treatment" value={patient.treatment} />
        <SummaryRow label="Why it helps" value={patient.treatmentReason} />
      </Section>

      <Section title="Medicines" icon={<Pill className="h-5 w-5" />} action={!compact ? "Prescription" : undefined} onAction={() => downloadPdf("prescription")}>
        <div className="space-y-3">
          {medicines.map((medicine) => (
            <article key={medicine.name} className="rounded-2xl border border-softgold/50 bg-white/70 p-4">
              <p className="font-semibold text-ink">{medicine.name}</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {medicine.dosage}, {medicine.frequency.toLowerCase()} after food for {medicine.duration}.
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Care Instructions" icon={<HeartPulse className="h-5 w-5" />}>
        <div className="space-y-3">
          {instructions.map((item) => (
            <div key={item} className="flex gap-3 text-sm leading-6 text-muted">
              <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                <Check className="h-3 w-3" />
              </span>
              {item}
            </div>
          ))}
        </div>
      </Section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-[24px] border border-softgold/60 bg-paper p-4 shadow-card">
          <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-linen text-gold">
            <CalendarDays className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-muted">Next Visit</p>
          <p className="mt-2 font-bold text-ink">{patient.nextVisit}</p>
          <p className="text-sm text-muted">{patient.nextTime}</p>
        </div>
        <div className="rounded-[24px] border border-softgold/60 bg-paper p-4 shadow-card">
          <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-linen text-gold">
            <IndianRupee className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-muted">Charges</p>
          <p className="mt-2 font-bold text-ink">{currency.format(total)}</p>
          <p className="text-sm text-emerald-700">Paid today</p>
        </div>
      </section>

      <Section title="Documents" icon={<FolderOpen className="h-5 w-5" />}>
        <div className="space-y-2">
          {documents.map((doc) => (
            <button
              key={doc}
              onClick={() => downloadPdf(doc.includes("Prescription") ? "prescription" : doc.includes("Invoice") ? "invoice" : doc.includes("Consent") ? "consent" : "summary")}
              className="flex w-full items-center justify-between rounded-2xl border border-softgold/50 bg-white/70 px-4 py-3 text-left transition hover:border-gold"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-linen text-gold">
                  <FileText className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold text-ink">{doc.replace(" PDF", "")}</span>
                  <span className="text-sm text-muted">PDF</span>
                </span>
              </span>
              <Download className="h-4 w-4 text-gold" />
            </button>
          ))}
        </div>
      </Section>

      {!compact && (
        <div className="sticky bottom-3 z-10 mt-4 grid grid-cols-2 gap-3 rounded-[24px] border border-softgold/60 bg-paper/95 p-2 shadow-soft backdrop-blur">
          <button onClick={() => window.location.href = "tel:+919876543210"} className="flex min-h-12 items-center justify-center gap-2 rounded-[18px] border border-softgold/60 bg-white text-sm font-semibold text-ink">
            <Phone className="h-4 w-4" />
            Call Clinic
          </button>
          <button onClick={() => setReviewed(true)} className="flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-ink text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4" />
            {reviewed ? "Thank you" : "Review"}
          </button>
        </div>
      )}

      {!compact && (
        <p className="flex items-center justify-center gap-2 pb-4 pt-2 text-xs text-muted">
          <ShieldCheck className="h-4 w-4" />
          Your information is secure and private.
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  action,
  onAction
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <section className="mt-4 rounded-[24px] border border-softgold/60 bg-paper p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-linen text-gold">{icon}</span>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
        </div>
        {action && (
          <button onClick={onAction} className="flex items-center gap-1 text-sm font-semibold text-gold">
            {action}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-softgold/50 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 text-sm leading-6 text-ink">{value}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-softgold/50 p-4 last:border-r-0">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink">{value}</p>
    </div>
  );
}
