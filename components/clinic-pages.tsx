"use client";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  FileText,
  Filter,
  MoreVertical,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  Send,
  Trash2,
  Upload,
  UserPlus
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { currency, instructions, invoiceItems, medicines, patient, visits } from "@/lib/data";
import { Button, Card, Field, inputClass, textareaClass } from "./ui";
import { ClinicShell, profileTabs, quickActions } from "./clinic-shell";
import { PatientPreview } from "./patient-preview";

export function Dashboard({ onOpenCase, onCaseEntry }: { onOpenCase?: () => void; onCaseEntry?: () => void }) {
  const [notice, setNotice] = useState("");

  return (
    <ClinicShell>
      <div className="p-4 sm:p-8">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Good Morning, Dr. Harshita</h1>
            <p className="mt-2 text-muted">Here’s what’s happening at your clinic today.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex h-12 min-w-72 items-center gap-3 rounded-2xl border border-softgold/70 bg-white px-4 text-muted">
              <Search className="h-5 w-5" />
              <span className="text-sm">Search patient by name or phone...</span>
            </div>
            {onCaseEntry ? <Button variant="gold" onClick={onCaseEntry}><Plus className="h-4 w-4" /> Add Patient</Button> : <a href="/clinic/case" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-sm font-semibold text-white shadow-soft hover:bg-[#A57438]"><Plus className="h-4 w-4" /> Add Patient</a>}
          </div>
        </header>
        {notice && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {notice}
          </div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_430px]">
          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Today’s Visits <span className="rounded-full bg-linen px-3 py-1 text-sm text-gold">8</span></h2>
              <div className="flex gap-3">
                <Button variant="light"><CalendarDays className="h-4 w-4" /> Today, 13 May 2026</Button>
                <Button variant="light"><Filter className="h-4 w-4" /> Filter</Button>
              </div>
            </div>
            <div className="space-y-4">
              {visits.map((visit) => (
                <Card key={visit.name} className="p-5">
                  <div className="grid gap-4 md:grid-cols-[1.3fr_0.8fr_0.9fr_0.9fr_auto_auto] md:items-center">
                    <div className="flex items-center gap-4">
                      <div className="grid h-14 w-14 place-items-center rounded-full bg-linen font-bold text-gold">{visit.initials}</div>
                      <div>
                        <p className="font-bold">{visit.name}</p>
                        <p className="text-sm text-muted">{visit.phone}</p>
                        <p className="mt-2 flex items-center gap-2 text-xs text-muted"><Clock className="h-4 w-4" /> {visit.time}</p>
                      </div>
                    </div>
                    <Status label={visit.status} />
                    <div><p className="text-xs text-muted">Treatment</p><p className="font-semibold">{visit.treatment}</p></div>
                    <div><p className="text-xs text-muted">Next Step</p><Status label={visit.next} /></div>
                    {onOpenCase ? <Button variant="light" onClick={onOpenCase}>Open Case</Button> : <a href="/clinic/profile" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-softgold/70 bg-white/70 px-5 text-sm font-semibold text-ink hover:bg-white">Open Case</a>}
                    <MoreVertical className="h-5 w-5 text-muted" />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-softgold/50 pt-4">
                    {["Add Visit", "Generate Summary", "Generate Invoice"].map((item) => (
                      <button key={item} className="rounded-xl px-3 py-2 text-sm text-muted hover:bg-linen">{item}</button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>
          <aside className="space-y-5">
            <Card className="p-5">
              <h2 className="text-xl font-bold">Quick Actions</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: "Add Walk-In", icon: UserPlus },
                  { label: "New Appointment", icon: CalendarDays },
                  { label: "Scan QR", icon: QrCode },
                  { label: "Generate Invoice", icon: ReceiptText }
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => {
                      if (label === "Add Walk-In" || label === "New Appointment") {
                        if (onCaseEntry) onCaseEntry();
                        else window.location.href = "/clinic/case";
                      }
                      if (label === "Scan QR") setNotice("QR check-in link ready: /p/visit-ABCD123");
                      if (label === "Generate Invoice") {
                        if (onOpenCase) onOpenCase();
                        else window.location.href = "/clinic/profile";
                      }
                    }}
                    className="rounded-2xl border border-softgold/60 bg-white/70 p-4 text-sm font-semibold hover:border-gold"
                  >
                    <Icon className="mx-auto mb-3 h-6 w-6" />
                    {label}
                  </button>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-xl font-bold">Appointments</h2>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[["6", "Today"], ["4", "Upcoming"], ["1", "Missed"]].map(([num, label]) => (
                  <div key={label} className="rounded-2xl border border-softgold/60 bg-white/70 p-4">
                    <p className="text-2xl font-bold">{num}</p>
                    <p className="text-sm text-muted">{label}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-xl font-bold">Pending Treatments</h2>
              <div className="mt-4 space-y-3">
                {visits.slice(0, 4).map((visit) => (
                  <div key={visit.name} className="flex justify-between border-b border-softgold/50 pb-3 text-sm">
                    <span>{visit.name}</span>
                    <span className="text-muted">{visit.treatment}</span>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </ClinicShell>
  );
}

export function PatientProfile({ onBack, onCaseEntry }: { onBack?: () => void; onCaseEntry?: () => void }) {
  const [notice, setNotice] = useState("");
  const total = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  return (
    <ClinicShell active="Patients">
      <div className="p-4 sm:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          {onBack ? <button onClick={onBack} className="flex items-center gap-2 font-semibold"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</button> : <a href="/clinic" className="flex items-center gap-2 font-semibold"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</a>}
          <div className="flex flex-wrap gap-3">
            <Button variant="light" onClick={() => setNotice("Patient details are ready to edit in the V1 form.")}>Edit Patient</Button>
            {onCaseEntry ? <Button variant="light" onClick={onCaseEntry}><Plus className="h-4 w-4" /> Add Visit</Button> : <a href="/clinic/case" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-softgold/70 bg-white/70 px-5 text-sm font-semibold text-ink hover:bg-white"><Plus className="h-4 w-4" /> Add Visit</a>}
            <Button variant="gold" onClick={() => setNotice("Visit summary generated and shared to the patient portal.")}><FileText className="h-4 w-4" /> Generate Summary</Button>
          </div>
        </header>
        {notice && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {notice}
          </div>
        )}
        <Card className="mt-6 p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_420px] lg:items-center">
            <div className="flex flex-wrap items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-linen text-2xl font-bold">RS</div>
              <div>
                <h1 className="text-3xl font-bold">{patient.name} <span className="rounded-xl bg-sky-50 px-3 py-1 text-sm text-sky-700">{patient.gender}, {patient.age} Y</span></h1>
                <p className="mt-3 text-muted">{patient.phone} · {patient.email}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-xl border border-softgold/60 bg-white/70 px-3 py-2">Patient ID: {patient.id}</span>
                  <span className="rounded-xl border border-softgold/60 bg-white/70 px-3 py-2">First Visit: {patient.visitDate}</span>
                  <span className="rounded-xl border border-softgold/60 bg-white/70 px-3 py-2">Blood Group: O+</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-softgold/60 bg-white/70 p-5">
              <p className="font-bold">Next Appointment</p>
              <p className="mt-3 text-sm text-muted">{patient.nextVisit} · {patient.nextTime}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="font-semibold">{patient.stage}</span>
                <Button variant="light">Reschedule</Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-softgold/60 pb-2">
          {profileTabs.map((tab, index) => (
            <button key={tab} className={`whitespace-nowrap px-4 py-3 text-sm font-semibold ${index === 0 ? "border-b-2 border-gold text-gold" : "text-muted"}`}>{tab}</button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_430px]">
          <section className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold">Current Case</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]">
                <div className="rounded-2xl border border-softgold/60 bg-linen/50 p-4">
                  <Image src="/clinic-room.svg" alt="Dental case visual" width={360} height={220} className="h-40 w-full rounded-xl object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Tooth 46 - Deep Caries with Pulpal Involvement</h3>
                  <p className="mt-4 text-sm font-semibold">Diagnosis</p>
                  <p className="mt-1 text-muted">Deep decay involving the nerve of lower right first molar.</p>
                  <p className="mt-4 text-sm font-semibold">Recommended Treatment</p>
                  <p className="mt-1 text-muted">{patient.treatment}</p>
                  <p className="mt-4 rounded-2xl bg-linen p-3 text-sm text-gold">{patient.treatmentReason}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <h2 className="text-xl font-bold">Visits & Progress</h2>
              <div className="mt-5 space-y-5">
                {["Consultation & Diagnosis", "RCT - Session 1", "RCT - Next Session"].map((visit, index) => (
                  <div key={visit} className="flex gap-4">
                    <span className={`mt-1 h-4 w-4 rounded-full ${index === 2 ? "bg-softgold" : index === 1 ? "bg-gold" : "bg-emerald-600"}`} />
                    <div className="flex-1 border-b border-softgold/50 pb-4">
                      <p className="text-sm text-muted">{index === 2 ? "19 May 2026" : "12 May 2026"} · {index === 0 ? "10:30 AM" : index === 1 ? "11:30 AM" : "5:30 PM"}</p>
                      <p className="font-bold">{visit}</p>
                      <p className="text-sm text-muted">{index === 0 ? "Examination, X-ray and treatment planning done." : index === 1 ? "Access opening and cleaning done." : "Cleaning, shaping and medicament placement."}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
          <aside className="space-y-6">
            <Card className="p-5">
              <h2 className="text-xl font-bold">Quick Actions</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {quickActions.slice(0, 4).map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => {
                      if (label === "Generate Invoice") setNotice("Invoice generated for today's visit.");
                      else if (onCaseEntry) onCaseEntry();
                      else window.location.href = "/clinic/case";
                    }}
                    className="rounded-2xl border border-softgold/60 bg-white/70 p-4 text-sm font-semibold hover:border-gold"
                  >
                    <Icon className="mx-auto mb-3 h-6 w-6" />
                    {label}
                  </button>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-xl font-bold">Prescriptions (Current)</h2>
              <div className="mt-4 space-y-4">
                {medicines.map((med) => <p key={med.name} className="border-b border-softgold/50 pb-3 text-sm"><b>{med.name}</b><br /><span className="text-muted">{med.dosage}, {med.frequency.toLowerCase()} after food for {med.duration}</span></p>)}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-xl font-bold">Today’s Payment</h2>
              <div className="mt-4 space-y-3">
                {invoiceItems.map((item) => <div key={item.service} className="flex justify-between text-sm"><span>{item.service}</span><span>{currency.format(item.amount)}</span></div>)}
                <div className="flex justify-between border-t border-softgold/60 pt-3 font-bold"><span>Total Paid</span><span className="text-gold">{currency.format(total)}</span></div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </ClinicShell>
  );
}

export function CaseEntry({ onBack }: { onBack?: () => void }) {
  const [selected, setSelected] = useState("RCT");
  const [status, setStatus] = useState("");
  const total = useMemo(() => invoiceItems.reduce((sum, item) => sum + item.amount, 0), []);
  return (
    <ClinicShell active="Patients">
      <div className="p-4 sm:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          {onBack ? <button onClick={onBack} className="flex items-center gap-2 font-semibold"><ArrowLeft className="h-4 w-4" /> Back to Patients</button> : <a href="/clinic/profile" className="flex items-center gap-2 font-semibold"><ArrowLeft className="h-4 w-4" /> Back to Patients</a>}
          <div className="flex flex-wrap gap-3">
            <Button variant="light" onClick={() => setStatus("Draft saved.")}>Save Draft</Button>
            <Button variant="light" onClick={() => setStatus("Visit saved.")}>Save Visit</Button>
            <Button variant="gold" onClick={() => setStatus("Summary, prescription, invoice and consent are generated for the patient portal.")}><Send className="h-4 w-4" /> Generate & Send</Button>
          </div>
        </header>
        {status && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {status}
          </div>
        )}
        <div className="mt-6 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-linen text-xl font-bold">RS</div>
          <div>
            <h1 className="text-2xl font-bold">{patient.name} <span className="rounded-xl bg-sky-50 px-3 py-1 text-sm text-sky-700">Male, 32 Y</span></h1>
            <p className="mt-2 text-sm text-muted">{patient.phone} · Last visit: {patient.visitDate}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_520px]">
          <section className="space-y-5">
            <Card className="p-5">
              <h2 className="text-xl font-bold">Clinical Details</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-[1fr_220px]">
                <Field label="Diagnosis"><select className={inputClass}><option>Deep caries with pulpal involvement</option><option>Generalized plaque deposits</option><option>Impacted third molar</option></select></Field>
                <Field label="Tooth Number"><select className={inputClass}><option>46</option><option>36</option><option>11</option><option>Other</option></select></Field>
              </div>
              <div className="mt-5">
                <p className="mb-3 text-xs font-semibold text-muted">Recommended Treatment</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {["RCT", "Crown", "Filling", "Extraction", "Implant", "Scaling", "Other"].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setSelected(chip)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${selected === chip ? "border-gold bg-linen text-gold" : "border-softgold/70 bg-white/70"}`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Clinical Notes"><textarea className={textareaClass} defaultValue="Access opening done. Initial cleaning and shaping started. Patient tolerated well. Temporary dressing placed." /></Field>
            </Card>
            <Card className="p-5">
              <h2 className="text-xl font-bold">Medicines</h2>
              <div className="mt-4 space-y-3">
                {medicines.map((med) => (
                  <div key={med.name} className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.6fr_auto]">
                    <input className={inputClass} defaultValue={med.name} />
                    <input className={inputClass} defaultValue={med.dosage} />
                    <input className={inputClass} defaultValue={med.frequency} />
                    <input className={inputClass} defaultValue={med.duration} />
                    <button className="grid h-12 w-12 place-items-center rounded-2xl border border-softgold/60"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <Button variant="light" className="mt-4"><Plus className="h-4 w-4" /> Add Medicine</Button>
            </Card>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="p-5">
                <h2 className="text-xl font-bold">Instructions</h2>
                <div className="mt-4 space-y-3">
                  {instructions.map((item) => <p key={item} className="flex gap-3 text-sm text-muted"><Check className="h-4 w-4 text-emerald-700" /> {item}</p>)}
                </div>
              </Card>
              <Card className="p-5">
                <h2 className="text-xl font-bold">Next Visit</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input className={inputClass} defaultValue="19 May 2026" />
                  <select className={inputClass}><option>5:30 PM</option><option>6:00 PM</option></select>
                </div>
                <input className={`${inputClass} mt-3`} defaultValue="RCT - Next Session" />
              </Card>
            </div>
            <Card className="p-5">
              <h2 className="text-xl font-bold">Invoice Items</h2>
              <div className="mt-4 space-y-3">
                {invoiceItems.map((item) => (
                  <div key={item.service} className="grid gap-3 md:grid-cols-[1fr_1.2fr_160px_auto]">
                    <input className={inputClass} defaultValue={item.service} />
                    <input className={inputClass} defaultValue={item.description} />
                    <input className={inputClass} defaultValue={item.amount} />
                    <button className="grid h-12 w-12 place-items-center rounded-2xl border border-softgold/60"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between">
                <Button variant="light"><Plus className="h-4 w-4" /> Add Item</Button>
                <p className="text-xl font-bold">Total <span className="text-gold">{currency.format(total)}</span></p>
              </div>
            </Card>
          </section>
          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <Card className="max-h-[calc(100vh-3rem)] overflow-auto p-5 soft-scroll">
              <h2 className="mb-4 text-xl font-bold">Live Patient Preview</h2>
              <PatientPreview compact />
            </Card>
            <Card className="p-5">
              <h2 className="text-xl font-bold">Uploads</h2>
              <p className="mt-1 text-sm text-muted">X-rays, intraoral photos and reports.</p>
              <div className="mt-4 grid grid-cols-[1fr_80px_80px_80px] gap-3">
                <button className="rounded-2xl border border-dashed border-gold bg-linen/60 p-4 text-sm font-semibold text-gold"><Upload className="mx-auto mb-2 h-5 w-5" />Upload</button>
                <Image src="/clinic-room.svg" alt="X-ray upload" width={80} height={80} className="h-20 rounded-2xl object-cover" />
                <Image src="/clinic-room.svg" alt="Intraoral upload" width={80} height={80} className="h-20 rounded-2xl object-cover" />
                <div className="grid h-20 place-items-center rounded-2xl bg-linen font-bold">+2</div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </ClinicShell>
  );
}

function Status({ label }: { label: string }) {
  return <span className="inline-flex w-fit rounded-xl bg-linen px-3 py-2 text-xs font-semibold text-gold">{label}</span>;
}
