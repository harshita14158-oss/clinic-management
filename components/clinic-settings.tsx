"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, IndianRupee, Link2, Mail, MapPin, Phone, Save, UserRound, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ClinicShell } from "./clinic-shell";
import { Card } from "./ui";
import { ClinicSettings, defaultClinicSettings, loadClinicSettings, saveClinicSettings } from "@/lib/clinic-settings";

const fieldClass = "min-h-12 rounded-2xl border border-softgold/70 bg-white px-4 text-sm text-ink outline-none focus:border-gold";
const textareaClass = "min-h-28 rounded-2xl border border-softgold/70 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-gold";

export function ClinicSettingsPage() {
  const [settings, setSettings] = useState<ClinicSettings>(defaultClinicSettings);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setSettings(loadClinicSettings());
  }, []);

  function updateSetting<K extends keyof ClinicSettings>(key: K, value: ClinicSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveClinicSettings(settings);
    setNotice("Clinic settings saved. New appointments, portal links, and generated documents will use these details.");
  }

  function resetDefaults() {
    setSettings(defaultClinicSettings);
    saveClinicSettings(defaultClinicSettings);
    setNotice("Clinic settings reset to the default Heal Dental details.");
  }

  return (
    <ClinicShell active="Settings">
      <div className="p-4 sm:p-8">
        <header className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Clinic Settings</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-ink">Your Clinic Details</h1>
          <p className="mt-3 text-muted">
            These details are used across WhatsApp messages, patient portal contact buttons, appointment confirmations, invoices, and prescriptions.
          </p>
        </header>

        {notice && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card className="p-5 sm:p-6">
              <SectionTitle icon={Building2} title="Clinic Identity" />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Clinic Name">
                  <input className={fieldClass} value={settings.clinicName} onChange={(event) => updateSetting("clinicName", event.target.value)} />
                </Field>
                <Field label="Display Name">
                  <input className={fieldClass} value={settings.clinicDisplayName} onChange={(event) => updateSetting("clinicDisplayName", event.target.value)} />
                </Field>
                <Field label="Doctor Name">
                  <input className={fieldClass} value={settings.doctorName} onChange={(event) => updateSetting("doctorName", event.target.value)} />
                </Field>
                <Field label="Dental Registration Number">
                  <input className={fieldClass} value={settings.registrationNumber} onChange={(event) => updateSetting("registrationNumber", event.target.value)} />
                </Field>
                <Field label="Doctor Qualification">
                  <input className={fieldClass} value={settings.doctorQualification} onChange={(event) => updateSetting("doctorQualification", event.target.value)} />
                </Field>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <SectionTitle icon={Phone} title="Contact & Location" />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Phone Number">
                  <input className={fieldClass} value={settings.phone} onChange={(event) => updateSetting("phone", event.target.value)} />
                </Field>
                <Field label="Email ID">
                  <input className={fieldClass} value={settings.email} onChange={(event) => updateSetting("email", event.target.value)} />
                </Field>
                <Field label="Website">
                  <input className={fieldClass} value={settings.website} onChange={(event) => updateSetting("website", event.target.value)} />
                </Field>
                <Field label="Google Maps Link">
                  <input className={fieldClass} value={settings.mapsUrl} onChange={(event) => updateSetting("mapsUrl", event.target.value)} />
                </Field>
                <Field label="Clinic Address" wide>
                  <textarea className={textareaClass} value={settings.address} onChange={(event) => updateSetting("address", event.target.value)} />
                </Field>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <SectionTitle icon={Link2} title="Review & Default Fees" />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Google Review Link" wide>
                  <input className={fieldClass} value={settings.googleReviewUrl} onChange={(event) => updateSetting("googleReviewUrl", event.target.value)} />
                </Field>
                <Field label="Consultation Fee">
                  <input className={fieldClass} value={settings.consultationFee} onChange={(event) => updateSetting("consultationFee", event.target.value)} />
                </Field>
                <Field label="X-ray Fee">
                  <input className={fieldClass} value={settings.xrayFee} onChange={(event) => updateSetting("xrayFee", event.target.value)} />
                </Field>
              </div>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="p-5">
              <h2 className="text-xl font-bold text-ink">Preview</h2>
              <div className="mt-5 space-y-4 text-sm">
                <PreviewLine icon={Building2} label="Clinic" value={settings.clinicDisplayName} />
                <PreviewLine icon={UserRound} label="Doctor" value={`${settings.doctorName} · ${settings.registrationNumber}`} />
                <PreviewLine icon={Phone} label="Phone" value={settings.phone} />
                <PreviewLine icon={Mail} label="Email" value={settings.email} />
                <PreviewLine icon={MapPin} label="Address" value={settings.address} />
                <PreviewLine icon={IndianRupee} label="Default Charges" value={`Consultation Rs. ${settings.consultationFee} · X-ray Rs. ${settings.xrayFee}`} />
              </div>
            </Card>

            <Card className="p-5">
              <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white shadow-soft">
                <Save className="h-4 w-4" />
                Save Settings
              </button>
              <button type="button" onClick={resetDefaults} className="mt-3 min-h-12 w-full rounded-2xl border border-softgold/70 bg-white px-5 text-sm font-semibold text-ink">
                Reset Defaults
              </button>
            </Card>
          </aside>
        </form>
      </div>
    </ClinicShell>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-linen text-gold">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="text-xl font-bold text-ink">{title}</h2>
    </div>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`grid gap-2 ${wide ? "md:col-span-2" : ""}`}>
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

function PreviewLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-softgold/50 bg-white/70 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <div>
        <p className="font-semibold text-muted">{label}</p>
        <p className="mt-1 leading-6 text-ink">{value}</p>
      </div>
    </div>
  );
}
