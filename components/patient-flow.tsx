"use client";

import { ArrowLeft, ArrowRight, Bell, CalendarDays, Check, ChevronDown, ClipboardList, Download, FileText, Globe2, Headphones, IndianRupee, Lock, Mail, MapPin, Phone, Pill, ShieldCheck, Signal, User, UserRound, Wifi } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { downloadVisitPdf, DynamicVisitPdfData, PdfKind } from "@/lib/pdf";
import { Logo } from "./logo";
import { ClinicSettings, defaultClinicSettings, loadClinicSettings, phoneHref } from "@/lib/clinic-settings";

type ConsentDraft = {
  patientId?: string;
  patientName: string;
  patientPhone: string;
  title: string;
  procedureSections?: Array<{
    title: string;
    treatmentDetails: string[];
    benefits: string[];
    risks: string[];
    alternatives: string[];
  }>;
  treatmentDetails: string[];
  benefits: string[];
  risks: string[];
  alternatives: string[];
  declaration: string;
  returnUrl: string;
};

type PatientPortalRecord = {
  token: string;
  patientId: string;
  visitId: string;
  patientName: string;
  patientPhone: string;
  ageGender: string;
  generatedAt: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicWebsite?: string;
  clinicName?: string;
  clinicDisplayName?: string;
  clinicAddress?: string;
  clinicMapsUrl?: string;
  googleReviewUrl?: string;
  documentKinds: PdfKind[];
  summaryGenerated: boolean;
  consentGenerated: boolean;
  data: DynamicVisitPdfData;
};

const defaultConsent: ConsentDraft = {
  patientName: "Patient",
  patientPhone: `+91 ${defaultClinicSettings.phone}`,
  title: "Dental Procedure Consent",
  treatmentDetails: ["Treatment details will appear here after the clinic generates the consent form."],
  benefits: ["Helps treat the diagnosed dental condition.", "Aims to relieve symptoms and improve oral health."],
  risks: ["Mild pain, swelling, sensitivity, bleeding, or discomfort may occur.", "Healing response can vary between patients.", "Additional treatment may be required depending on clinical findings."],
  alternatives: ["Observation, medication, delayed treatment, referral, or a different dental procedure depending on clinical suitability."],
  declaration: "I have read and understood the information about my treatment, including the possible benefits, risks, discomforts, alternatives, and the possibility that additional treatment may be required. I have had the opportunity to ask questions and I agree to proceed.",
  returnUrl: "/clinic/profile?patient=P-1024"
};

export function PatientLanding() {
  const [settings, setSettings] = useState<ClinicSettings>(defaultClinicSettings);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setSettings(loadClinicSettings());
    function updateTime() {
      setCurrentTime(new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }));
    }
    updateTime();
    const intervalId = window.setInterval(updateTime, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <main className="min-h-screen bg-[#fbf7f1] px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-[34px] border border-[#eadfce] bg-[#fffdfa] shadow-[0_24px_80px_rgba(76,54,31,0.16)] sm:max-w-[920px]">
        <div className="flex h-14 items-center justify-between px-7 text-[17px] font-semibold text-ink sm:h-16 sm:px-14 sm:text-xl">
          <span>{currentTime || "--:--"}</span>
          <div className="flex items-center gap-2">
            <Signal className="h-5 w-5 fill-ink" />
            <Wifi className="h-5 w-5" />
            <span className="h-5 w-9 rounded-[6px] border-2 border-ink p-[2px]">
              <span className="block h-full w-6 rounded-[3px] bg-ink" />
            </span>
          </div>
        </div>

        <header className="flex items-center justify-between gap-4 px-7 pb-7 pt-5 sm:px-16 sm:pb-10 sm:pt-8">
          <Logo />
          <div className="flex items-center gap-3 text-right text-sm font-semibold leading-5 text-ink sm:text-lg sm:leading-7">
            <ShieldCheck className="h-8 w-8 shrink-0 sm:h-10 sm:w-10" />
            <span>Secure &<br />Private</span>
          </div>
        </header>

        <section className="relative min-h-[360px] overflow-hidden border-t border-softgold/40 bg-[#f4eadc] px-7 py-10 sm:min-h-[450px] sm:px-16 sm:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(226,198,158,0.72),transparent_18rem),linear-gradient(90deg,#fffaf3_0%,rgba(255,250,243,0.92)_44%,rgba(231,211,183,0.78)_100%)]" />
          <div className="absolute right-0 top-0 hidden h-full w-[46%] border-l border-white/55 bg-[#d8bd99]/40 sm:block">
            <div className="absolute bottom-0 left-8 right-8 h-28 rounded-t-[22px] bg-white/65 shadow-card" />
            <div className="absolute right-12 top-12 h-40 w-36 rounded-[24px] bg-[#c9aa82]/55" />
            <div className="absolute right-20 top-24 text-center">
              <Logo compact />
              <p className="mt-3 font-serif text-3xl font-semibold tracking-[0.12em] text-ink">HEAL</p>
              <p className="text-xs font-semibold tracking-[0.2em] text-ink">DENTAL CLINIC</p>
            </div>
            <div className="absolute left-12 top-16 h-16 w-16 rounded-full bg-[#f2d8ab] shadow-[0_0_32px_rgba(185,133,67,0.36)]" />
            <div className="absolute left-20 top-0 h-24 w-px bg-ink/40" />
            <div className="absolute bottom-28 left-12 h-28 w-14 rounded-t-full bg-[#89956e]/55" />
          </div>

          <div className="relative max-w-[470px]">
            <p className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Welcome to</p>
            <h1 className="mt-4 text-5xl font-bold tracking-tight text-ink sm:text-6xl">Heal Dental Clinic</h1>
            <p className="mt-7 text-xl leading-9 text-muted sm:text-2xl sm:leading-10">
              We are happy to have you here.<br />Let us get you checked in.
            </p>
          </div>
        </section>

        <section className="relative -mt-16 px-5 pb-0 sm:-mt-20 sm:px-7">
          <div className="rounded-[28px] border border-[#eadfce] bg-white/92 p-6 shadow-[0_18px_48px_rgba(76,54,31,0.12)] backdrop-blur sm:rounded-[24px] sm:p-10">
            <div className="grid gap-6 sm:grid-cols-[104px_1fr]">
              <div className="hidden text-gold sm:block">
                <ClipboardList className="h-16 w-16 stroke-[1.5]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-ink sm:text-3xl">Let us get you checked in</h2>
                <p className="mt-2 text-lg text-muted sm:text-xl">It only takes a few minutes.</p>

                <div className="mt-7 space-y-4">
                  {["Share your basic details", "Help us understand your concern", "Save your time at reception", "All your information is secure"].map((item) => (
                    <div key={item} className="flex items-center gap-4 text-base text-ink sm:text-lg">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-linen text-gold">
                        <Check className="h-5 w-5" />
                      </span>
                      {item}
                    </div>
                  ))}
                </div>

                <div className="my-7 h-px bg-softgold/70" />

                <a
                  href="/register"
                  onClick={(event) => {
                    event.preventDefault();
                    window.location.assign("/register");
                  }}
                  className="flex min-h-[64px] w-full items-center justify-center gap-4 rounded-[18px] bg-ink px-6 text-xl font-bold text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition hover:bg-black"
                >
                  Get Started
                  <ArrowRight className="h-8 w-8" />
                </a>

                <div className="mt-5 flex items-center gap-4 rounded-[18px] border border-softgold/70 bg-[#fffaf4] p-4 text-sm leading-6 text-ink sm:p-5 sm:text-lg">
                  <Lock className="h-8 w-8 shrink-0" />
                  <p>Your data is safe with us and will never be shared. Read our <span className="font-semibold text-gold">Privacy Policy</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="grid gap-4 bg-linen/65 px-7 py-6 text-base text-muted sm:grid-cols-[1fr_auto_1fr] sm:px-16 sm:text-xl">
          <a href={phoneHref(settings.phone)} className="flex items-center gap-3">
            <Phone className="h-6 w-6" />
            {settings.phone}
          </a>
          <span className="hidden h-9 w-px bg-softgold sm:block" />
          <a href={`mailto:${settings.email}`} className="flex items-center gap-3 sm:justify-end">
            <Mail className="h-6 w-6" />
            {settings.email}
          </a>
        </footer>
      </div>
    </main>
  );
}

