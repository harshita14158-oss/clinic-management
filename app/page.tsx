import { ArrowRight, Building2, FileCheck2, MonitorSmartphone, Stethoscope } from "lucide-react";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between gap-4 rounded-[28px] border border-softgold/60 bg-paper/85 px-5 py-4 shadow-card">
        <Logo />
        <a href="/clinic" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-softgold/70 bg-white/70 px-5 text-sm font-semibold text-ink hover:bg-white">
          Clinic Login
        </a>
      </header>

      <section className="mt-6 overflow-hidden rounded-[34px] border border-softgold/60 bg-paper shadow-soft">
        <div className="clinic-visual grid min-h-[520px] items-end p-6 sm:p-10 lg:grid-cols-[1fr_420px]">
          <div className="max-w-2xl pb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Heal Dental Digital Clinic</p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink sm:text-6xl">
              A calm digital workflow for every dental visit.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
              Patients check in from a QR code. The clinic opens the case, prepares summary, prescription, invoice and consent, then the patient sees everything in one secure portal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/checkin" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white shadow-soft hover:bg-black">
                Start Patient Check-In <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/clinic" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-softgold/70 bg-white/70 px-5 text-sm font-semibold text-ink hover:bg-white">
                Open Clinic Dashboard
              </a>
            </div>
          </div>

          <Card className="p-5">
            <p className="text-sm font-semibold text-muted">Workflow paths</p>
            <div className="mt-4 grid gap-3">
              <FlowLink icon={MonitorSmartphone} label="Patient QR Registration" helper="Welcome, registration, checked-in state" href="/checkin" />
              <FlowLink icon={Building2} label="Clinic Workflow" helper="Dashboard, patient profile, case entry" href="/clinic" />
              <FlowLink icon={FileCheck2} label="Patient Portal" helper="Summary, documents, invoice, medicines" href="/p/visit-ABCD123" />
              <FlowLink icon={Stethoscope} label="Consent Screen" helper="Read, confirm and generate consent" href="/consent" />
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

function FlowLink({
  icon: Icon,
  label,
  helper,
  href
}: {
  icon: typeof MonitorSmartphone;
  label: string;
  helper: string;
  href: string;
}) {
  return (
    <a href={href} className="flex items-center gap-4 rounded-2xl border border-softgold/60 bg-white/75 p-4 text-left transition hover:border-gold hover:bg-white">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-linen text-gold">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-bold text-ink">{label}</span>
        <span className="mt-1 block text-sm text-muted">{helper}</span>
      </span>
    </a>
  );
}
