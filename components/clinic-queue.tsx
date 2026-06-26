"use client";

import {
  Activity,
  CalendarDays,
  ChevronRight,
  FileText,
  IndianRupee,
  Plus,
  QrCode,
  Search,
  Send,
  Stethoscope,
  UserPlus
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ClinicShell } from "./clinic-shell";
import { Card } from "./ui";
import { ClinicSettings, defaultClinicSettings, loadClinicSettings, normalizePhoneForWhatsApp } from "@/lib/clinic-settings";

type QueuePatient = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  ageGender: string;
  complaint: string;
  checkedInAt: string;
  checkedAt?: string;
  status: string;
  source: string;
};

type PatientRecord = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email?: string;
  ageGender: string;
  checkedInAt: string;
  checkedAt?: string;
  source: string;
  chiefComplaint: string;
  medicalHistory: string;
};

type VisitHistoryItem = {
  id: string;
  label: string;
  savedAt: string;
  summary: string;
  total: number;
  documentCount: number;
};

type DirectoryPatient = PatientRecord & {
  visits: VisitHistoryItem[];
  lastVisit?: VisitHistoryItem;
};

const queue: QueuePatient[] = [];

const seedPatientPhones = new Set(["+91 98765 43210", "+91 91234 56789", "+91 99887 66554"]);

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/[^\dA-Za-z]/g, "");
}

function createVisitId() {
  return `V-${Date.now().toString().slice(-6)}`;
}

function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
}

function dateKey(value?: string | Date) {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, "0");
  const day = String(safeDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function savedDateKey(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateKey(date);
}

function formatVisitDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "Not saved";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatSelectedDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatAppointmentDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
}

