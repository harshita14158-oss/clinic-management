"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock, MessageCircle, Plus, Search } from "lucide-react";
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

type VisitHistoryItem = {
  id: string;
  label: string;
  savedAt: string;
  summary: string;
  total: number;
  documentCount: number;
};

type PatientRecord = {
  id: string;
  name: string;
  initials?: string;
  phone: string;
  ageGender: string;
  checkedInAt: string;
  checkedAt?: string;
  source: string;
  chiefComplaint: string;
  medicalHistory: string;
};

type CalendarItem = {
  id: string;
  patientId: string;
  patientName: string;
  initials: string;
  phone: string;
  time: string;
  dateKey: string;
  title: string;
  subtitle: string;
  status: string;
  href: string;
  amount?: number;
};

const defaultQueue: QueuePatient[] = [];
const seedPatientPhones = new Set(["+91 98765 43210", "+91 91234 56789", "+91 99887 66554"]);

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

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function dayLabel(key: string) {
  return new Date(`${key}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
}

function formatAppointmentTime(value: string) {
  const date = new Date(`2026-01-01T${value}`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function appointmentWhatsAppUrl(item: Pick<CalendarItem, "patientName" | "phone" | "dateKey" | "time">, settings: ClinicSettings) {
  const number = normalizePhoneForWhatsApp(item.phone);
  if (!number) return "";
  const firstName = item.patientName.trim().split(/\s+/)[0] || "there";
  const message = [
    `Hello ${firstName},`,
    "",
    `Your appointment has been booked with ${settings.clinicDisplayName}.`,
    "",
    `Date: ${dayLabel(item.dateKey)}`,
    `Time: ${formatAppointmentTime(item.time)}`,
    "",
    "Clinic address:",
    settings.address,
    "",
    `Google Maps: ${settings.mapsUrl}`,
    `Phone: ${settings.phone}`,
    `Website: ${settings.website}`,
    "",
    "Please reach 5 minutes before your appointment time.",
    "Heal Dental Clinic"
  ].join("\n");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildMonthDays(month: Date) {
  const first = startOfMonth(month);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const leadingDays = first.getDay();
  return [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(first.getFullYear(), first.getMonth(), index + 1))
  ];
}

function parseVisitTime(value?: string) {
  if (!value) return "Saved";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved";
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
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
      // Ignore malformed records.
    }
  }

  return visits;
}

function isSeedQueuePatient(item: QueuePatient) {
  return seedPatientPhones.has(item.phone) && ["P-1024", "P-1025", "P-1026"].includes(item.id);
}

function sanitizeQueuePatients(items: QueuePatient[]) {
  return items.filter((item) => !isSeedQueuePatient(item));
}

function loadCalendarItems() {
  const savedQueue = window.localStorage.getItem("healDentalQueuePatients");
  let queueItems = defaultQueue;

  try {
    if (savedQueue) {
      const parsed = JSON.parse(savedQueue) as QueuePatient[];
      if (Array.isArray(parsed)) queueItems = sanitizeQueuePatients(parsed);
    }
  } catch {
    queueItems = defaultQueue;
  }

  const patientRecords = new Map<string, PatientRecord>();
  queueItems.forEach((item) => {
    patientRecords.set(item.id, {
      id: item.id,
      name: item.name,
      initials: item.initials,
      phone: item.phone,
      ageGender: item.ageGender,
      checkedInAt: item.checkedInAt,
      checkedAt: item.checkedAt,
      source: item.source,
      chiefComplaint: item.complaint,
      medicalHistory: "Not added"
    });
  });

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith("healDentalPatient:")) continue;
    const saved = window.localStorage.getItem(key);
    if (!saved) continue;
    try {
      const patient = JSON.parse(saved) as PatientRecord;
      if (patient?.id) patientRecords.set(patient.id, patient);
    } catch {
      // Ignore malformed patient records.
    }
  }

  const items: CalendarItem[] = queueItems.flatMap((item) => {
    const key = savedDateKey(item.checkedAt);
    if (!key) return [];

    return [{
      id: `queue-${item.id}`,
      patientId: item.id,
      patientName: item.name,
      initials: item.initials,
      phone: item.phone,
      time: item.checkedInAt,
      dateKey: key,
      title: item.complaint,
      subtitle: item.source,
      status: item.status,
      href: `/clinic/profile?patient=${item.id}`
    }];
  });

  patientRecords.forEach((patient) => {
    readVisitHistory(patient.id).forEach((visit) => {
      const key = dateKey(visit.savedAt);
      const isSameDayQueue = queueItems.some((item) => item.id === patient.id && savedDateKey(item.checkedAt) === key);
      if (isSameDayQueue) return;

      items.push({
        id: `visit-${patient.id}-${visit.id}`,
        patientId: patient.id,
        patientName: patient.name,
        initials: patient.initials || initialsFor(patient.name),
        phone: patient.phone,
        time: parseVisitTime(visit.savedAt),
        dateKey: key,
        title: visit.summary,
        subtitle: visit.label || "Saved Visit",
        status: "Completed",
        href: `/clinic/profile?patient=${patient.id}&visit=${visit.id}`,
        amount: visit.total
      });
    });
  });

  return items.sort((a, b) => a.time.localeCompare(b.time));
}

export function ClinicCalendar() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState("");
  const [settings, setSettings] = useState<ClinicSettings>(defaultClinicSettings);
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    name: "",
    phone: "",
    time: ""
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const date = params.get("date");
    if (date) {
      const parsed = new Date(`${date}T12:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        setSelectedDate(date);
        setSelectedMonth(startOfMonth(parsed));
      }
    }
    setSettings(loadClinicSettings());
    const localItems = loadCalendarItems();
    setItems(localItems);

    async function loadSupabaseAppointments() {
      try {
        const currentMonth = startOfMonth(new Date());
        const from = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
        const to = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();
        const response = await fetch(`/api/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
        if (!response.ok) return;
        const result = await response.json() as {
          appointments?: Array<{
            id: string;
            startsAt: string;
            purpose?: string | null;
            status?: string | null;
            patient?: {
              id?: string;
              patientCode?: string;
              fullName?: string;
              phone?: string;
            } | null;
          }>;
        };
        const mapped = (result.appointments ?? []).flatMap((appointment): CalendarItem[] => {
          const startsAt = new Date(appointment.startsAt);
          if (Number.isNaN(startsAt.getTime()) || !appointment.patient?.fullName) return [];
          const patientId = appointment.patient.patientCode || appointment.patient.id || appointment.id;
          return [{
            id: appointment.id,
            patientId,
            patientName: appointment.patient.fullName,
            initials: initialsFor(appointment.patient.fullName),
            phone: appointment.patient.phone || "",
            time: startsAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
            dateKey: dateKey(startsAt),
            title: appointment.purpose || "Appointment",
            subtitle: "Supabase appointment",
            status: appointment.status || "Scheduled",
            href: `/clinic/profile?patient=${patientId}`
          }];
        });
        if (mapped.length) {
          const dedupedLocal = localItems.filter((item) => !mapped.some((appointment) => appointment.patientId === item.patientId && appointment.dateKey === item.dateKey && appointment.time === item.time));
          setItems([...mapped, ...dedupedLocal].sort((a, b) => a.time.localeCompare(b.time)));
        }
      } catch {
        // Keep local fallback when Supabase is unavailable.
      }
    }

    loadSupabaseAppointments();
  }, []);

  async function createAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newAppointment.name.trim() || !newAppointment.phone.trim() || !newAppointment.time) {
      setNotice("Please add patient name, phone number, and appointment time.");
      return;
    }

    let id = `P-${Date.now().toString().slice(-5)}`;
    const appointmentAt = new Date(`${selectedDate}T${newAppointment.time}:00`);
    const checkedAt = Number.isNaN(appointmentAt.getTime()) ? new Date().toISOString() : appointmentAt.toISOString();
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newAppointment.name.trim(),
          phone: newAppointment.phone.trim(),
          startsAt: checkedAt,
          purpose: "Appointment"
        })
      });

      if (response.ok) {
        const result = await response.json() as {
          appointment?: { patient?: { id?: string; patientCode?: string } };
        };
        id = result.appointment?.patient?.patientCode || result.appointment?.patient?.id || id;
      }
    } catch {
      // Keep local fallback when Supabase is unavailable.
    }

    const checkedInAt = formatAppointmentTime(newAppointment.time);
    const queuePatient: QueuePatient = {
      id,
      name: newAppointment.name.trim(),
      initials: initialsFor(newAppointment.name),
      phone: newAppointment.phone.trim(),
      ageGender: "Details pending",
      complaint: "Appointment booked",
      checkedInAt,
      checkedAt,
      status: "Booked",
      source: "Appointment"
    };

    const savedQueue = window.localStorage.getItem("healDentalQueuePatients");
    let queueItems: QueuePatient[] = [];
    try {
      queueItems = savedQueue ? sanitizeQueuePatients(JSON.parse(savedQueue) as QueuePatient[]) : [];
    } catch {
      queueItems = [];
    }

    const nextQueue = [queuePatient, ...queueItems.filter((item) => item.id !== id)];
    window.localStorage.setItem("healDentalQueuePatients", JSON.stringify(nextQueue));
    window.localStorage.setItem(`healDentalPatient:${id}`, JSON.stringify({
      id,
      name: queuePatient.name,
      initials: queuePatient.initials,
      phone: queuePatient.phone,
      email: "Not added",
      ageGender: queuePatient.ageGender,
      checkedInAt,
      checkedAt,
      source: queuePatient.source,
      chiefComplaint: "Not added",
      medicalHistory: "Not added"
    }));
    setItems(loadCalendarItems());
    setNotice(`Appointment booked for ${queuePatient.name} on ${dayLabel(selectedDate)} at ${checkedInAt}.`);
    setNewAppointment({ name: "", phone: "", time: "" });
    setShowAddAppointment(false);
  }

  const monthDays = useMemo(() => buildMonthDays(selectedMonth), [selectedMonth]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => map.set(item.dateKey, (map.get(item.dateKey) ?? 0) + 1));
    return map;
  }, [items]);
  const selectedItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      if (item.dateKey !== selectedDate) return false;
      if (!query) return true;
      return [item.patientName, item.phone, item.patientId, item.title].join(" ").toLowerCase().includes(query);
    });
  }, [items, searchTerm, selectedDate]);
  const monthlyItems = useMemo(() => {
    return items.filter((item) => {
      const date = new Date(`${item.dateKey}T12:00:00`);
      return date.getFullYear() === selectedMonth.getFullYear() && date.getMonth() === selectedMonth.getMonth();
    });
  }, [items, selectedMonth]);

  return (
    <ClinicShell active="Calendar">
      <div className="p-4 sm:p-8">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Clinic Calendar</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-ink">{monthLabel(selectedMonth)}</h1>
            <p className="mt-2 text-muted">Review appointments, repeat visits, and saved treatment records by date.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex h-12 min-w-72 items-center gap-3 rounded-2xl border border-softgold/70 bg-white px-4 text-muted shadow-card focus-within:border-gold">
              <Search className="h-5 w-5" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search this day" className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
            </label>
            <button
              type="button"
              onClick={() => setShowAddAppointment(true)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white shadow-soft hover:bg-black"
            >
              <Plus className="h-4 w-4" />
              New Appointment
            </button>
          </div>
        </header>

        {notice && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {notice}
          </div>
        )}

        {showAddAppointment && (
          <Card className="mt-6 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Book Appointment</h2>
                <p className="mt-1 text-sm text-muted">Selected date: {dayLabel(selectedDate)}</p>
              </div>
              <button onClick={() => setShowAddAppointment(false)} className="text-sm font-semibold text-gold">Close</button>
            </div>
            <form onSubmit={createAppointment} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
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
                type="time"
                value={newAppointment.time}
                onChange={(event) => setNewAppointment((current) => ({ ...current, time: event.target.value }))}
                className="min-h-12 rounded-2xl border border-softgold/70 bg-white px-4 text-sm outline-none focus:border-gold"
              />
              <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white">
                Save
              </button>
            </form>
          </Card>
        )}

        <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_420px]">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-linen text-gold">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-ink">{monthLabel(selectedMonth)}</h2>
                  <p className="text-sm text-muted">{monthlyItems.length} appointments and records this month</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setSelectedMonth((current) => addMonths(current, -1))} className="grid h-11 w-11 place-items-center rounded-2xl border border-softgold/70 bg-white hover:border-gold" aria-label="Previous month">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => { const now = new Date(); setSelectedMonth(startOfMonth(now)); setSelectedDate(dateKey(now)); }} className="min-h-11 rounded-2xl border border-softgold/70 bg-white px-4 text-sm font-semibold hover:border-gold">
                  Today
                </button>
                <button type="button" onClick={() => setSelectedMonth((current) => addMonths(current, 1))} className="grid h-11 w-11 place-items-center rounded-2xl border border-softgold/70 bg-white hover:border-gold" aria-label="Next month">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-[0.1em] text-muted">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {monthDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="min-h-24 rounded-2xl border border-transparent" />;
                const key = dateKey(day);
                const count = counts.get(key) ?? 0;
                const isSelected = key === selectedDate;
                const isToday = key === dateKey(new Date());

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(key)}
                    className={`min-h-24 rounded-2xl border p-3 text-left transition ${isSelected ? "border-gold bg-linen shadow-card" : "border-softgold/55 bg-white/70 hover:border-gold hover:bg-linen/50"}`}
                  >
                    <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${isToday ? "bg-ink text-white" : "text-ink"}`}>
                      {day.getDate()}
                    </span>
                    {count ? (
                      <span className="mt-4 inline-flex rounded-full bg-gold/12 px-2 py-1 text-[11px] font-bold text-gold">
                        {count} entr{count > 1 ? "ies" : "y"}
                      </span>
                    ) : (
                      <span className="mt-4 block text-[11px] font-semibold text-muted/70">Free</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          <aside className="space-y-5">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-ink">{dayLabel(selectedDate)}</h2>
                  <p className="mt-1 text-sm text-muted">{selectedItems.length} appointments and records</p>
                </div>
                <a href="/clinic/dashboard" className="text-sm font-semibold text-gold">Dashboard</a>
              </div>

              <div className="mt-5 space-y-3">
                {selectedItems.length ? selectedItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-softgold/60 bg-white/75 p-4 transition hover:border-gold hover:bg-linen/40">
                    <a href={item.href} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-linen text-sm font-bold text-gold">{item.initials}</span>
                        <span>
                          <span className="block font-bold text-ink">{item.patientName}</span>
                          <span className="mt-1 block text-xs font-semibold text-muted">{item.patientId} - {item.phone}</span>
                        </span>
                      </div>
                      <span className="rounded-full bg-linen px-3 py-1 text-xs font-bold text-gold">{item.status}</span>
                    </div>
                    <p className="mt-4 font-semibold text-ink">{item.title}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-muted">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {item.time}</span>
                      <span>{item.subtitle}</span>
                      {item.amount ? <span>Rs. {item.amount.toLocaleString("en-IN")}</span> : null}
                    </div>
                    </a>
                    {item.status === "Booked" ? (
                      <a
                        href={appointmentWhatsAppUrl(item, settings)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-softgold/70 bg-white text-sm font-bold text-ink hover:border-gold"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp Appointment
                      </a>
                    ) : null}
                  </div>
                )) : (
                  <div className="rounded-2xl border border-softgold/60 bg-white/75 p-5">
                    <p className="font-bold text-ink">No visits on this date.</p>
                    <p className="mt-2 text-sm text-muted">Select another day or use dashboard search to find a patient history.</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-xl font-bold text-ink">Month Snapshot</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Snapshot label="Visits" value={String(monthlyItems.length)} />
                <Snapshot label="Revenue" value={`Rs. ${monthlyItems.reduce((sum, item) => sum + (item.amount ?? 0), 0).toLocaleString("en-IN")}`} />
                <Snapshot label="Patients" value={String(new Set(monthlyItems.map((item) => item.patientId)).size)} />
                <Snapshot label="Selected Day" value={String(selectedItems.length)} />
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </ClinicShell>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-softgold/60 bg-white/70 p-4">
      <p className="text-xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted">{label}</p>
    </div>
  );
}