export function Registration() {
  const [medicalHistory, setMedicalHistory] = useState<string[]>([]);
  const [otherHistory, setOtherHistory] = useState("");
  const [patientId] = useState(() => `P-${Date.now().toString().slice(-5)}`);
  const [checkedAt] = useState(() => new Date().toISOString());
  const [repeatPhone, setRepeatPhone] = useState("");
  const [repeatPatient, setRepeatPatient] = useState<{
    id: string;
    name: string;
    phone: string;
    email?: string;
    ageGender?: string;
    chiefComplaint?: string;
    medicalHistory?: string;
    referralSource?: string;
  } | null>(null);
  const [repeatLookupMessage, setRepeatLookupMessage] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const combinedHistory = [...medicalHistory.filter((item) => item !== "Other"), otherHistory.trim()].filter(Boolean).join(", ");

  function toggleMedicalHistory(item: string) {
    setMedicalHistory((current) => {
      if (item === "None") return current.includes("None") ? [] : ["None"];
      const withoutNone = current.filter((value) => value !== "None");
      return withoutNone.includes(item) ? withoutNone.filter((value) => value !== item) : [...withoutNone, item];
    });
  }

  function normalizePhone(value: string) {
    return value.replace(/\D/g, "").slice(-10);
  }

  function repeatPatientAge() {
    return repeatPatient?.ageGender?.match(/\d+/)?.[0] || "";
  }

  function repeatPatientGender() {
    const parts = repeatPatient?.ageGender?.split(",").map((part) => part.trim()) ?? [];
    return parts.find((part) => /^(female|male|other)$/i.test(part)) || "";
  }

  function findRepeatPatient() {
    const phone = normalizePhone(repeatPhone);
    if (phone.length < 10) {
      setRepeatPatient(null);
      setRepeatLookupMessage("Please enter the 10 digit mobile number used earlier.");
      return;
    }

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith("healDentalPatient:")) continue;
      const saved = window.localStorage.getItem(key);
      if (!saved) continue;
      try {
        const patientRecord = JSON.parse(saved) as {
          id: string;
          name: string;
          phone: string;
          email?: string;
          ageGender?: string;
          chiefComplaint?: string;
          medicalHistory?: string;
          referralSource?: string;
        };
        if (normalizePhone(patientRecord.phone) === phone) {
          setRepeatPatient(patientRecord);
          setRepeatLookupMessage("");
          return;
        }
      } catch {
        // Ignore malformed local patient records.
      }
    }

    setRepeatPatient(null);
    setRepeatLookupMessage("We could not find this number. Please fill the first visit form below.");
  }

  function checkInRepeatPatient() {
    if (!repeatPatient) return;

    const params = new URLSearchParams({
      patientId: repeatPatient.id,
      checkedAt: new Date().toISOString(),
      name: repeatPatient.name,
      phone: repeatPatient.phone,
      email: repeatPatient.email || "",
      age: repeatPatientAge(),
      gender: repeatPatientGender(),
      complaint: repeatPatient.chiefComplaint || "Repeat visit",
      history: repeatPatient.medicalHistory || "Not added",
      referralSource: "Repeat patient"
    });

    window.location.assign(`/checked?${params.toString()}`);
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegistrationError("");
    setIsRegistering(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      age: String(form.get("age") || ""),
      gender: String(form.get("gender") || ""),
      address: String(form.get("address") || ""),
      chiefComplaint: String(form.get("complaint") || ""),
      medicalHistory: combinedHistory || "None"
    };

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json() as {
        patient?: { patientCode?: string; fullName?: string; phone?: string; email?: string; age?: number; gender?: string; address?: string; chiefComplaint?: string; medicalHistory?: string };
        visitToken?: string;
        error?: string;
      };

      if (!response.ok || !result.patient) {
        setRegistrationError(result.error || "Could not complete check-in. Please contact reception.");
        return;
      }

      const params = new URLSearchParams({
        patientId: result.patient.patientCode || patientId,
        checkedAt,
        visitToken: result.visitToken || "",
        name: result.patient.fullName || payload.fullName,
        phone: result.patient.phone || payload.phone,
        email: result.patient.email || payload.email,
        age: result.patient.age ? String(result.patient.age) : payload.age,
        gender: result.patient.gender || payload.gender,
        address: result.patient.address || payload.address,
        complaint: result.patient.chiefComplaint || payload.chiefComplaint,
        history: result.patient.medicalHistory || payload.medicalHistory,
        referralSource: String(form.get("referralSource") || "")
      });
      window.location.assign(`/checked?${params.toString()}`);
    } catch {
      setRegistrationError("Could not connect to clinic check-in. Please contact reception.");
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf3] px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <button className="hidden h-12 items-center gap-3 rounded-2xl border border-softgold/60 bg-white/80 px-5 text-sm font-semibold text-ink shadow-card sm:flex">
            <Globe2 className="h-4 w-4" />
            English
            <ChevronDown className="h-4 w-4" />
          </button>
        </header>

        <section className="relative mt-8 overflow-hidden pb-6 text-center sm:mt-5 sm:pb-10">
          <div className="pointer-events-none absolute right-0 top-8 hidden h-80 w-52 opacity-40 sm:block">
            <div className="absolute right-4 top-8 h-48 w-16 rounded-t-full bg-linen" />
            <div className="absolute right-16 top-20 h-44 w-16 rounded-t-full bg-linen/80 rotate-12" />
            <div className="absolute right-28 top-32 h-36 w-14 rounded-t-full bg-linen/70 rotate-[24deg]" />
          </div>
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-softgold/70 bg-white/80 text-gold shadow-card">
            <ClipboardList className="h-10 w-10 stroke-[1.5]" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Let us get you registered</h1>
          <p className="mt-3 text-base text-muted sm:text-lg">Tell us a little about yourself to help us prepare for your visit.</p>

          <div className="mx-auto mt-9 max-w-[560px]">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
              <div className="h-1 rounded-full bg-gold" />
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gold text-sm font-bold text-white">1</span>
              <div className="h-1 rounded-full bg-softgold/70" />
            </div>
            <div className="mt-3 grid grid-cols-2 text-sm font-semibold text-ink">
              <span>Your Details</span>
              <span className="text-muted">Almost Done</span>
            </div>
          </div>
        </section>

        <section className="mb-5 rounded-[28px] border border-softgold/70 bg-white/78 p-5 shadow-card backdrop-blur sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Already visited us?</p>
              <h2 className="mt-2 text-2xl font-bold text-ink">Check in with your mobile number</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                If this is not your first visit, enter your mobile number. We will use your saved profile and create a fresh visit for today.
              </p>
              <div className="mt-5 flex h-[58px] max-w-xl overflow-hidden rounded-2xl border border-softgold/70 bg-white">
                <span className="grid w-16 shrink-0 place-items-center border-r border-softgold/70 text-sm font-semibold text-ink">+91</span>
                <input
                  value={repeatPhone}
                  onChange={(event) => {
                    setRepeatPhone(event.target.value);
                    setRepeatLookupMessage("");
                    setRepeatPatient(null);
                  }}
                  className="min-w-0 flex-1 bg-transparent px-4 text-sm text-ink outline-none placeholder:text-muted/70"
                  placeholder="Enter your mobile number"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={findRepeatPatient}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-6 text-sm font-bold text-white shadow-soft hover:bg-black"
            >
              Find My Profile
            </button>
          </div>
          {repeatPatient && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div>
                <p className="text-sm font-semibold text-emerald-800">Welcome back, {repeatPatient.name}</p>
                <p className="mt-1 text-sm text-muted">{repeatPatient.phone} - {repeatPatient.id}</p>
              </div>
              <button
                type="button"
                onClick={checkInRepeatPatient}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gold px-5 text-sm font-bold text-white shadow-soft hover:bg-[#A57438]"
              >
                Check in for New Visit
              </button>
            </div>
          )}
          {repeatLookupMessage && (
            <p className="mt-4 rounded-2xl bg-linen/70 p-3 text-sm font-semibold text-muted">{repeatLookupMessage}</p>
          )}
        </section>

        <form className="rounded-[28px] border border-softgold/70 bg-white/78 p-5 shadow-soft backdrop-blur sm:p-9" onSubmit={submitRegistration}>
          <input type="hidden" name="patientId" value={patientId} />
          <input type="hidden" name="checkedAt" value={checkedAt} />
          <input type="hidden" name="history" value={combinedHistory || "None"} />
          <FormSection icon={<User className="h-6 w-6" />} title="Basic Details">
            <div className="grid gap-5 lg:grid-cols-2">
              <LabeledField label="Full Name" required>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                  <input name="name" required className={registerInputClass + " pl-12"} placeholder="Enter your full name" />
                </div>
              </LabeledField>

              <LabeledField label="Phone Number" required>
                <div className="flex h-[58px] overflow-hidden rounded-2xl border border-softgold/70 bg-white">
                  <button type="button" className="flex w-24 shrink-0 items-center justify-center gap-2 border-r border-softgold/70 text-sm">
                    <span>🇮🇳</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <span className="grid w-16 place-items-center border-r border-softgold/70 text-sm font-semibold text-ink">+91</span>
                  <input name="phone" required className="min-w-0 flex-1 bg-transparent px-4 text-sm text-ink outline-none placeholder:text-muted/70" placeholder="98765 43210" />
                </div>
              </LabeledField>

              <LabeledField label="Email Address">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                  <input name="email" className={registerInputClass + " pl-12"} placeholder="Enter your email address" />
                </div>
              </LabeledField>

              <div className="grid gap-5 sm:grid-cols-2">
                <LabeledField label="Age" required>
                  <input name="age" required className={registerInputClass} placeholder="Enter your age" />
                </LabeledField>
                <LabeledField label="Gender">
                  <div className="relative">
                    <select name="gender" className={registerInputClass + " appearance-none pr-12"} defaultValue="">
                      <option value="" disabled>Select gender</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                  </div>
                </LabeledField>
              </div>

              <div className="lg:col-span-2">
                <LabeledField label="Address">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                    <input name="address" className={registerInputClass + " pl-12"} placeholder="Enter your full address" />
                  </div>
                </LabeledField>
              </div>

              <div className="lg:col-span-2">
                <LabeledField label="How did you find us?">
                  <div className="relative">
                    <select name="referralSource" className={registerInputClass + " appearance-none pr-12"} defaultValue="">
                      <option value="" disabled>Select one</option>
                      <option>Google / Internet search</option>
                      <option>Social media</option>
                      <option>Friend or family referral</option>
                      <option>Walk-in / nearby clinic</option>
                      <option>Existing patient</option>
                      <option>Other</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                  </div>
                </LabeledField>
              </div>
            </div>
          </FormSection>

          <div className="my-8 h-px bg-softgold/70" />

          <FormSection icon={<Logo compact />} title="Tell us more">
            <div className="grid gap-7 lg:grid-cols-2">
              <LabeledField label="Chief Complaint">
                <textarea name="complaint" className="min-h-32 w-full rounded-2xl border border-softgold/70 bg-white p-4 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-gold focus:ring-4 focus:ring-softgold/30" placeholder="What seems to be the problem?" />
                <p className="mt-2 text-sm text-muted">E.g. Tooth pain, sensitivity, swelling, etc.</p>
              </LabeledField>

              <div>
                <p className="text-sm font-semibold text-ink sm:text-base">Medical History</p>
                <p className="mt-2 text-sm text-muted">Do you have any medical conditions?</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {["Diabetes", "Hypertension", "Allergy", "Thyroid", "Heart Condition", "Other", "None"].map((item) => {
                    const selected = medicalHistory.includes(item);
                    return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleMedicalHistory(item)}
                      className={`h-12 rounded-xl border px-3 text-sm font-semibold transition ${selected ? "border-gold bg-linen text-gold" : "border-softgold/70 bg-white text-ink hover:border-gold"}`}
                    >
                      {item}
                    </button>
                  );})}
                </div>
              </div>

              <div className="lg:col-span-2">
                <LabeledField label="Any other medical information?">
                  <textarea
                    value={otherHistory}
                    onChange={(event) => setOtherHistory(event.target.value)}
                    className="min-h-24 w-full rounded-2xl border border-softgold/70 bg-white p-4 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-gold focus:ring-4 focus:ring-softgold/30"
                    placeholder="Please share any other relevant medical information"
                  />
                </LabeledField>
              </div>
            </div>
          </FormSection>

          <div className="my-8 h-px bg-softgold/70" />

          <FormSection icon={<ShieldCheck className="h-6 w-6" />} title="Consent">
            <label className="flex gap-3 text-sm leading-6 text-ink">
              <input type="checkbox" className="mt-1 h-5 w-5 rounded accent-gold" />
              <span>
                I confirm that the above information is accurate to the best of my knowledge.
                <span className="mt-1 block text-muted">I understand that this information will be used to provide me with the best possible dental care.</span>
              </span>
            </label>
          </FormSection>

          {registrationError ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {registrationError}
            </div>
          ) : null}

          <button type="submit" disabled={isRegistering} className="mt-8 flex min-h-[64px] w-full items-center justify-center gap-4 rounded-2xl bg-ink px-6 text-xl font-bold text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60">
            {isRegistering ? "Checking In..." : "Continue"}
            <ArrowRight className="h-7 w-7" />
          </button>

          <p className="mt-5 flex items-center justify-center gap-2 text-sm text-muted">
            <Lock className="h-4 w-4" />
            Your data is secure and private with us.
          </p>
        </form>
      </div>
    </main>
  );
}