function formatAppointmentTime(value: string) {
  const date = new Date(`2026-01-01T${value}`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function appointmentWhatsAppUrl(
  appointment: { name: string; phone: string; date: string; time: string },
  settings: ClinicSettings
) {
  const number = normalizePhoneForWhatsApp(appointment.phone);
  if (!number) return "";
  const firstName = appointment.name.trim().split(/\s+/)[0] || "there";
  const message = [
    `Hello ${firstName},`,
    "",
    `Your appointment has been booked with ${settings.clinicDisplayName}.`,
    "",
    `Date: ${formatAppointmentDate(appointment.date)}`,
    `Time: ${formatAppointmentTime(appointment.time)}`,
    "",
    "Clinic address:",
    settings.address,
    "",
    `Google Maps: ${settings.mapsUrl}`,
    `Phone: ${settings.phone}`,
    `Website: ${settings.website}`,
    "",
    "Please reach 5 minutes before your appointment time.",
    settings.clinicName
  ].join("\n");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function visitDisplayLabel(visit: VisitHistoryItem) {
  if (visit.id === "current") return "Saved Visit";
  return visit.label?.startsWith("Visit ") ? visit.label : `Visit ${visit.id}`;
}

function queueToPatient(item: QueuePatient): PatientRecord {
  return {
    id: item.id,
    name: item.name,
    initials: item.initials,
    phone: item.phone,
    email: "Not added",
    ageGender: item.ageGender,
    checkedInAt: item.checkedInAt,
    checkedAt: item.checkedAt,
    source: item.source,
    chiefComplaint: item.complaint,
    medicalHistory: "Not added"
  };
}

function isSeedQueuePatient(item: QueuePatient) {
  return seedPatientPhones.has(item.phone) && ["P-1024", "P-1025", "P-1026"].includes(item.id);
}

function sanitizeQueuePatients(items: QueuePatient[]) {
  return items.filter((item) => !isSeedQueuePatient(item));
}

function readVisitHistory(patientId: string) {
  const saved = window.localStorage.getItem(`healDentalVisitHistory:${patientId}`);
  let visits: VisitHistoryItem[] = [];
  try {
    const parsed = saved ? JSON.parse(saved) as VisitHistoryItem[] : [];
    visits = Array.isArray(parsed) ? parsed : [];
  } catch {
    visits = [];
  }

  const legacyDraft = window.localStorage.getItem(`healDentalVisitDraft:${patientId}`);
  if (legacyDraft && !visits.some((visit) => visit.id === "current")) {
    try {
      const draft = JSON.parse(legacyDraft) as {
        savedAt?: string;
        diagnosis?: string;
        clinicalFindings?: string;
        treatments?: string[];
        invoiceItems?: Array<{ amount?: string }>;
        summaryGenerated?: boolean;
        consentGenerated?: boolean;
      };
      const total = (draft.invoiceItems ?? []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      if (draft.diagnosis || draft.clinicalFindings || draft.treatments?.length || total > 0) {
        visits = [{
          id: "current",
          label: "Saved Visit",
          savedAt: draft.savedAt ?? new Date().toISOString(),
          summary: draft.treatments?.length ? draft.treatments.join(", ") : draft.diagnosis || draft.clinicalFindings || "Saved visit",
          total,
          documentCount: [draft.summaryGenerated, total > 0, draft.consentGenerated].filter(Boolean).length
        }, ...visits];
      }
    } catch {
      // Ignore malformed legacy drafts.
    }
  }

  return visits.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

function loadDirectoryPatients(currentQueue: QueuePatient[]) {
  const records = new Map<string, PatientRecord>();

  currentQueue.forEach((item) => records.set(item.id, queueToPatient(item)));

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith("healDentalPatient:")) continue;
    const saved = window.localStorage.getItem(key);
    if (!saved) continue;
    try {
      const patient = JSON.parse(saved) as PatientRecord;
      if (patient?.id) {
        records.set(patient.id, {
          ...patient,
          initials: patient.initials || initialsFor(patient.name),
          chiefComplaint: patient.chiefComplaint || "Not added",
          medicalHistory: patient.medicalHistory || "Not added",
          checkedInAt: patient.checkedInAt || "Not added",
          checkedAt: patient.checkedAt,
          source: patient.source || "Saved patient"
        });
      }
    } catch {
      // Ignore malformed local patient records.
    }
  }

  return Array.from(records.values()).map((patient) => {
    const visits = readVisitHistory(patient.id);
    return {
      ...patient,
      visits,
      lastVisit: visits[0]
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export function ClinicQueueDashboard() {
  const [notice, setNotice] = useState("");
  const [settings, setSettings] = useState<ClinicSettings>(defaultClinicSettings);
  const [queueItems, setQueueItems] = useState<QueuePatient[]>(queue);
  const [directoryPatients, setDirectoryPatients] = useState<DirectoryPatient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedMonth = useMemo(() => startOfMonth(new Date()), []);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [showCheckInQr, setShowCheckInQr] = useState(false);
  const [checkInUrl, setCheckInUrl] = useState("http://127.0.0.1:3000/checkin");
  const [appointmentShareUrl, setAppointmentShareUrl] = useState("");
  const [appointmentCalendarUrl, setAppointmentCalendarUrl] = useState("");
  const [newPatient, setNewPatient] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "",
    complaint: "",
    medicalHistory: ""
  });
  const [newAppointment, setNewAppointment] = useState({
    name: "",
    phone: "",
    date: dateKey(new Date()),
    time: ""
  });

  useEffect(() => {
    setSettings(loadClinicSettings());
    setCheckInUrl(`${window.location.origin}/checkin`);
    const saved = window.localStorage.getItem("healDentalQueuePatients");
    let nextQueue = queue;

    try {
      if (saved) {
        const savedPatients = JSON.parse(saved) as QueuePatient[];
        if (Array.isArray(savedPatients)) {
          nextQueue = sanitizeQueuePatients(savedPatients);
        }
      }
    } catch {
      nextQueue = queue;
    }

    setQueueItems(nextQueue);
    setDirectoryPatients(loadDirectoryPatients(nextQueue));
  }, []);

  function createWalkInPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newPatient.name.trim() || !newPatient.phone.trim()) {
      setNotice("Please add patient name and phone number.");
      return;
    }

    const id = `P-${Date.now().toString().slice(-5)}`;
    const now = new Date();
    const checkedInAt = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    const checkedAt = now.toISOString();
    const patient: QueuePatient = {
      id,
      name: newPatient.name.trim(),
      initials: initialsFor(newPatient.name),
      phone: newPatient.phone.trim(),
      ageGender: [newPatient.gender, newPatient.age ? `${newPatient.age} Y` : ""].filter(Boolean).join(", ") || "Details pending",
      complaint: newPatient.complaint.trim() || "Chief complaint not added yet",
      checkedInAt,
      checkedAt,
      status: "Waiting",
      source: "Walk-in"
    };

    const nextQueue = [patient, ...queueItems];
    setQueueItems(nextQueue);
    window.localStorage.setItem("healDentalQueuePatients", JSON.stringify(nextQueue));
    window.localStorage.setItem(`healDentalPatient:${id}`, JSON.stringify({
      id,
      name: patient.name,
      initials: patient.initials,
      phone: patient.phone,
      email: "Not added",
      ageGender: patient.ageGender,
      checkedInAt: patient.checkedInAt,
      checkedAt,
      source: patient.source,
      chiefComplaint: patient.complaint,
      medicalHistory: newPatient.medicalHistory.trim() || "Not added"
    }));
    window.location.href = `/clinic/profile?patient=${id}`;
  }

  function createAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newAppointment.name.trim() || !newAppointment.phone.trim() || !newAppointment.date || !newAppointment.time) {
      setNotice("Please add patient name, phone number, appointment date, and time.");
      return;
    }

    const id = `P-${Date.now().toString().slice(-5)}`;
    const appointmentAt = new Date(`${newAppointment.date}T${newAppointment.time}:00`);
    const checkedAt = Number.isNaN(appointmentAt.getTime()) ? new Date().toISOString() : appointmentAt.toISOString();
    const patient: QueuePatient = {
      id,
      name: newAppointment.name.trim(),
      initials: initialsFor(newAppointment.name),
      phone: newAppointment.phone.trim(),
      ageGender: "Details pending",
      complaint: "Appointment booked",
      checkedInAt: formatAppointmentTime(newAppointment.time),
      checkedAt,
      status: "Booked",
      source: "Appointment"
    };

    const nextQueue = [patient, ...queueItems.filter((item) => item.id !== id)];
    setQueueItems(nextQueue);
    window.localStorage.setItem("healDentalQueuePatients", JSON.stringify(nextQueue));
    window.localStorage.setItem(`healDentalPatient:${id}`, JSON.stringify({
      id,
      name: patient.name,
      initials: patient.initials,
      phone: patient.phone,
      email: "Not added",
      ageGender: patient.ageGender,
      checkedInAt: patient.checkedInAt,
      checkedAt,
      source: patient.source,
      chiefComplaint: "Not added",
      medicalHistory: "Not added"
    }));
    setDirectoryPatients(loadDirectoryPatients(nextQueue));
    const shareUrl = appointmentWhatsAppUrl(newAppointment, settings);
    const calendarUrl = `/clinic/calendar?date=${newAppointment.date}`;
    setAppointmentShareUrl(shareUrl);
    setAppointmentCalendarUrl(calendarUrl);
    setNewAppointment({ name: "", phone: "", date: newAppointment.date, time: "" });
    setShowAddAppointment(false);
    if (shareUrl) {
      const opened = window.open(shareUrl, "_blank", "noopener,noreferrer");
      setNotice(opened
        ? `Appointment booked for ${patient.name}. WhatsApp confirmation opened; the assistant can press Send.`
        : `Appointment booked for ${patient.name}. Click WhatsApp Appointment below to send the confirmation.`);
    } else {
      setNotice(`Appointment booked for ${patient.name}. Add a valid phone number to send WhatsApp confirmation.`);
    }
  }

  const searchResults = useMemo(() => {
    const query = normalizeSearch(searchTerm);
    if (!query) return [];

    return directoryPatients.filter((patient) => {
      const haystack = normalizeSearch([
        patient.name,
        patient.phone,
        patient.id,
        patient.chiefComplaint,
        patient.medicalHistory,
        patient.visits.map((visit) => `${visit.summary} ${visit.id}`).join(" ")
      ].join(" "));
      return haystack.includes(query);
    });
  }, [directoryPatients, searchTerm]);

  const todayKey = dateKey(new Date());
  const todayQueue = useMemo(() => queueItems.filter((item) => savedDateKey(item.checkedAt) === todayKey), [queueItems, todayKey]);

  const monthlyStats = useMemo(() => {
    let appointments = 0;
    let revenue = 0;
    let completed = 0;
    const seenPatients = new Set<string>();

    queueItems.forEach((item) => {
      if (!item.checkedAt) return;
      const date = new Date(item.checkedAt);
      if (Number.isNaN(date.getTime())) return;
      if (date.getFullYear() !== selectedMonth.getFullYear() || date.getMonth() !== selectedMonth.getMonth()) return;
      appointments += 1;
      seenPatients.add(item.id);
    });

    directoryPatients.forEach((patient) => {
      patient.visits.forEach((visit) => {
        const date = new Date(visit.savedAt);
        if (Number.isNaN(date.getTime())) return;
        if (date.getFullYear() !== selectedMonth.getFullYear() || date.getMonth() !== selectedMonth.getMonth()) return;
        completed += 1;
        revenue += visit.total || 0;
        seenPatients.add(patient.id);
      });
    });

    return { appointments, revenue, completed, newPatients: seenPatients.size };
  }, [directoryPatients, queueItems, selectedMonth]);

  return (
    <ClinicShell active="Dashboard">
      <div className="p-4 sm:p-8">
        <header className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Good morning, {settings.doctorName.replace(/^Dr\.\s*/i, "Dr. ")}
            </h1>
            <p className="mt-2 text-muted">Here is your clinic overview for today.</p>
            <label className="mt-6 flex h-14 max-w-3xl items-center gap-3 rounded-2xl border border-softgold/70 bg-white px-4 text-muted shadow-card focus-within:border-gold">
              <Search className="h-5 w-5" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, phone number or patient ID..."
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </label>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-softgold/55 bg-white/80 px-4 py-3 shadow-card">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-linen text-lg font-bold text-gold">HS</div>
            <div>
              <p className="font-bold text-ink">{settings.doctorName}</p>
              <p className="text-xs font-semibold text-muted">Reg. No. {settings.registrationNumber}</p>
            </div>
          </div>
        </header>

        {notice && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <p>{notice}</p>
            {(appointmentShareUrl || appointmentCalendarUrl) && (
              <div className="mt-3 flex flex-wrap gap-3">
                {appointmentShareUrl && (
                  <a
                    href={appointmentShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white"
                  >
                    WhatsApp Appointment
                  </a>
                )}
                {appointmentCalendarUrl && (
                  <a
                    href={appointmentCalendarUrl}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 text-xs font-bold text-emerald-800"
                  >
                    View in Calendar
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {showAddPatient && (
          <Card className="mt-6 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Add Walk-in Patient</h2>
                <p className="mt-1 text-sm text-muted">Add the patient once and open their case directly.</p>
              </div>
              <button onClick={() => setShowAddPatient(false)} className="text-sm font-semibold text-gold">Close</button>
            </div>
            <form onSubmit={createWalkInPatient} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <input value={newPatient.name} onChange={(event) => setNewPatient((current) => ({ ...current, name: event.target.value }))} placeholder="Patient name" className="min-h-12 rounded-2xl border border-softgold/70 bg-white px-4 text-sm outline-none focus:border-gold" />
              <input value={newPatient.phone} onChange={(event) => setNewPatient((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" className="min-h-12 rounded-2xl border border-softgold/70 bg-white px-4 text-sm outline-none focus:border-gold" />
              <input value={newPatient.age} onChange={(event) => setNewPatient((current) => ({ ...current, age: event.target.value }))} placeholder="Age" className="min-h-12 rounded-2xl border border-softgold/70 bg-white px-4 text-sm outline-none focus:border-gold" />
              <select value={newPatient.gender} onChange={(event) => setNewPatient((current) => ({ ...current, gender: event.target.value }))} className="min-h-12 rounded-2xl border border-softgold/70 bg-white px-4 text-sm outline-none focus:border-gold">
                <option value="">Gender</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
              <input value={newPatient.complaint} onChange={(event) => setNewPatient((current) => ({ ...current, complaint: event.target.value }))} placeholder="Chief complaint" className="min-h-12 rounded-2xl border border-softgold/70 bg-white px-4 text-sm outline-none focus:border-gold" />
              <textarea value={newPatient.medicalHistory} onChange={(event) => setNewPatient((current) => ({ ...current, medicalHistory: event.target.value }))} placeholder="Medical history, allergies, medication, conditions" className="min-h-24 rounded-2xl border border-softgold/70 bg-white px-4 py-3 text-sm outline-none focus:border-gold md:col-span-2 xl:col-span-5" />
              <button className="min-h-12 rounded-2xl bg-ink px-5 text-sm font-semibold text-white md:col-span-2 xl:col-span-5">
                Create Patient and Open Case
              </button>
            </form>
          </Card>
        )}

        {showAddAppointment && (
          <Card className="mt-6 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Book Appointment</h2>
                <p className="mt-1 text-sm text-muted">Reserve a slot with only the patient name, phone number, date, and time.</p>
              </div>
              <button onClick={() => setShowAddAppointment(false)} className="text-sm font-semibold text-gold">Close</button>
            </div>
            <form onSubmit={createAppointment} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                value={newAppointment.name}
                onChange={(event) => setNewAppointment((current) => ({ ...current, name: event.target.value }))}
                placeholder="Patient name"
                className="min-h-12 rounded-2xl border border-softgold/70 bg-white px-4 text-sm outline-none focus:border-gold"
              />
              <input
                value={newAppointment.phone}
                onChange={(event) => setNewAppointment((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Phone number"
                className="min-h-12 rounded-2xl border border-softgold/70 bg-white px-4 text-sm outline-none focus:border-gold"
              />
              <input
                type="date"
                value={newAppointment.date}
                onChange={(event) => setNewAppointment((current) => ({ ...current, date: event.target.value }))}
                className="min-h-12 rounded-2xl border border-softgold/70 bg-white px-4 text-sm outline-none focus:border-gold"
              />
              <input
                type="time"
                value={newAppointment.time}
                onChange={(event) => setNewAppointment((current) => ({ ...current, time: event.target.value }))}
                className="min-h-12 rounded-2xl border border-softgold/70 bg-white px-4 text-sm outline-none focus:border-gold"
              />
              <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white md:col-span-2 xl:col-span-4">
                <CalendarDays className="h-4 w-4" />
                Save Appointment
              </button>
            </form>
          </Card>
        )}

        {searchTerm.trim() && (
          <Card className="mt-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Patient Directory</p>
                <h2 className="mt-2 text-2xl font-bold">Search Results</h2>
                <p className="mt-1 text-sm text-muted">Use this for previous patients and repeat visits.</p>
              </div>
              <button onClick={() => setSearchTerm("")} className="text-sm font-semibold text-gold">Clear Search</button>
            </div>

            <div className="mt-5 grid gap-4">
              {searchResults.length ? searchResults.map((patient) => (
                <div key={patient.id} className="rounded-3xl border border-softgold/60 bg-white/75 p-5">
                  <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr_auto] xl:items-start">
                    <div className="flex items-start gap-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-linen text-base font-bold text-gold">{patient.initials}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-bold text-ink">{patient.name}</p>
                          <span className="rounded-full bg-linen px-3 py-1 text-xs font-semibold text-gold">{patient.id}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted">{patient.phone}</p>
                        <p className="mt-2 text-sm font-semibold text-ink">{patient.ageGender}</p>
                        <p className="mt-3 text-sm leading-6 text-muted">{patient.chiefComplaint}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Case History</p>
                      <div className="mt-3 grid gap-2">
                        {patient.visits.length ? patient.visits.slice(0, 3).map((visit) => (
                          <a key={`${patient.id}-${visit.id}`} href={`/clinic/profile?patient=${patient.id}&visit=${visit.id}`} className="rounded-2xl border border-softgold/60 bg-linen/35 p-3 transition hover:border-gold hover:bg-linen">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-bold text-ink">{visitDisplayLabel(visit)}</p>
                              <p className="text-xs font-semibold text-muted">{formatVisitDate(visit.savedAt)}</p>
                            </div>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{visit.summary}</p>
                          </a>
                        )) : (
                          <div className="rounded-2xl border border-softgold/60 bg-linen/35 p-3">
                            <p className="text-sm text-muted">No previous visits saved yet.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <a href={`/clinic/profile?patient=${patient.id}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-softgold/70 bg-white px-5 text-sm font-semibold text-ink hover:border-gold">
                        <FileText className="h-4 w-4" />
                        View History
                      </a>
                      <a href={`/clinic/profile?patient=${patient.id}&visit=${createVisitId()}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white shadow-soft hover:bg-black">
                        <Plus className="h-4 w-4" />
                        Start New Visit
                      </a>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-softgold/60 bg-white/70 p-5">
                  <p className="font-semibold text-ink">No patient found.</p>
                  <p className="mt-2 text-sm text-muted">Check the spelling or phone number, or add the patient as a walk-in.</p>
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="mt-7 grid gap-6 2xl:grid-cols-[1fr_430px]">
          <main className="space-y-6">
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-linen text-gold">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-ink">Today&apos;s Appointments</h2>
                    <p className="text-sm text-muted">{formatSelectedDate(todayKey)} - {todayQueue.length} patients</p>
                  </div>
                </div>
                <a href={`/clinic/calendar?date=${todayKey}`} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-softgold/70 bg-white px-4 text-sm font-semibold text-gold hover:border-gold">
                  View full day
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-5 overflow-hidden rounded-3xl border border-softgold/55 bg-white/65">
                {todayQueue.length ? todayQueue.slice(0, 6).map((visit) => (
                  <a key={visit.id} href={`/clinic/profile?patient=${visit.id}`} className="grid gap-4 border-b border-softgold/45 p-4 transition last:border-b-0 hover:bg-linen/45 md:grid-cols-[120px_1fr_1.2fr_auto] md:items-center">
                    <p className="text-sm font-bold text-ink">{visit.checkedInAt}</p>
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-linen text-sm font-bold text-gold">{visit.initials}</span>
                      <span>
                        <span className="block font-bold text-ink">{visit.name}</span>
                        <span className="text-sm text-muted">{visit.id} - {visit.phone}</span>
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{visit.complaint}</p>
                      <p className="mt-1 text-sm text-muted">{visit.source}</p>
                    </div>
                    <QueueStatus label={visit.status} />
                  </a>
                )) : (
                  <div className="p-6">
                    <p className="font-bold text-ink">No patients checked in today.</p>
                    <p className="mt-2 text-sm text-muted">Use Add Walk-in or ask patients to scan the QR check-in page.</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-ink">Monthly Overview <span className="font-normal text-muted">({monthLabel(selectedMonth)})</span></h2>
                <a href="/clinic/calendar" className="inline-flex items-center gap-2 text-sm font-semibold text-gold">
                  View full report
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Stethoscope} label="Total Appointments" value={String(monthlyStats.appointments)} helper="This month" />
                <MetricCard icon={UserPlus} label="Patients Seen" value={String(monthlyStats.newPatients)} helper="Unique patients" />
                <MetricCard icon={Activity} label="Saved Treatments" value={String(monthlyStats.completed)} helper="Completed entries" />
                <MetricCard icon={IndianRupee} label="Revenue" value={`Rs. ${monthlyStats.revenue.toLocaleString("en-IN")}`} helper="From saved invoices" />
              </div>

            </Card>
          </main>

          <aside className="space-y-6">
            <Card className="p-5">
              <h2 className="text-xl font-bold text-ink">Quick Actions</h2>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <button onClick={() => { setShowCheckInQr(false); setShowAddAppointment(false); setShowAddPatient(true); }} className="grid min-h-28 place-items-center rounded-2xl border border-softgold/60 bg-white/70 p-4 text-center transition hover:border-gold hover:bg-linen/45">
                  <Plus className="h-8 w-8 text-gold" />
                  <span className="text-sm font-bold text-ink">New Patient</span>
                </button>
                <button onClick={() => { setShowCheckInQr(false); setShowAddPatient(false); setShowAddAppointment(true); }} className="grid min-h-28 place-items-center rounded-2xl border border-softgold/60 bg-white/70 p-4 text-center transition hover:border-gold hover:bg-linen/45">
                  <Send className="h-8 w-8 text-gold" />
                  <span className="text-sm font-bold text-ink">New Appointment</span>
                </button>
                <button onClick={() => { setShowAddPatient(false); setShowAddAppointment(false); setShowCheckInQr((open) => !open); }} className="grid min-h-28 place-items-center rounded-2xl border border-softgold/60 bg-white/70 p-4 text-center transition hover:border-gold hover:bg-linen/45">
                  <QrCode className="h-8 w-8 text-gold" />
                  <span className="text-sm font-bold text-ink">Check-in QR</span>
                </button>
                <a href="/clinic/calendar" className="grid min-h-28 place-items-center rounded-2xl border border-softgold/60 bg-white/70 p-4 text-center transition hover:border-gold hover:bg-linen/45">
                  <CalendarDays className="h-8 w-8 text-ink" />
                  <span className="text-sm font-bold text-ink">Calendar</span>
                </a>
              </div>
            </Card>
            {showCheckInQr && (
              <Card className="p-5 text-center">
                <h2 className="text-xl font-bold text-ink">Patient Check-in QR</h2>
                <p className="mt-2 text-sm leading-6 text-muted">Patients scan this when they arrive at the clinic.</p>
                <div className="mx-auto mt-5 grid h-56 w-56 place-items-center rounded-3xl border border-softgold/70 bg-white p-4 shadow-card">
                  <object
                    data={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(checkInUrl)}`}
                    type="image/png"
                    aria-label="Patient check-in QR code"
                    className="h-44 w-44"
                  />
                </div>
                <a href={checkInUrl} className="mt-4 block break-all rounded-2xl border border-softgold/60 bg-white/70 px-4 py-3 text-xs font-semibold text-gold">
                  {checkInUrl}
                </a>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </ClinicShell>
  );
}

function QueueStatus({ label }: { label: string }) {
  const styles = label === "In Consultation" ? "bg-sky-50 text-sky-700" : "bg-linen text-gold";
  return <span className={`inline-flex rounded-xl px-3 py-2 text-xs font-semibold ${styles}`}>{label}</span>;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper
}: {
  icon: typeof Stethoscope;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-softgold/60 bg-white/75 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-linen text-gold">
          <Icon className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-xs font-semibold text-muted">{label}</span>
          <span className="mt-1 block text-xl font-bold text-ink">{value}</span>
          <span className="mt-1 block text-xs font-semibold text-emerald-700">{helper}</span>
        </span>
      </div>
    </div>
  );
}