export function CheckedIn() {
  const [settings, setSettings] = useState<ClinicSettings>(defaultClinicSettings);
  const [checkIn, setCheckIn] = useState({
    name: "",
    phone: "",
    email: "",
    age: "",
    gender: "",
    address: "",
    complaint: "",
    history: "",
    referralSource: "",
    patientId: "",
    checkedAt: "",
    visitToken: ""
  });

  useEffect(() => {
    setSettings(loadClinicSettings());
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get("patientId") || `P-${Date.now().toString().slice(-5)}`;
    const checkedAt = params.get("checkedAt") || new Date().toISOString();
    const nextCheckIn = {
      name: params.get("name") || "Patient",
      phone: params.get("phone") || "Not added",
      email: params.get("email") || "Not added",
      age: params.get("age") || "",
      gender: params.get("gender") || "",
      address: params.get("address") || "",
      complaint: params.get("complaint") || "Not added",
      history: params.get("history") || "None",
      referralSource: params.get("referralSource") || "Not added",
      visitToken: params.get("visitToken") || "",
      patientId,
      checkedAt
    };
    const checkedInAt = formatCheckInTime(checkedAt);
    const ageGender = [nextCheckIn.gender, nextCheckIn.age ? `${nextCheckIn.age} Y` : ""].filter(Boolean).join(", ") || "Details pending";
    const patientRecord = {
      id: patientId,
      name: nextCheckIn.name,
      initials: initialsForName(nextCheckIn.name),
      phone: nextCheckIn.phone,
      email: nextCheckIn.email || "Not added",
      ageGender,
      checkedInAt,
      checkedAt,
      source: "QR Check-in",
      chiefComplaint: nextCheckIn.complaint,
      medicalHistory: nextCheckIn.history,
      referralSource: nextCheckIn.referralSource
    };
    const queuePatient = {
      id: patientRecord.id,
      name: patientRecord.name,
      initials: patientRecord.initials,
      phone: patientRecord.phone,
      ageGender: patientRecord.ageGender,
      complaint: patientRecord.chiefComplaint,
      checkedInAt: patientRecord.checkedInAt,
      checkedAt: patientRecord.checkedAt,
      status: "Waiting",
      source: "QR Check-in"
    };

    window.localStorage.setItem(`healDentalPatient:${patientId}`, JSON.stringify(patientRecord));
    if (nextCheckIn.visitToken) {
      window.localStorage.setItem(`healDentalVisitTokenByPatient:${patientId}`, nextCheckIn.visitToken);
    }
    const savedQueue = window.localStorage.getItem("healDentalQueuePatients");
    let queue: typeof queuePatient[] = [];
    try {
      queue = savedQueue ? JSON.parse(savedQueue) as typeof queuePatient[] : [];
    } catch {
      queue = [];
    }
    const nextQueue = [queuePatient, ...queue.filter((item) => item.id !== patientId)];
    window.localStorage.setItem("healDentalQueuePatients", JSON.stringify(nextQueue));
    setCheckIn(nextCheckIn);

    const latestPortalToken = window.localStorage.getItem(`healDentalLatestPatientPortal:${patientId}`);
    const latestPortal = latestPortalToken ? window.localStorage.getItem(`healDentalPatientPortal:${latestPortalToken}`) : null;
    if (latestPortalToken && latestPortal) {
      try {
        const portal = JSON.parse(latestPortal) as { generatedAt?: string };
        const generatedAt = portal.generatedAt ? new Date(portal.generatedAt).getTime() : 0;
        const currentCheckInAt = new Date(checkedAt).getTime();
        if (generatedAt && currentCheckInAt && generatedAt >= currentCheckInAt) {
          window.location.replace(`/p/${latestPortalToken}`);
        }
      } catch {
        // Stay on the checked-in screen if the saved portal cannot be read.
      }
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#fffaf3] px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <button className="hidden h-12 items-center gap-3 rounded-2xl border border-softgold/60 bg-white/80 px-5 text-sm font-semibold text-ink shadow-card sm:flex">
            <Globe2 className="h-4 w-4" />
            English
            <ChevronDown className="h-4 w-4" />
          </button>
        </header>

        <section className="relative mt-10 overflow-hidden rounded-[34px] bg-gradient-to-b from-white via-[#fffaf3] to-[#f7eee3] px-5 pb-8 pt-10 text-center sm:px-14 sm:pb-12 sm:pt-12">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 rounded-t-[50%] bg-linen/70" />
          <div className="pointer-events-none absolute right-10 top-28 hidden text-linen sm:block">
            <div className="h-52 w-20 rounded-t-full bg-current opacity-70" />
          </div>
          <div className="relative">
            <div className="mx-auto grid h-32 w-32 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-card">
              <Check className="h-16 w-16 stroke-[3]" />
            </div>
            <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl">You are Checked In!</h1>
            <p className="mt-5 text-xl text-ink">Thank you.</p>
            <p className="mt-2 text-xl text-ink">Our team will call you shortly.</p>
          </div>
        </section>

        <section className="mt-7 rounded-[22px] border border-emerald-100 bg-emerald-50/45 p-5 shadow-card">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-gold">
                <CalendarDays className="h-7 w-7" />
              </span>
              <div>
                <p className="text-sm font-semibold text-muted">Checked In On</p>
                <p className="mt-2 text-base font-bold text-ink">{formatCheckInDateTime(checkIn.checkedAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 border-t border-emerald-100 pt-5 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-gold">
                <UserRound className="h-7 w-7" />
              </span>
              <div>
                <p className="text-sm font-semibold text-muted">Patient ID</p>
                <p className="mt-2 text-base font-bold text-ink">{checkIn.patientId || "Generating..."}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[24px] border border-softgold/60 bg-white/80 shadow-card">
          <NextStep icon={<Headphones className="h-7 w-7" />} title="What happens next?" text="Please have a seat. Our team will be with you soon." />
          <NextStep icon={<ClipboardList className="h-7 w-7" />} title="We will update your visit details here" text="After your consultation, you will be able to view your summary, prescription, and invoices." />
          <NextStep icon={<Bell className="h-7 w-7" />} title="Keep this page open if possible" text="You can revisit anytime to view your documents." />
        </section>

        <section className="mt-8 rounded-[24px] border border-softgold/60 bg-linen/55 p-5 shadow-card sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white text-gold">
              <Headphones className="h-8 w-8" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink">Need Help?</h2>
              <p className="mt-1 text-muted">Call our reception if you need anything.</p>
            </div>
          </div>
          <a href={phoneHref(settings.phone)} className="mt-5 flex min-h-[56px] items-center justify-center gap-3 rounded-2xl border border-softgold/70 bg-white px-5 text-lg font-bold text-gold sm:mt-0">
            <Phone className="h-6 w-6" />
            {settings.phone}
          </a>
        </section>

        <section className="mt-6 rounded-[24px] border border-emerald-100 bg-white/80 p-5 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-8 w-8" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-ink">Your data is safe with us</h2>
                <p className="mt-1 max-w-md text-muted">We use secure and private systems to protect your information.</p>
              </div>
            </div>
            <span className="hidden h-16 w-16 shrink-0 place-items-center rounded-full bg-emerald-50 text-ink sm:grid">
              <Lock className="h-8 w-8" />
            </span>
          </div>
        </section>

        <section className="mt-8 rounded-[24px] border border-softgold/60 bg-white/78 p-7 shadow-card sm:grid sm:grid-cols-[1fr_1fr] sm:items-end">
          <div>
            <h2 className="text-2xl font-bold text-ink">Thank you for trusting</h2>
            <p className="mt-1 text-2xl font-bold text-gold">Heal Dental Clinic</p>
            <p className="mt-5 text-lg text-ink">We are here to care for your smile.</p>
          </div>
          <div className="mt-8 hidden h-32 items-end justify-center text-softgold sm:flex">
            <div className="h-24 w-16 rounded-t-full border border-current" />
            <div className="mx-5 h-20 w-44 rounded-t-[40px] border border-current" />
            <div className="h-28 w-20 rounded-t-2xl border border-current" />
          </div>
        </section>

        <footer className="py-7 text-center text-sm text-muted">Copyright 2026 Heal Dental Clinic. All rights reserved.</footer>
      </div>
    </main>
  );
}

export function PatientPortalScreen() {
  const [portal, setPortal] = useState<PatientPortalRecord | null>(null);
  const [missing, setMissing] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    async function loadPortal() {
      const token = decodeURIComponent(window.location.pathname.split("/").filter(Boolean).pop() || "");
    const saved = window.localStorage.getItem(`healDentalPatientPortal:${token}`);

      if (saved) {
        try {
          setPortal(JSON.parse(saved) as PatientPortalRecord);
          return;
        } catch {
          // Fall through to Supabase fetch.
        }
      }

      try {
        const response = await fetch(`/api/patient-portal/${encodeURIComponent(token)}`);
        const result = await response.json() as { visit?: {
          visitToken: string;
          patient?: { patientCode?: string; fullName?: string; phone?: string; age?: number; gender?: string; chiefComplaint?: string };
          diagnosis?: string;
          toothNumber?: string;
          recommendedTreatment?: string;
          clinicalNotes?: string;
          instructions?: string;
          nextVisitAt?: string;
          medicines?: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
          invoiceItems?: Array<{ serviceName: string; amount: number }>;
          documents?: Array<{ type: string }>;
          createdAt?: string;
        } };

        if (!response.ok || !result.visit) {
          setMissing(true);
          return;
        }

        const visit = result.visit;
        const patientRecord = visit.patient;
        const invoiceItems = visit.invoiceItems ?? [];
        const invoiceTotal = invoiceItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        setPortal({
          token,
          patientId: patientRecord?.patientCode || "",
          visitId: visit.visitToken,
          patientName: patientRecord?.fullName || "Patient",
          patientPhone: patientRecord?.phone || "",
          ageGender: [patientRecord?.gender, patientRecord?.age ? `${patientRecord.age} Y` : ""].filter(Boolean).join(", "),
          generatedAt: visit.createdAt || new Date().toISOString(),
          clinicPhone: defaultClinicSettings.phone,
          clinicEmail: defaultClinicSettings.email,
          clinicWebsite: defaultClinicSettings.website,
          clinicName: defaultClinicSettings.clinicName,
          clinicDisplayName: defaultClinicSettings.clinicDisplayName,
          clinicAddress: defaultClinicSettings.address,
          clinicMapsUrl: defaultClinicSettings.mapsUrl,
          googleReviewUrl: defaultClinicSettings.googleReviewUrl,
          documentKinds: ["summary", "prescription", ...(invoiceTotal > 0 ? ["invoice" as PdfKind] : [])],
          summaryGenerated: true,
          consentGenerated: false,
          data: {
            visitToken: visit.visitToken,
            patientName: patientRecord?.fullName || "Patient",
            patientId: patientRecord?.patientCode || "",
            patientPhone: patientRecord?.phone || "",
            ageGender: [patientRecord?.gender, patientRecord?.age ? `${patientRecord.age} Y` : ""].filter(Boolean).join(", "),
            chiefComplaint: patientRecord?.chiefComplaint || "",
            clinicalFindings: visit.clinicalNotes || "",
            diagnosis: visit.diagnosis || "",
            tooth: visit.toothNumber || "",
            treatments: visit.recommendedTreatment ? [visit.recommendedTreatment] : [],
            clinicalNotes: visit.clinicalNotes || "",
            medicines: visit.medicines ?? [],
            investigations: [],
            instructions: visit.instructions || "",
            nextVisit: visit.nextVisitAt ? formatCheckInDateTime(visit.nextVisitAt) : "",
            invoiceItems: invoiceItems.map((item) => ({ service: item.serviceName, amount: String(item.amount) })),
            invoiceTotal,
            paymentStatus: invoiceTotal > 0 ? "Paid" : "",
            consentBenefits: [],
            consentRisks: [],
            consentAlternatives: []
          }
        });
      } catch {
        setMissing(true);
      }
    }

    loadPortal();
  }, []);

  if (missing) {
    return (
      <main className="min-h-screen bg-[#fffaf3] px-4 py-6">
        <div className="mx-auto max-w-[520px] rounded-[30px] border border-softgold/60 bg-paper p-6 text-center shadow-soft">
          <Logo />
          <h1 className="mt-8 text-3xl font-bold text-ink">Your report is not ready yet</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Please keep this page open or ask the clinic team to share your report QR after the visit documents are generated.
          </p>
          <a href={phoneHref(defaultClinicSettings.phone)} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white">
            <Phone className="h-4 w-4" />
            Call Clinic
          </a>
        </div>
      </main>
    );
  }

  if (!portal) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fffaf3] px-4">
        <div className="rounded-[30px] border border-softgold/60 bg-paper p-6 shadow-soft">
          <Logo />
          <p className="mt-5 text-sm font-semibold text-muted">Opening your visit report...</p>
        </div>
      </main>
    );
  }

  const data = portal.data;
  const firstName = portal.patientName.split(" ")[0] || "there";
  const generatedDate = formatCheckInDateTime(portal.generatedAt);
  const clinicName = portal.clinicName || defaultClinicSettings.clinicName;
  const clinicWebsite = portal.clinicWebsite || defaultClinicSettings.website;
  const reviewUrl = portal.googleReviewUrl || defaultClinicSettings.googleReviewUrl;
  const clinicPhoneHref = phoneHref(portal.clinicPhone || defaultClinicSettings.phone);
  const documentLabels: Record<PdfKind, string> = {
    summary: "Visit Summary",
    prescription: "Prescription",
    instructions: "Care Instructions",
    invoice: "Invoice",
    consent: "Consent Form"
  };

  return (
    <main className="min-h-screen bg-[#fffaf3] px-4 py-5 sm:px-8">
      <div className="mx-auto w-full max-w-[1040px]">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <a href={clinicPhoneHref} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-softgold/70 bg-white/80 px-4 text-sm font-semibold text-ink shadow-card">
            <Phone className="h-4 w-4" />
            Call Clinic
          </a>
        </header>

        <section className="mt-6 overflow-hidden rounded-[30px] border border-softgold/60 bg-paper shadow-card">
          <div className="relative p-6 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Visit report ready</p>
            <h1 className="mt-4 max-w-2xl font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Thank you for choosing {clinicName}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              Hi {firstName}, your visit documents are ready. You can view and download them anytime from this secure report page.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MetaCard label="Patient ID" value={portal.patientId} />
              <MetaCard label="Updated" value={generatedDate} />
              <MetaCard label="Documents" value={`${portal.documentKinds.length} available`} />
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[26px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <div className="flex items-start gap-3">
            <Check className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Your appointment documents are ready.</p>
              <p className="mt-1 text-sm text-emerald-700">Please follow the prescription and instructions given by the clinic.</p>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-5">
            <PortalSection title="Treatment Summary" icon={<ClipboardList className="h-5 w-5" />}>
              <SummaryLine label="Chief Complaint" value={data.chiefComplaint || "Not added"} />
              <SummaryLine label="Clinical Findings" value={data.clinicalFindings || "Not added"} />
              <SummaryLine label="Diagnosis" value={data.diagnosis || "Not added"} />
              <SummaryLine label="Recommended Treatment" value={data.treatments.length ? data.treatments.join("\n") : "Not added"} />
            </PortalSection>

            {data.medicines.length ? (
              <PortalSection title="Medicines" icon={<Pill className="h-5 w-5" />}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.medicines.map((medicine) => (
                    <div key={`${medicine.name}-${medicine.duration}`} className="rounded-2xl border border-softgold/50 bg-white/75 p-4">
                      <p className="font-bold text-ink">{medicine.name}</p>
                      <p className="mt-2 text-sm leading-6 text-muted">{[medicine.dosage, medicine.frequency, medicine.duration].filter(Boolean).join(" - ")}</p>
                    </div>
                  ))}
                </div>
              </PortalSection>
            ) : null}

            {data.instructions ? (
              <PortalSection title="Care Instructions" icon={<ShieldCheck className="h-5 w-5" />}>
                <p className="whitespace-pre-line text-sm leading-7 text-muted">{data.instructions}</p>
              </PortalSection>
            ) : null}
          </section>

          <aside className="space-y-5">
            <PortalSection title="Documents" icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-3">
                {portal.documentKinds.map((kind) => (
                  <button
                    key={kind}
                    onClick={() => downloadVisitPdf(kind, data)}
                    className="flex w-full items-center justify-between rounded-2xl border border-softgold/60 bg-white/80 px-4 py-4 text-left transition hover:border-gold"
                  >
                    <span>
                      <span className="block font-bold text-ink">{documentLabels[kind]}</span>
                      <span className="text-sm text-muted">PDF</span>
                    </span>
                    <Download className="h-4 w-4 text-gold" />
                  </button>
                ))}
              </div>
            </PortalSection>

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-[24px] border border-softgold/60 bg-paper p-4 shadow-card">
                <IndianRupee className="h-5 w-5 text-gold" />
                <p className="mt-3 text-sm font-semibold text-muted">Invoice Total</p>
                <p className="mt-1 text-xl font-bold text-ink">Rs. {data.invoiceTotal.toLocaleString("en-IN")}</p>
                <p className="mt-2 text-xs font-bold text-gold">{data.paymentStatus || "Paid"}</p>
              </div>
              <div className="rounded-[24px] border border-softgold/60 bg-paper p-4 shadow-card">
                <CalendarDays className="h-5 w-5 text-gold" />
                <p className="mt-3 text-sm font-semibold text-muted">Next Visit</p>
                <p className="mt-1 text-sm font-bold leading-6 text-ink">{data.nextVisit || "Not scheduled"}</p>
              </div>
            </section>

            <div className="rounded-[24px] border border-softgold/60 bg-linen/50 p-4">
              <p className="font-bold text-ink">Need help?</p>
              <p className="mt-2 text-sm leading-6 text-muted">Call the clinic if pain, swelling, bleeding, fever, or discomfort increases.</p>
              <a href={clinicPhoneHref} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-sm font-semibold text-white">
                <Phone className="h-4 w-4" />
                {portal.clinicPhone}
              </a>
            </div>
          </aside>
        </div>

        <section className="mt-5 rounded-[24px] border border-softgold/60 bg-paper p-5 shadow-card">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-ink">Did we make your smile feel cared for?</h2>
              <p className="mt-1 text-sm text-muted">Your feedback helps us continually improve our care.</p>
            </div>
            <a
              href={reviewUrl}
              onClick={() => setReviewed(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-softgold/70 bg-white px-5 text-sm font-semibold text-gold"
            >
              {reviewed ? "Thank you" : "Leave a Google Review"}
            </a>
            <p className="text-xs font-semibold text-muted sm:col-start-2 sm:text-right">
              Because telepathic compliments do not count.
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-softgold/60 bg-paper p-5 shadow-card">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
            <div>
              <h2 className="text-lg font-bold text-ink">Contact {clinicName}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                For appointment changes, urgent concerns, or questions about your visit documents, please contact the clinic directly.
              </p>
            </div>
            <a href={clinicPhoneHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-softgold/70 bg-white px-5 text-sm font-semibold text-ink">
              <Phone className="h-4 w-4" />
              {portal.clinicPhone}
            </a>
            <a href={`mailto:${portal.clinicEmail}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-softgold/70 bg-white px-5 text-sm font-semibold text-ink">
              <Mail className="h-4 w-4" />
              Email Clinic
            </a>
            <a href={clinicWebsite} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-softgold/70 bg-white px-5 text-sm font-semibold text-ink">
              <Globe2 className="h-4 w-4" />
              Visit Website
            </a>
          </div>
        </section>

        <p className="flex items-center justify-center gap-2 py-6 text-xs text-muted">
          <Lock className="h-4 w-4" />
          Your information is secure and private.
        </p>
      </div>
    </main>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-softgold/60 bg-white/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function PortalSection({
  title,
  icon,
  children
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-softgold/60 bg-paper p-5 shadow-card">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-linen text-gold">{icon}</span>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-softgold/50 py-3 first:pt-0 last:border-b-0 last:pb-0">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-ink">{value}</p>
    </div>
  );
}

export function ConsentScreen() {
  const [consent, setConsent] = useState(defaultConsent);
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("healDentalConsentDraft");
    if (!saved) return;
    try {
      setConsent({ ...defaultConsent, ...JSON.parse(saved) });
    } catch {
      setConsent(defaultConsent);
    }
  }, []);

  return (
    <main className="min-h-screen px-4 py-5">
      <div className="mx-auto w-full max-w-[480px]">
        <header className="mb-5 flex items-center justify-between">
          <Logo />
          <a href={consent.returnUrl} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-softgold/70 bg-white/70 px-4 text-sm font-semibold text-ink">
            <ArrowLeft className="h-4 w-4" />
            Back
          </a>
        </header>

        <section className="rounded-[30px] border border-softgold/60 bg-paper p-5 shadow-soft">
          <p className="text-sm font-semibold text-gold">Secure consent request</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{consent.title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Hi {consent.patientName.split(" ")[0] || "there"}, please read the details below and confirm only when you are comfortable.
          </p>

          {consent.procedureSections?.length ? (
            <div className="mt-5 space-y-4">
              {consent.procedureSections.map((section, index) => (
                <section key={`${section.title}-${index}`} className="rounded-[24px] border border-softgold/70 bg-white/70 p-4">
                  <h2 className="text-lg font-bold text-ink">{section.title}</h2>
                  <ConsentBlock title="Treatment Details" items={section.treatmentDetails} compact />
                  <ConsentBlock title="Benefits" items={section.benefits} compact />
                  <ConsentBlock title="Risks and Possible Discomfort" items={section.risks} compact />
                  <ConsentBlock title="Alternatives" items={section.alternatives} compact />
                </section>
              ))}
            </div>
          ) : (
            <>
              <ConsentBlock title="Treatment Details" items={consent.treatmentDetails} />
              <ConsentBlock title="Benefits" items={consent.benefits} />
              <ConsentBlock title="Risks and Possible Discomfort" items={consent.risks} />
              <ConsentBlock title="Alternatives" items={consent.alternatives} />
            </>
          )}

          <label className="mt-4 flex gap-3 rounded-[22px] border border-softgold/70 bg-linen/70 p-4 text-sm leading-6 text-muted">
            <input checked={accepted} onChange={(event) => setAccepted(event.target.checked)} type="checkbox" className="mt-1 h-5 w-5 accent-gold" />
            {consent.declaration}
          </label>

          <button
            onClick={() => {
              if (!accepted) return;
              const acceptedAt = new Date().toISOString();
              if (consent.patientId) {
                window.localStorage.setItem(`healDentalConsentAccepted:${consent.patientId}`, JSON.stringify({
                  patientId: consent.patientId,
                  patientName: consent.patientName,
                  patientPhone: consent.patientPhone,
                  title: consent.title,
                  acceptedAt
                }));
              }
              setSubmitted(true);
            }}
            className={`mt-5 flex min-h-[52px] w-full items-center justify-center rounded-[20px] px-5 py-4 text-sm font-semibold shadow-soft ${accepted ? "bg-ink text-white" : "bg-white text-muted border border-softgold/70"}`}
          >
            I Accept & Give Consent
          </button>

          {submitted && (
            <p className="mt-4 rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              Consent accepted. You can download a PDF copy later from your visit report.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function ConsentBlock({ title, items, compact = false }: { title: string; items: string[]; compact?: boolean }) {
  return (
    <section className={`${compact ? "mt-3 bg-paper/70 p-3" : "mt-4 bg-white/70 p-4"} rounded-[22px] border border-softgold/60`}>
      <h2 className="font-bold text-ink">{title}</h2>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <p key={item} className="flex gap-3 text-sm leading-6 text-muted">
            <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-linen text-gold">
              <Check className="h-3 w-3" />
            </span>
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}

function initialsForName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
}

function formatCheckInTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function formatCheckInDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Generating...";
  return `${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} - ${date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`;
}

const registerInputClass =
  "h-[58px] w-full rounded-2xl border border-softgold/70 bg-white px-4 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-gold focus:ring-4 focus:ring-softgold/30";

function FormSection({
  icon,
  title,
  children
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-6 flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-linen text-gold">
          {icon}
        </span>
        <h2 className="text-xl font-bold text-gold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function LabeledField({
  label,
  required = false,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-3 block text-sm font-semibold text-ink sm:text-base">
        {label}
        {required && <span className="ml-1 text-gold">*</span>}
      </span>
      {children}
    </label>
  );
}

function NextStep({
  icon,
  title,
  text
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[84px_1fr_auto] items-center gap-4 border-b border-softgold/50 p-5 last:border-b-0 sm:p-8">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-linen text-gold">
        {icon}
      </span>
      <div>
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        <p className="mt-2 text-base leading-7 text-muted">{text}</p>
      </div>
      <ChevronDown className="h-5 w-5 text-ink" />
    </div>
  );
}
