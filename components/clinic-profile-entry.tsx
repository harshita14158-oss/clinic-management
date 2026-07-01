"use client";

import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderOpen,
  IndianRupee,
  MessageCircle,
  Pill,
  Plus,
  QrCode,
  ReceiptText,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Field, IconCircle, inputClass, textareaClass } from "./ui";
import { ClinicShell } from "./clinic-shell";
import { downloadVisitPdf, DynamicVisitPdfData, PdfKind } from "@/lib/pdf";
import { ClinicSettings, defaultClinicSettings, loadClinicSettings, normalizePhoneForWhatsApp } from "@/lib/clinic-settings";

type PatientRecord = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  ageGender: string;
  checkedInAt: string;
  source: string;
  chiefComplaint: string;
  medicalHistory: string;
};

type MedicineRow = {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
};

type InvoiceRow = {
  id: number;
  service: string;
  description: string;
  amount: string;
  locked?: boolean;
};

type InvestigationRow = {
  id: number;
  name: string;
  area: string;
  reason: string;
};

type TreatmentSection = {
  id: number;
  clinicalFindings: string;
  diagnosis: string;
  tooth: string;
  treatments: string[];
  customTreatment: string;
  clinicalNotes: string;
};

type GeneratedDocument = {
  title: string;
  url: string;
  kind?: PdfKind;
  returnUrl?: string;
  data?: DynamicVisitPdfData;
  sections: Array<{ title: string; lines: string[] }>;
};

type VisitDraft = {
  clinicalFindings: string;
  diagnosis: string;
  tooth: string;
  treatments: string[];
  treatmentSections?: TreatmentSection[];
  procedureCompleted: boolean;
  treatmentAmounts: Record<string, string>;
  clinicalNotes: string;
  instructions: string;
  nextDate: string;
  nextTime: string;
  nextPurpose: string;
  medicines: MedicineRow[];
  invoiceItems: InvoiceRow[];
  paymentStatus: string;
  investigations: InvestigationRow[];
  uploadedFiles: string[];
  summaryGenerated: boolean;
  consentGenerated: boolean;
  savedAt: string;
};

type VisitHistoryItem = {
  id: string;
  label: string;
  savedAt: string;
  summary: string;
  total: number;
  documentCount: number;
  draft?: Partial<VisitDraft>;
};

const patients: PatientRecord[] = [
  {
    id: "P-1024",
    name: "Rahul Sharma",
    initials: "RS",
    phone: "+91 98765 43210",
    email: "rahul.sharma@gmail.com",
    ageGender: "Male, 32",
    checkedInAt: "10:30 AM",
    source: "QR Check-in",
    chiefComplaint: "Pain in lower right tooth while chewing",
    medicalHistory: "No major condition shared"
  },
  {
    id: "P-1025",
    name: "Priya Choudhary",
    initials: "PC",
    phone: "+91 91234 56789",
    email: "Not added",
    ageGender: "Female, 28",
    checkedInAt: "11:15 AM",
    source: "Walk-in",
    chiefComplaint: "Cleaning and mild gum bleeding",
    medicalHistory: "Blood pressure"
  },
  {
    id: "P-1026",
    name: "Amit Kumar",
    initials: "AK",
    phone: "+91 99887 66554",
    email: "Not added",
    ageGender: "Male, 41",
    checkedInAt: "12:00 PM",
    source: "QR Check-in",
    chiefComplaint: "Implant follow-up visit",
    medicalHistory: "Diabetes"
  }
];

const treatmentOptions = [
  "RCT",
  "Crown",
  "Filling",
  "Extraction",
  "Scaling",
  "Implant",
  "Wisdom Tooth Extraction",
  "Periodontal Flap Surgery",
  "Gum Curettage",
  "Laser Treatment",
  "Crown Removal",
  "Crown Refixing",
  "Other"
];

function createTreatmentSection(): TreatmentSection {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    clinicalFindings: "",
    diagnosis: "",
    tooth: "",
    treatments: [],
    customTreatment: "",
    clinicalNotes: ""
  };
}

function effectiveSectionTreatments(section: TreatmentSection) {
  const treatments = section.treatments.filter((item) => item !== "Other");
  if (section.treatments.includes("Other") || section.customTreatment.trim()) {
    treatments.push(section.customTreatment.trim() || "Other Treatment");
  }
  return treatments;
}

function defaultConsentBenefits() {
  return [
    "Helps treat the diagnosed dental condition.",
    "Aims to relieve symptoms and improve oral health.",
    "Supports better comfort, function, or aesthetics as applicable."
  ];
}

function defaultConsentRisks() {
  return [
    "Mild pain, swelling, sensitivity, or discomfort may occur.",
    "Healing response can vary between patients.",
    "Additional treatment may be required depending on clinical findings."
  ];
}

function defaultConsentAlternative() {
  return "Alternative options may include observation, medication, delayed treatment, referral, or a different dental procedure depending on clinical suitability.";
}

function treatmentAmountKey(sectionId: number, treatment: string) {
  return `${sectionId}:${treatment}`;
}

function combineNonEmpty(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean).join("\n\n");
}

function createVisitId() {
  return `V-${Date.now().toString().slice(-6)}`;
}

function defaultInvoiceRows(settings: ClinicSettings): InvoiceRow[] {
  return [
    { id: 1, service: "Consultation Charges", description: "", amount: settings.consultationFee },
    { id: 2, service: "X-ray", description: "", amount: settings.xrayFee }
  ];
}

function visitDisplayLabel(visit: Pick<VisitHistoryItem, "id" | "label">) {
  if (visit.id === "current") return "Saved Visit";
  return visit.label?.startsWith("Visit ") ? visit.label : `Visit ${visit.id}`;
}

function formatVisitDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "Today";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function draftHasDetails(draft: Partial<VisitDraft>) {
  return Boolean(
    draft.clinicalFindings ||
    draft.diagnosis ||
    draft.tooth ||
    draft.clinicalNotes ||
    draft.treatments?.length ||
    draft.treatmentSections?.some((section) =>
      section.clinicalFindings || section.diagnosis || section.tooth || section.treatments.length || section.customTreatment || section.clinicalNotes
    ) ||
    draft.medicines?.some((medicine) => medicine.name) ||
    draft.investigations?.some((item) => item.name) ||
    draft.invoiceItems?.some((item) => item.service && Number(item.amount) > 0) ||
    Object.values(draft.treatmentAmounts ?? {}).some((amount) => Number(amount) > 0)
  );
}

function draftHasClinicalDetails(draft?: Partial<VisitDraft>) {
  if (!draft) return false;
  return Boolean(
    draft.clinicalFindings ||
    draft.diagnosis ||
    draft.tooth ||
    draft.clinicalNotes ||
    draft.treatments?.length ||
    draft.treatmentSections?.some((section) =>
      section.clinicalFindings || section.diagnosis || section.tooth || section.treatments.length || section.customTreatment || section.clinicalNotes
    ) ||
    draft.medicines?.some((medicine) => medicine.name) ||
    draft.investigations?.some((item) => item.name)
  );
}

function visitHistoryFromDraft(id: string, draft: Partial<VisitDraft>): VisitHistoryItem {
  const treatmentSummary = draft.treatmentSections?.flatMap((section) =>
    effectiveSectionTreatments({
      ...createTreatmentSection(),
      ...section,
      customTreatment: section.customTreatment ?? ""
    }).map((treatment) => `${treatment}${section.tooth ? ` - ${section.tooth}` : ""}`)
  ) ?? draft.treatments ?? [];
  const invoiceTotal = [
    ...(draft.invoiceItems ?? []).map((item) => Number(item.amount) || 0),
    ...Object.values(draft.treatmentAmounts ?? {}).map((amount) => Number(amount) || 0)
  ].reduce((sum, amount) => sum + amount, 0);

  return {
    id,
    label: id === "current" ? "Saved Visit" : `Visit ${id}`,
    savedAt: draft.savedAt ?? new Date().toISOString(),
    summary: treatmentSummary.length
      ? treatmentSummary.join(", ")
      : draft.diagnosis || draft.clinicalFindings || "Visit details saved",
    total: invoiceTotal,
    documentCount: [
      draft.summaryGenerated,
      draft.medicines?.some((medicine) => medicine.name) || Boolean(draft.diagnosis),
      invoiceTotal > 0,
      draft.consentGenerated,
      draft.consentGenerated && Boolean(draft.instructions)
    ].filter(Boolean).length,
    draft
  };
}

const instructionTemplates: Record<string, string> = {
  RCT: `Root canal care instructions

What to expect:
- Mild pain, tenderness, or sensitivity for 2-3 days can be normal.
- The treated tooth may feel slightly high or uncomfortable while chewing until the final restoration is completed.

Eating and chewing:
- Avoid chewing hard food from the treated side until advised.
- Eat soft food for the first day if the tooth feels tender.
- Do not bite directly on the temporary filling or temporary crown.

Medicines:
- Take medicines only as prescribed.
- Do not stop antibiotics midway if they have been prescribed.
- Avoid taking painkillers on an empty stomach unless specifically advised.

Oral care:
- Continue brushing normally, but be gentle around the treated tooth.
- Keep the area clean to avoid food lodgement.

When to call the clinic:
- Severe pain that does not reduce with medicine.
- Swelling, fever, pus discharge, or difficulty opening the mouth.
- Temporary filling comes out or the tooth breaks.
- Bite feels very high or painful.

Follow-up:
- Root canal treated teeth usually need a crown or final restoration for long-term strength. Please follow the advised appointment plan.`,
  Extraction: `Tooth extraction care instructions

First 24 hours:
- Bite firmly on the gauze pack for 30-45 minutes.
- Do not spit, rinse forcefully, use a straw, smoke, or drink alcohol.
- Do not touch the extraction socket with your finger or tongue.

Bleeding:
- Mild oozing for a few hours is common.
- If bleeding continues, place clean gauze over the area and bite firmly for 30 minutes.
- If heavy bleeding does not stop, call the clinic immediately.

Pain and swelling:
- Take medicines only as prescribed.
- Apply an ice pack on the outside of the face for 10 minutes on and 10 minutes off during the first day.
- Swelling may increase for 24-48 hours and then gradually reduce.

Food and drinks:
- Eat soft, cool food for the first day.
- Avoid hot food, spicy food, hard food, and carbonated drinks for 24 hours.
- Drink plenty of water, but do not use a straw.

After 24 hours:
- Start gentle warm saline rinses 3-4 times daily, especially after meals.
- Brush normally, but avoid direct brushing over the extraction socket for a few days.

Call the clinic urgently if:
- Bleeding is heavy or does not stop.
- Pain increases after 2-3 days instead of reducing.
- There is fever, pus, bad taste, increasing swelling, or difficulty swallowing/breathing.
- You feel numbness that does not improve.`,
  "Wisdom Tooth Extraction": `Wisdom tooth extraction care instructions

First 24 hours:
- Bite on the gauze pack as advised.
- Do not spit, rinse forcefully, smoke, use a straw, or disturb the surgical area.
- Rest and avoid strenuous activity.

Swelling and mouth opening:
- Swelling and stiffness can happen after wisdom tooth removal.
- Use an ice pack on the face for the first 24 hours.
- Limited mouth opening can occur for a few days and usually improves gradually.

Food:
- Take soft food such as curd, khichdi, soft rice, soup after it cools, smoothies without straw, or mashed food.
- Avoid hard, spicy, hot, crunchy food and seeds that can enter the socket.

Oral care:
- Do not rinse on the day of surgery.
- From the next day, do gentle warm saline rinses after meals.
- Brush gently and keep the rest of the mouth clean.

Medicines:
- Take medicines exactly as prescribed.
- If antibiotics are prescribed, complete the full course.

Call the clinic urgently if:
- Bleeding does not stop with pressure.
- Swelling rapidly increases after 48 hours.
- Fever, pus discharge, foul taste, severe pain, or difficulty swallowing occurs.
- Numbness of lip, chin, or tongue persists.`,
  "Periodontal Flap Surgery": `Periodontal flap surgery care instructions

First 24 hours:
- Do not spit, rinse forcefully, smoke, drink alcohol, or disturb the surgical area.
- Mild bleeding or pink saliva can be normal.
- Rest and avoid strenuous activity.

Food:
- Eat soft, cool food on the day of surgery.
- Avoid hot, spicy, hard, crunchy, or seeded food that can irritate the gums.
- Chew from the opposite side if possible.

Swelling and discomfort:
- Use an ice pack as advised for the first day.
- Take medicines only as prescribed.
- Some swelling, tightness, or soreness can occur for a few days.

Oral hygiene:
- Do not brush directly over the surgical area until advised.
- Keep the rest of the mouth clean.
- Use prescribed mouthwash or warm saline rinses only as instructed.

Sutures and dressing:
- Do not pull or disturb sutures or periodontal dressing.
- If dressing becomes loose but there is no pain or bleeding, inform the clinic.

Call the clinic urgently if:
- Bleeding is heavy or does not stop with pressure.
- Swelling increases rapidly, fever develops, pus discharge occurs, or pain worsens after 2-3 days.
- Sutures open, dressing falls with pain, or there is difficulty swallowing.`,
  "Gum Curettage": `Gum curettage care instructions

What to expect:
- Mild gum soreness, bleeding, or sensitivity can happen for 1-3 days.
- Gums may feel tender while brushing initially.

Food:
- Prefer soft food for the first day.
- Avoid very hot, spicy, hard, or sharp food until soreness reduces.

Oral care:
- Brush gently with a soft toothbrush.
- Do not skip cleaning because of mild bleeding.
- Use prescribed mouthwash or gel exactly as advised.

Healing:
- Gum bleeding and bad breath should gradually reduce as inflammation improves.
- Maintain regular cleaning to prevent plaque and calculus build-up again.

Call the clinic if:
- Bleeding is heavy.
- Pain or swelling increases.
- There is pus discharge, fever, or severe sensitivity.`,
  "Laser Treatment": `Laser dental treatment care instructions

What to expect:
- Mild soreness, sensitivity, or white/yellow healing patches can be normal.
- Do not scrape or disturb the treated area.

Food:
- Avoid hot, spicy, acidic, and hard food for 24-48 hours.
- Prefer soft and cool food if the area feels tender.

Oral care:
- Brush gently around the treated area.
- Use mouthwash or gel only if prescribed.
- Avoid smoking and alcohol during healing.

Call the clinic if:
- Pain is severe or increasing.
- Swelling, pus discharge, fever, or bleeding occurs.
- The treated area is not improving as expected.`,
  "Crown Removal": `Crown removal care instructions

What to expect:
- The tooth may feel sensitive after crown removal.
- If a temporary crown or dressing is placed, it is meant to protect the tooth until the next step.

Eating:
- Avoid hard, sticky, or chewy food from that side.
- Do not bite directly on the treated tooth unless advised.

Oral care:
- Keep the area clean.
- Brush gently around the temporary restoration.

Call the clinic if:
- Temporary crown or dressing comes out.
- Pain, swelling, or sharp edges develop.
- Bite feels high or uncomfortable.`,
  "Crown Refixing": `Crown refixing care instructions

After refixing:
- Avoid eating for at least 30 minutes or as advised.
- Avoid hard or sticky food from that side for the first day.

Oral care:
- Brush normally but be gentle around the crown margins.
- Clean around the crown carefully to avoid food lodgement.

What to watch for:
- The crown should feel comfortable while biting.
- Mild sensitivity can happen for a short time.

Call the clinic if:
- Crown feels high, loose, painful, or uncomfortable.
- Food keeps getting stuck.
- Crown comes out again or breaks.`,
  Scaling: `Scaling and gum care instructions

What to expect:
- Mild sensitivity, gum soreness, or slight bleeding for 1-2 days can happen.
- Bad breath usually improves as gum inflammation reduces.

Food and drinks:
- Avoid very hot, very cold, spicy, or acidic food for the first day if teeth feel sensitive.
- Drink enough water.

Oral hygiene:
- Brush twice daily with a soft toothbrush.
- Clean between teeth using floss or interdental brushes if advised.
- Do not skip brushing because of mild bleeding; bleeding usually improves with better cleaning.

Gum care:
- Warm saline rinses can be done if gums feel sore.
- Use any prescribed mouthwash only as directed.

When to call the clinic:
- Bleeding is heavy or does not reduce.
- Pain or swelling increases.
- Sensitivity is severe or continues for many days.

Follow-up:
- Gum treatment may need review, deep cleaning, or periodontal therapy depending on pocket depth and bleeding.`,
  Filling: `Filling care instructions

What to expect:
- Mild sensitivity to cold, sweet, or pressure can happen for a few days.
- Numbness from anesthesia may last for a few hours.

Eating:
- Avoid eating until numbness wears off to prevent cheek or tongue biting.
- Avoid very hard or sticky food on the filled tooth for the first day.

Oral care:
- Brush and floss normally unless advised otherwise.
- Keep the area clean to avoid food lodgement.

When to call the clinic:
- Bite feels high or painful.
- Sensitivity increases or does not improve.
- Filling chips, breaks, or comes out.
- Pain starts spontaneously or wakes you at night.`,
  Crown: `Crown care instructions

Temporary crown:
- Avoid hard, sticky, or chewy food until the final crown is fixed.
- Chew from the opposite side if possible.
- If the temporary crown comes out, contact the clinic.

After final crown:
- Mild sensitivity for a few days can be normal.
- Maintain brushing and cleaning around the crown margins.
- Avoid using teeth to open packets or bite very hard objects.

When to call the clinic:
- Crown feels high while biting.
- Pain, swelling, food lodgement, or loosening occurs.
- Crown comes out or breaks.`,
  Implant: `Implant care instructions

First 24 hours:
- Avoid spitting, forceful rinsing, smoking, alcohol, and strenuous activity.
- Use ice packs as advised if swelling is expected.

Food:
- Eat soft food and avoid chewing directly over the implant site.
- Avoid hot, spicy, hard, or crunchy food initially.

Oral care:
- Keep the area clean but be gentle around the implant site.
- Use mouthwash only if prescribed.
- Do not disturb sutures with tongue or fingers.

Medicines:
- Take prescribed medicines exactly as directed.

Call the clinic urgently if:
- Bleeding does not stop.
- Swelling, pain, fever, pus discharge, or implant mobility occurs.
- Sutures open or the healing cap feels loose.

Follow-up:
- Implant treatment needs planned review appointments for healing, impressions, and final crown placement.`
};

const medicinePresets = [
  { name: "Amoxicillin 500mg", dosage: "1 capsule", frequency: "Three times daily after food", duration: "5 days" },
  { name: "Augmentin 625mg", dosage: "1 tablet", frequency: "Twice daily after food", duration: "5 days" },
  { name: "Zerodol-SP", dosage: "1 tablet", frequency: "Twice daily after food", duration: "3 days" },
  { name: "Zerodol-P", dosage: "1 tablet", frequency: "Twice daily after food", duration: "3 days" },
  { name: "Diclomol-SP", dosage: "1 tablet", frequency: "Twice daily after food", duration: "3 days" },
  { name: "Diclomol", dosage: "1 tablet", frequency: "Twice daily after food", duration: "3 days" },
  { name: "Hifenac-P", dosage: "1 tablet", frequency: "Twice daily after food", duration: "3 days" },
  { name: "Hifenac-MR", dosage: "1 tablet", frequency: "Twice daily after food", duration: "3 days" },
  { name: "INIR", dosage: "1 tablet", frequency: "Twice daily after food", duration: "3 days" },
  { name: "INIR-P", dosage: "1 tablet", frequency: "Twice daily after food", duration: "3 days" },
  { name: "Paracetamol 650mg", dosage: "1 tablet", frequency: "As needed after food", duration: "3 days" },
  { name: "Ibuprofen 400mg", dosage: "1 tablet", frequency: "Twice daily after food", duration: "3 days" },
  { name: "Azithromycin 500mg", dosage: "1 tablet", frequency: "Once daily after food", duration: "3 days" },
  { name: "Cefixime 200mg", dosage: "1 tablet", frequency: "Twice daily after food", duration: "5 days" },
  { name: "Clindamycin 300mg", dosage: "1 capsule", frequency: "Three times daily after food", duration: "5 days" },
  { name: "Doxycycline 100mg", dosage: "1 capsule", frequency: "Once daily after food", duration: "5 days" },
  { name: "Metrogyl 400mg", dosage: "1 tablet", frequency: "Three times daily after food", duration: "5 days" },
  { name: "Pantoprazole 40mg", dosage: "1 tablet", frequency: "Once daily before breakfast", duration: "5 days" },
  { name: "Pan-D", dosage: "1 capsule", frequency: "Once daily before breakfast", duration: "5 days" },
  { name: "Razo-D", dosage: "1 capsule", frequency: "Once daily before breakfast", duration: "5 days" },
  { name: "Omez-D", dosage: "1 capsule", frequency: "Once daily before breakfast", duration: "5 days" },
  { name: "Omeprazole 20mg", dosage: "1 capsule", frequency: "Once daily before breakfast", duration: "5 days" },
  { name: "Chlorhexidine Mouthwash", dosage: "10 ml rinse", frequency: "Twice daily after brushing", duration: "7 days" },
  { name: "Metrohex Plus Gel", dosage: "Apply locally", frequency: "Twice daily after brushing", duration: "7 days" },
  { name: "Stolin Gum Paint", dosage: "Apply locally", frequency: "Twice daily after brushing", duration: "7 days" },
  { name: "Stolin-R Gum Astringent", dosage: "Apply locally", frequency: "Twice daily after brushing", duration: "7 days" },
  { name: "Metrogyl DG Gel", dosage: "Apply locally", frequency: "Twice daily after brushing", duration: "7 days" },
  { name: "Sensodyne Toothpaste", dosage: "Pea-sized amount", frequency: "Brush twice daily", duration: "2 weeks" },
  { name: "Colgate Sensitive Toothpaste", dosage: "Pea-sized amount", frequency: "Brush twice daily", duration: "2 weeks" },
  { name: "Vantej Toothpaste", dosage: "Pea-sized amount", frequency: "Brush twice daily", duration: "2 weeks" },
  { name: "RA Thermoseal Toothpaste", dosage: "Pea-sized amount", frequency: "Brush twice daily", duration: "2 weeks" },
  { name: "Thermokind-F Gel", dosage: "Apply on sensitive area", frequency: "Twice daily", duration: "7 days" },
  { name: "Ultra Soft Toothbrush", dosage: "Use gently", frequency: "Brush twice daily", duration: "As advised" },
  { name: "Interdental Brush", dosage: "Use between teeth", frequency: "Once daily at night", duration: "As advised" },
  { name: "Dental Floss", dosage: "Use gently", frequency: "Once daily at night", duration: "As advised" },
  { name: "Water Flosser", dosage: "Use on low pressure", frequency: "Once daily", duration: "As advised" },
  { name: "Tongue Cleaner", dosage: "Use gently", frequency: "Once daily", duration: "As advised" }
];

const investigationPresets = ["RVG X-ray", "IOPA X-ray", "OPG X-ray", "CBCT scan", "Lateral cephalogram", "Blood investigation"];

const timeSlots = [
  "09:00 AM",
  "09:15 AM",
  "09:30 AM",
  "09:45 AM",
  "10:00 AM",
  "10:15 AM",
  "10:30 AM",
  "10:45 AM",
  "11:00 AM",
  "11:15 AM",
  "11:30 AM",
  "11:45 AM",
  "12:00 PM",
  "12:15 PM",
  "12:30 PM",
  "12:45 PM",
  "01:00 PM",
  "01:15 PM",
  "01:30 PM",
  "01:45 PM",
  "02:00 PM",
  "02:15 PM",
  "02:30 PM",
  "02:45 PM",
  "03:00 PM",
  "03:15 PM",
  "03:30 PM",
  "03:45 PM",
  "04:00 PM",
  "04:15 PM",
  "04:30 PM",
  "04:45 PM",
  "05:00 PM",
  "05:15 PM",
  "05:30 PM",
  "05:45 PM",
  "06:00 PM",
  "06:15 PM",
  "06:30 PM",
  "06:45 PM",
  "07:00 PM"
];

const treatmentInvoiceNames: Record<string, string> = {
  RCT: "Root Canal Treatment",
  Crown: "Crown",
  Filling: "Filling",
  Extraction: "Extraction",
  Scaling: "Scaling",
  Implant: "Implant Treatment",
  "Wisdom Tooth Extraction": "Wisdom Tooth Extraction",
  "Periodontal Flap Surgery": "Periodontal Flap Surgery",
  "Gum Curettage": "Gum Curettage",
  "Laser Treatment": "Laser Treatment",
  "Crown Removal": "Crown Removal",
  "Crown Refixing": "Crown Refixing",
  Other: "Other Treatment"
};

const documentTitles: Record<PdfKind, string> = {
  summary: "Visit Summary",
  prescription: "Prescription",
  instructions: "Care Instructions",
  invoice: "Invoice",
  consent: "Consent Form"
};

const consentCopy: Record<string, { risks: string[]; benefits: string[]; alternatives: string }> = {
  RCT: {
    risks: [
      "Mild to moderate pain, tenderness, or sensitivity may occur for a few days.",
      "Swelling, discomfort on biting, or flare-up of infection may occur during or after treatment.",
      "Root canal instruments may separate inside the canal in rare cases.",
      "A canal may be calcified, curved, blocked, or difficult to clean completely.",
      "The tooth may need a crown or further restoration to prevent fracture.",
      "Re-treatment, surgical treatment, or extraction may be required if healing is not satisfactory."
    ],
    benefits: ["Removes infection from inside the tooth.", "Relieves pain and helps save the natural tooth.", "Restores chewing comfort after completion."],
    alternatives: "Extraction of the tooth followed by replacement options such as bridge, implant, or denture."
  },
  Extraction: {
    risks: [
      "Pain, swelling, bruising, or bleeding may occur after the procedure.",
      "Difficulty in opening the mouth, chewing, or swallowing may occur for a few days.",
      "Dry socket, infection, delayed healing, or need for additional medication may occur.",
      "Root fracture, bone removal, or sectioning of the tooth may be required during removal.",
      "Adjacent teeth, fillings, crowns, gums, lips, cheeks, or tongue may be injured accidentally.",
      "Sinus exposure or communication may occur in upper back tooth extractions.",
      "Temporary or rarely permanent numbness, tingling, altered sensation, or nerve paresthesia may occur, especially near lower back teeth.",
      "A small tooth/root fragment may be intentionally left if removal carries higher risk.",
      "Additional procedure, referral, sutures, or follow-up visits may be required."
    ],
    benefits: ["Removes the infected or non-restorable tooth.", "Helps control pain, swelling, and infection.", "Prevents further spread of dental infection."],
    alternatives: "Saving the tooth with endodontic, restorative, or periodontal treatment if clinically possible."
  },
  "Wisdom Tooth Extraction": {
    risks: [
      "Pain, swelling, bruising, bleeding, and restricted mouth opening are common for a few days.",
      "Difficulty in chewing, swallowing, speaking, or maintaining oral hygiene may occur temporarily.",
      "Dry socket, infection, delayed healing, food lodgement, or bad taste may occur.",
      "The tooth may need bone removal, sectioning, sutures, or a longer surgical procedure.",
      "Adjacent tooth, restoration, gum, soft tissue, or jaw bone may be injured accidentally.",
      "Temporary or rarely permanent numbness, tingling, burning, altered taste, or nerve paresthesia may occur due to proximity to nerves.",
      "Jaw stiffness, muscle soreness, or rarely jaw joint discomfort may occur.",
      "Sinus exposure can occur in upper wisdom tooth removal.",
      "A root fragment may be left if removal may damage nearby nerves, sinus, or bone.",
      "Additional treatment, medication, review appointment, or specialist referral may be required."
    ],
    benefits: ["Removes the impacted or problematic wisdom tooth.", "Helps prevent repeated pain, swelling, decay, or gum infection.", "Protects the adjacent tooth from pressure or decay where applicable."],
    alternatives: "Observation, medication for temporary relief, or delayed removal if clinically suitable."
  },
  Implant: {
    risks: [
      "Pain, swelling, bruising, bleeding, or infection can occur after surgery.",
      "Implant healing may be delayed or the implant may fail to integrate with bone.",
      "Bone grafting, sinus lift, additional scans, or additional surgery may be required.",
      "Temporary or rarely permanent numbness, tingling, or altered sensation may occur near nerve areas.",
      "Sinus complications may occur for upper posterior implants.",
      "Screw loosening, crown fracture, gum recession, food lodgement, or peri-implant infection may occur later.",
      "Smoking, diabetes, poor oral hygiene, bone quality, and medical conditions can affect success."
    ],
    benefits: ["Replaces the missing tooth with a fixed option.", "Helps restore chewing comfort and smile aesthetics.", "Preserves adjacent teeth when compared with some bridge options."],
    alternatives: "Removable denture, fixed bridge, or no replacement depending on clinical condition."
  },
  "Periodontal Flap Surgery": {
    risks: [
      "Pain, swelling, bleeding, gum tenderness, or delayed healing may occur.",
      "Gum recession, root exposure, sensitivity, and longer-looking teeth may occur after healing.",
      "Teeth may feel temporarily mobile during healing.",
      "Black triangles or food lodgement may become more noticeable.",
      "Infection, wound opening, or need for additional periodontal treatment may occur.",
      "Long-term success depends on oral hygiene, maintenance visits, smoking status, and medical conditions."
    ],
    benefits: ["Allows deep cleaning of infected gum pockets.", "Helps reduce bleeding, infection, and pocket depth.", "Supports long-term gum health with maintenance."],
    alternatives: "Non-surgical scaling, root planing, medication, or extraction of hopeless teeth where indicated."
  },
  "Gum Curettage": {
    risks: ["Temporary soreness, bleeding, or sensitivity may occur.", "Gums may feel tender during healing.", "Additional periodontal treatment may be needed."],
    benefits: ["Helps remove inflamed tissue and plaque from gum pockets.", "Reduces gum bleeding and infection.", "Supports healing when combined with oral hygiene care."],
    alternatives: "Scaling and root planing, periodontal surgery, medication, or observation depending on severity."
  },
  "Laser Treatment": {
    risks: ["Temporary soreness, sensitivity, or minor swelling may occur.", "Multiple sittings may be required depending on the case.", "Healing response can vary between patients."],
    benefits: ["Helps reduce infected or inflamed tissue with minimal discomfort.", "Supports better healing in suitable gum or soft tissue cases.", "Can reduce bleeding during selected procedures."],
    alternatives: "Conventional surgical or non-surgical treatment depending on the condition."
  },
  Filling: {
    risks: [
      "Sensitivity to cold, sweet, or biting may occur after the filling.",
      "A deep cavity may later require root canal treatment if the nerve is affected.",
      "Filling fracture, marginal leakage, high bite, or replacement may be required.",
      "Local anesthesia related numbness or soft tissue biting can occur temporarily."
    ],
    benefits: ["Restores the decayed or broken part of the tooth.", "Helps reduce food lodgement and sensitivity.", "Protects remaining tooth structure where possible."],
    alternatives: "Observation, indirect restoration, root canal treatment, crown, or extraction depending on tooth condition."
  },
  Crown: {
    risks: [
      "Temporary sensitivity, gum soreness, or bite discomfort may occur.",
      "Root canal treatment may be required later if the tooth nerve becomes symptomatic.",
      "Crown fracture, ceramic chipping, debonding, or need for replacement may occur.",
      "Shade, shape, or fit may require adjustment before final cementation."
    ],
    benefits: ["Protects weakened tooth structure.", "Restores chewing function and tooth shape.", "Improves strength and aesthetics where applicable."],
    alternatives: "Large filling, onlay, no treatment, extraction, or implant depending on tooth condition."
  },
  Scaling: {
    risks: [
      "Temporary sensitivity, gum soreness, or mild bleeding may occur.",
      "Existing gum recession or tooth mobility may become more noticeable after deposits are removed.",
      "Stains or deposits may require additional visits if heavy.",
      "Long-term improvement depends on home care and regular maintenance."
    ],
    benefits: ["Removes plaque, calculus, and stains.", "Reduces gum bleeding, bad breath, and inflammation.", "Supports better gum health."],
    alternatives: "Delayed cleaning, periodontal therapy, or referral depending on gum condition."
  }
};

export function ClinicProfileEntry() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patient") ?? "P-1024";
  const [savedPatient, setSavedPatient] = useState<PatientRecord | null>(null);
  const listedPatient = patients.find((item) => item.id === patientId);
  const blankPatient: PatientRecord = {
    id: patientId,
    name: "New Patient",
    initials: "P",
    phone: "Not added",
    email: "Not added",
    ageGender: "Details pending",
    checkedInAt: "Just now",
    source: "Walk-in",
    chiefComplaint: "Not added",
    medicalHistory: "Not added"
  };
  const selectedPatient = (savedPatient?.id === patientId ? savedPatient : null) ?? listedPatient ?? blankPatient;
  const [activeVisitId, setActiveVisitId] = useState(searchParams.get("visit") ?? "current");
  const [visitHistory, setVisitHistory] = useState<VisitHistoryItem[]>([]);
  const visitDraftKey = activeVisitId === "current"
    ? `healDentalVisitDraft:${selectedPatient.id}`
    : `healDentalVisitDraft:${selectedPatient.id}:${activeVisitId}`;
  const visitHistoryKey = `healDentalVisitHistory:${selectedPatient.id}`;
  const activeVisitLabel = activeVisitId === "current" ? "Saved Visit" : `Visit ${activeVisitId}`;
  const portalToken = useMemo(() => `${selectedPatient.id}-${activeVisitId}`.replace(/[^A-Za-z0-9-]/g, ""), [selectedPatient.id, activeVisitId]);

  const [notice, setNotice] = useState("");
  const [settings, setSettings] = useState<ClinicSettings>(defaultClinicSettings);
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [copiedPortal, setCopiedPortal] = useState(false);
  const [summaryGenerated, setSummaryGenerated] = useState(false);
  const [consentGenerated, setConsentGenerated] = useState(false);
  const [treatmentSections, setTreatmentSections] = useState<TreatmentSection[]>([createTreatmentSection()]);
  const [procedureCompleted, setProcedureCompleted] = useState(false);
  const [treatmentAmounts, setTreatmentAmounts] = useState<Record<string, string>>({});
  const [instructions, setInstructions] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("");
  const [nextPurpose, setNextPurpose] = useState("");
  const [openMedicinePickerId, setOpenMedicinePickerId] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [medicines, setMedicines] = useState<MedicineRow[]>([
    { id: 1, name: "", dosage: "", frequency: "", duration: "" }
  ]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceRow[]>([
    { id: 1, service: "Consultation Charges", description: "", amount: defaultClinicSettings.consultationFee },
    { id: 2, service: "X-ray", description: "", amount: defaultClinicSettings.xrayFee }
  ]);
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [investigations, setInvestigations] = useState<InvestigationRow[]>([
    { id: 1, name: "", area: "", reason: "" }
  ]);

  const clinicalFindings = combineNonEmpty(treatmentSections.map((section) => section.clinicalFindings));
  const diagnosis = combineNonEmpty(treatmentSections.map((section) => section.diagnosis));
  const tooth = combineNonEmpty(treatmentSections.map((section) => section.tooth));
  const treatments = Array.from(new Set(treatmentSections.flatMap((section) => effectiveSectionTreatments(section))));
  const treatmentLines = treatmentSections.flatMap((section) =>
    effectiveSectionTreatments(section).map((treatment) => `${treatment}${section.tooth ? ` - Tooth / area: ${section.tooth}` : ""}`)
  );
  const clinicalNotesText = combineNonEmpty(treatmentSections.map((section) => section.clinicalNotes));
  const clinicalSectionLines = treatmentSections
    .filter((section) => section.clinicalFindings || section.diagnosis || section.tooth || effectiveSectionTreatments(section).length || section.clinicalNotes)
    .map((section, index) => {
      const parts = [
        `Treatment ${index + 1}`,
        section.tooth ? `Tooth / area: ${section.tooth}` : "",
        section.clinicalFindings ? `Findings: ${section.clinicalFindings}` : "",
        section.diagnosis ? `Diagnosis: ${section.diagnosis}` : "",
        effectiveSectionTreatments(section).length ? `Advised: ${effectiveSectionTreatments(section).join(", ")}` : "",
        section.clinicalNotes ? `Notes: ${section.clinicalNotes}` : ""
      ].filter(Boolean);
      return parts.join("\n");
    });

  useEffect(() => {
    setSettings(loadClinicSettings());
    const saved = window.localStorage.getItem(`healDentalPatient:${patientId}`);
    if (!saved) {
      setSavedPatient(null);
      return;
    }

    try {
      setSavedPatient(JSON.parse(saved) as PatientRecord);
    } catch {
      setSavedPatient(null);
    }
  }, [patientId]);

  useEffect(() => {
    const savedActiveVisit = window.localStorage.getItem(`healDentalActiveVisit:${patientId}`);
    const urlVisit = searchParams.get("visit");
    const nextVisitId = urlVisit || savedActiveVisit || "current";
    setActiveVisitId(nextVisitId);
  }, [patientId, searchParams]);

  useEffect(() => {
    const saved = window.localStorage.getItem(visitHistoryKey);
    let history: VisitHistoryItem[] = [];
    try {
      const parsed = saved ? JSON.parse(saved) as VisitHistoryItem[] : [];
      history = Array.isArray(parsed) ? parsed : [];
    } catch {
      history = [];
    }

    const originalDraftRaw = window.localStorage.getItem(`healDentalVisitDraft:${selectedPatient.id}`);
    if (originalDraftRaw) {
      try {
        const originalDraft = JSON.parse(originalDraftRaw) as Partial<VisitDraft>;
        if (draftHasDetails(originalDraft) && !history.some((visit) => visit.id === "current")) {
          history = [visitHistoryFromDraft("current", originalDraft), ...history];
        }
      } catch {
        // Ignore malformed legacy drafts.
      }
    }

    setVisitHistory(history);
    window.localStorage.setItem(visitHistoryKey, JSON.stringify(history));
  }, [selectedPatient.id, visitHistoryKey]);

  useEffect(() => {
    let saved = window.localStorage.getItem(visitDraftKey);
    if (!saved) {
      const historyDraft = visitHistory.find((visit) => visit.id === activeVisitId)?.draft;
      if (historyDraft && draftHasDetails(historyDraft)) {
        saved = JSON.stringify(historyDraft);
        window.localStorage.setItem(visitDraftKey, saved);
      }
    }

    if (!saved) {
      setTreatmentSections([createTreatmentSection()]);
      setProcedureCompleted(false);
      setTreatmentAmounts({});
      setInstructions("");
      setNextDate("");
      setNextTime("");
      setNextPurpose("");
      setMedicines([{ id: 1, name: "", dosage: "", frequency: "", duration: "" }]);
      setInvoiceItems(defaultInvoiceRows(settings));
      setPaymentStatus("Paid");
      setInvestigations([{ id: 1, name: "", area: "", reason: "" }]);
      setUploadedFiles([]);
      setSummaryGenerated(false);
      setConsentGenerated(false);
      setGeneratedDocument(null);
      setPortalReady(false);
      setNotice("");
      return;
    }

    try {
      const draft = JSON.parse(saved) as Partial<VisitDraft>;
      if (draft.treatmentSections?.length) {
        setTreatmentSections(draft.treatmentSections.map((section) => ({
          ...section,
          customTreatment: section.customTreatment ?? ""
        })));
      } else {
        setTreatmentSections([{
          id: Date.now(),
          clinicalFindings: draft.clinicalFindings ?? "",
          diagnosis: draft.diagnosis ?? "",
          tooth: draft.tooth ?? "",
          treatments: Array.isArray(draft.treatments) ? draft.treatments : [],
          customTreatment: "",
          clinicalNotes: draft.clinicalNotes ?? ""
        }]);
      }
      setProcedureCompleted(Boolean(draft.procedureCompleted));
      setTreatmentAmounts(draft.treatmentAmounts ?? {});
      setInstructions(draft.instructions ?? "");
      setNextDate(draft.nextDate ?? "");
      setNextTime(draft.nextTime ?? "");
      setNextPurpose(draft.nextPurpose ?? "");
      setMedicines(draft.medicines?.length ? draft.medicines : [{ id: 1, name: "", dosage: "", frequency: "", duration: "" }]);
      setInvoiceItems(draft.invoiceItems?.length ? draft.invoiceItems : defaultInvoiceRows(settings));
      setPaymentStatus(draft.paymentStatus ?? "Paid");
      setInvestigations(draft.investigations?.length ? draft.investigations : [{ id: 1, name: "", area: "", reason: "" }]);
      setUploadedFiles(draft.uploadedFiles ?? []);
      setSummaryGenerated(Boolean(draft.summaryGenerated));
      setConsentGenerated(Boolean(draft.consentGenerated));
      setPortalReady(Boolean(window.localStorage.getItem(`healDentalPatientPortal:${portalToken}`)));
    } catch {
      setNotice("Saved visit draft could not be restored. You can continue with a fresh visit.");
    }
  }, [activeVisitId, portalToken, settings, visitDraftKey, visitHistory]);

  function resetVisitState() {
    setTreatmentSections([createTreatmentSection()]);
    setProcedureCompleted(false);
    setTreatmentAmounts({});
    setInstructions("");
    setNextDate("");
    setNextTime("");
    setNextPurpose("");
    setMedicines([{ id: 1, name: "", dosage: "", frequency: "", duration: "" }]);
    setInvoiceItems(defaultInvoiceRows(settings));
    setPaymentStatus("Paid");
    setInvestigations([{ id: 1, name: "", area: "", reason: "" }]);
    setUploadedFiles([]);
    setSummaryGenerated(false);
    setConsentGenerated(false);
    setGeneratedDocument(null);
    setPortalReady(false);
    setNotice("");
  }

  const invoiceRows = useMemo(() => {
    const treatmentRows: InvoiceRow[] = treatmentSections.flatMap((section, sectionIndex) => effectiveSectionTreatments(section).map((item, treatmentIndex) => ({
      id: 1000 + sectionIndex * 100 + treatmentIndex,
      service: section.tooth ? `${treatmentInvoiceNames[item] ?? item} - Tooth / area: ${section.tooth}` : treatmentInvoiceNames[item] ?? item,
      description: treatmentAmountKey(section.id, item),
      amount: treatmentAmounts[treatmentAmountKey(section.id, item)] ?? treatmentAmounts[item] ?? "",
      locked: true
    })));
    return [...invoiceItems, ...treatmentRows];
  }, [invoiceItems, treatmentAmounts, treatmentSections]);

  const total = useMemo(
    () => invoiceRows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [invoiceRows]
  );

  const hasVisitDetails = Boolean(
    clinicalFindings ||
    diagnosis ||
    treatments.length ||
    clinicalNotesText ||
    medicines.some((item) => item.name) ||
    investigations.some((item) => item.name)
  );
  const activeHistoryItem = visitHistory.find((visit) => visit.id === activeVisitId);
  const activeHistoryHasClinicalDraft = draftHasClinicalDetails(activeHistoryItem?.draft);
  const activeHistoryIsPartial = Boolean(activeHistoryItem && !hasVisitDetails && !activeHistoryHasClinicalDraft);

  const availableDocuments = [
    { label: "Visit Summary", Icon: FileText, kind: "summary" },
    { label: "Prescription", Icon: Pill, kind: "prescription" },
    { label: "Invoice", Icon: ReceiptText, kind: "invoice" },
    ...(consentGenerated ? [
      { label: "Consent Form", Icon: ShieldCheck, kind: "consent" },
      { label: "Care Instructions", Icon: FileCheck2, kind: "instructions" }
    ] : [])
  ];

  function generatePatientSummary() {
    if (!hasVisitDetails) {
      setNotice("Add at least one clinical detail before generating the patient summary.");
      return;
    }
    setSummaryGenerated(true);
    saveVisitDraft({ summaryGeneratedOverride: true });
    publishPatientPortal({ summaryGeneratedOverride: true });
    setNotice("Patient summary is ready. Patient portal QR and link are available on this page.");
  }

  function currentVisitPdfData() {
    return {
      patientName: selectedPatient.name,
      patientId: selectedPatient.id,
      patientPhone: selectedPatient.phone,
      ageGender: selectedPatient.ageGender,
      chiefComplaint: selectedPatient.chiefComplaint,
      clinicalFindings,
      diagnosis,
      tooth,
      treatments: treatmentLines.length ? treatmentLines : treatments,
      clinicalNotes: clinicalNotesText,
      medicines: medicines.filter((medicine) => medicine.name),
      investigations: investigations.filter((item) => item.name),
      instructions,
      nextVisit: [nextDate, nextTime, nextPurpose].filter(Boolean).join(" - "),
      invoiceItems: invoiceRows.filter((item) => item.service && Number(item.amount) > 0).map((item) => ({
        service: item.service,
        amount: item.amount
      })),
      invoiceTotal: total,
      paymentStatus,
      consentBenefits: buildConsentList(treatments, "benefits").split("\n").map((item) => item.replace(/^- /, "")),
      consentRisks: buildConsentList(treatments, "risks").split("\n").map((item) => item.replace(/^- /, "")),
      consentAlternatives: buildConsentAlternatives(treatments).split("\n"),
      consentSections: buildConsentProcedureSections(treatmentSections, {
        clinicalFindings,
        diagnosis,
        clinicalNotes: clinicalNotesText
      })
    };
  }

  function downloadDocument(kind: PdfKind) {
    if (!hasVisitDetails) {
      setNotice("Add visit details before generating documents.");
      return;
    }

    if (kind === "instructions" && !consentGenerated) {
      setNotice("Care instructions are generated only after consent form is generated for treatment.");
      return;
    }

    if (kind === "consent" && !treatments.length && !clinicalNotesText.trim()) {
      setNotice("Select the treatment or write the planned procedure before generating the consent form.");
      return;
    }

    if (kind === "consent") {
      generateConsentForm();
    } else {
      saveVisitDraft();
    }

    const visitData = currentVisitPdfData();
    publishPatientPortal({ documentKind: kind, visitData });
    const pdfUrl = downloadVisitPdf(kind, visitData);
    const nextDocument = {
      title: documentTitles[kind],
      url: pdfUrl,
      kind,
      returnUrl: visitUrl(activeVisitId),
      data: visitData,
      sections: documentPreviewSections(kind, visitData)
    };
    window.localStorage.setItem("healDentalGeneratedDocument", JSON.stringify(nextDocument));
    setGeneratedDocument(nextDocument);
    setNotice(`${documentTitles[kind]} generated from the current visit data.`);
    window.location.href = "/clinic/document";
  }

  function saveVisitDraft(options?: {
    summaryGeneratedOverride?: boolean;
    consentGeneratedOverride?: boolean;
    procedureCompletedOverride?: boolean;
    instructionsOverride?: string;
  }) {
    const savedAt = new Date().toISOString();
    const draft: VisitDraft = {
      clinicalFindings,
      diagnosis,
      tooth,
      treatments,
      treatmentSections,
      procedureCompleted: options?.procedureCompletedOverride ?? procedureCompleted,
      treatmentAmounts,
      clinicalNotes: clinicalNotesText,
      instructions: options?.instructionsOverride ?? instructions,
      nextDate,
      nextTime,
      nextPurpose,
      medicines,
      invoiceItems,
      paymentStatus,
      investigations,
      uploadedFiles,
      summaryGenerated: options?.summaryGeneratedOverride ?? summaryGenerated,
      consentGenerated: options?.consentGeneratedOverride ?? consentGenerated,
      savedAt
    };

    window.localStorage.setItem(visitDraftKey, JSON.stringify(draft));
    window.localStorage.setItem("healDentalLatestVisitDraft", JSON.stringify({ patientId: selectedPatient.id, ...draft }));
    window.localStorage.setItem(`healDentalActiveVisit:${selectedPatient.id}`, activeVisitId);
    upsertVisitHistory(savedAt, draft);
    return savedAt;
  }

  function upsertVisitHistory(savedAt: string, draft: VisitDraft) {
    const historyItem: VisitHistoryItem = {
      id: activeVisitId,
      label: activeVisitId === "current" ? "Saved Visit" : `Visit ${activeVisitId}`,
      savedAt,
      summary: draft.treatments.length ? draft.treatments.join(", ") : draft.diagnosis || draft.clinicalFindings || "Visit details saved",
      total,
      documentCount: [
        draft.summaryGenerated,
        draft.medicines.some((medicine) => medicine.name) || Boolean(draft.diagnosis),
        invoiceRows.some((item) => Number(item.amount) > 0),
        draft.consentGenerated,
        draft.consentGenerated && Boolean(draft.instructions)
      ].filter(Boolean).length,
      draft
    };
    const nextHistory = [historyItem, ...visitHistory.filter((item) => item.id !== activeVisitId)];
    setVisitHistory(nextHistory);
    window.localStorage.setItem(visitHistoryKey, JSON.stringify(nextHistory));
  }

  function patientPortalToken() {
    return portalToken;
  }

  function patientPortalPath() {
    return `/p/${patientPortalToken()}`;
  }

  function patientPortalUrl() {
    if (typeof window === "undefined") return patientPortalPath();
    return `${window.location.origin}${patientPortalPath()}`;
  }

  function patientPortalQrUrl() {
    return `/api/qr?text=${encodeURIComponent(patientPortalUrl())}`;
  }

  function publishPatientPortal(options?: {
    documentKind?: PdfKind;
    summaryGeneratedOverride?: boolean;
    visitData?: DynamicVisitPdfData;
  }) {
    if (!hasVisitDetails) return "";

    const token = patientPortalToken();
    const generatedAt = new Date().toISOString();
    const visitData = options?.visitData ?? currentVisitPdfData();
    const documentKinds: PdfKind[] = [
      "summary",
      "prescription",
      ...(visitData.invoiceItems.length ? ["invoice" as PdfKind] : []),
      ...(consentGenerated || options?.documentKind === "consent" ? ["consent" as PdfKind] : []),
      ...(consentGenerated || options?.documentKind === "instructions" ? ["instructions" as PdfKind] : [])
    ];
    const uniqueDocumentKinds = Array.from(new Set(documentKinds));

    const portalRecord = {
      token,
      patientId: selectedPatient.id,
      visitId: activeVisitId,
      patientName: selectedPatient.name,
      patientPhone: selectedPatient.phone,
      ageGender: selectedPatient.ageGender,
      generatedAt,
      clinicPhone: settings.phone,
      clinicEmail: settings.email,
      clinicWebsite: settings.website,
      clinicName: settings.clinicName,
      clinicDisplayName: settings.clinicDisplayName,
      clinicAddress: settings.address,
      clinicMapsUrl: settings.mapsUrl,
      googleReviewUrl: settings.googleReviewUrl,
      documentKinds: uniqueDocumentKinds,
      summaryGenerated: options?.summaryGeneratedOverride ?? summaryGenerated,
      consentGenerated: consentGenerated || options?.documentKind === "consent",
      data: visitData
    };

    window.localStorage.setItem(`healDentalPatientPortal:${token}`, JSON.stringify(portalRecord));
    window.localStorage.setItem(`healDentalLatestPatientPortal:${selectedPatient.id}`, token);
    window.localStorage.setItem(`healDentalPatientPortalForVisit:${selectedPatient.id}:${activeVisitId}`, token);
    setPortalReady(true);
    return patientPortalPath();
  }

  async function copyPatientPortalLink() {
    publishPatientPortal();
    try {
      await navigator.clipboard.writeText(patientPortalUrl());
      setCopiedPortal(true);
      setNotice("Patient portal link copied.");
    } catch {
      setNotice(patientPortalUrl());
    }
  }

  function openPatientPortal() {
    const portalPath = publishPatientPortal({ summaryGeneratedOverride: true });
    if (!portalPath) {
      setNotice("Add visit details before opening the patient portal.");
      return;
    }
    window.location.assign(portalPath);
  }

  function whatsAppNumber() {
    return normalizePhoneForWhatsApp(selectedPatient.phone);
  }

  function whatsAppPatient() {
    if (!hasVisitDetails) {
      setNotice("Add visit details and generate the patient report before sharing on WhatsApp.");
      return;
    }

    const number = whatsAppNumber();
    if (!number) {
      setNotice("Add a valid patient phone number before opening WhatsApp.");
      return;
    }

    publishPatientPortal({ summaryGeneratedOverride: true });
    const message = [
      `Hello ${selectedPatient.name.split(" ")[0] || "there"},`,
      "",
      `Thank you for visiting ${settings.clinicName}.`,
      "Your visit report and documents are ready here:",
      patientPortalUrl(),
      "",
      "You can open this link anytime to view or download your prescription, invoice, and visit summary.",
      "",
      "Did we make your smile feel cared for? Your feedback helps us continually improve our care.",
      `Leave a Google Review: ${settings.googleReviewUrl}`,
      "",
      settings.clinicName
    ].join("\n");
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.assign(url);
  }

  function startNewVisit() {
    if (hasVisitDetails) {
      saveVisitDraft();
    }
    const nextVisitId = createVisitId();
    setActiveVisitId(nextVisitId);
    window.localStorage.setItem(`healDentalActiveVisit:${selectedPatient.id}`, nextVisitId);
    window.history.pushState(null, "", `/clinic/profile?patient=${selectedPatient.id}&visit=${nextVisitId}`);
    resetVisitState();
    setNotice("New clean visit started for this patient. Previous visit details remain in Visit History.");
  }

  function generateConsentForm() {
    if (!treatments.length && !clinicalNotesText.trim()) {
      setNotice("Select the treatment or write the planned procedure before generating the consent form.");
      return;
    }
    const treatmentDetails = treatmentLines.length ? treatmentLines.join(", ") : clinicalNotesText || "Planned dental procedure";
    const procedureSections = buildConsentProcedureSections(treatmentSections, {
      clinicalFindings,
      diagnosis,
      clinicalNotes: clinicalNotesText
    });
    const combinedInstructions = treatments
      .map((item) => instructionTemplates[item])
      .filter(Boolean)
      .join("\n\n---\n\n");
    window.localStorage.setItem(
      "healDentalConsentDraft",
      JSON.stringify({
        patientName: selectedPatient.name,
        patientId: selectedPatient.id,
        patientPhone: selectedPatient.phone,
        title: `${treatments.length ? treatments.join(" + ") : "Dental Procedure"} Consent`,
        procedureSections,
        treatmentDetails: [
          treatmentLines.length ? `Procedure: ${treatmentLines.join(", ")}` : `Procedure: ${clinicalNotesText || "Planned dental procedure"}`,
          diagnosis ? `Diagnosis: ${diagnosis}` : "",
          clinicalFindings ? `Clinical findings: ${clinicalFindings}` : ""
        ].filter(Boolean),
        benefits: buildConsentList(treatments, "benefits").split("\n").map((item) => item.replace(/^- /, "")),
        risks: buildConsentList(treatments, "risks").split("\n").map((item) => item.replace(/^- /, "")),
        alternatives: buildConsentAlternatives(treatments).split("\n"),
        declaration: "I have read and understood the information about my treatment, including the possible benefits, risks, discomforts, alternatives, and the possibility that additional treatment may be required. I have had the opportunity to ask questions and I agree to proceed.",
        returnUrl: visitUrl(activeVisitId)
      })
    );
    setConsentGenerated(true);
    setProcedureCompleted(true);
    setInstructions(combinedInstructions || "Post-procedure care instructions can be added here.");
    saveVisitDraft({
      consentGeneratedOverride: true,
      procedureCompletedOverride: true,
      instructionsOverride: combinedInstructions || "Post-procedure care instructions can be added here."
    });
    setNotice(`Consent form generated for ${treatmentDetails}. It is ready for patient acceptance.`);
    window.location.href = "/consent";
  }

  function visitUrl(visitId: string) {
    return `/clinic/profile?patient=${selectedPatient.id}&visit=${visitId}`;
  }

  function handleVisitLinkClick(visitId: string) {
    if (visitId === activeVisitId) return;
    if (hasVisitDetails) {
      saveVisitDraft();
    }
  }

  function updateTreatmentSection(id: number, patch: Partial<TreatmentSection>) {
    setTreatmentSections((sections) => sections.map((section) => (section.id === id ? { ...section, ...patch } : section)));
  }

  function selectTreatment(sectionId: number, option: string) {
    setTreatmentSections((sections) => {
      const nextSections = sections.map((section) => {
        if (section.id !== sectionId) return section;
        const nextTreatments = section.treatments.includes(option)
          ? section.treatments.filter((item) => item !== option)
          : [...section.treatments, option];
        return {
          ...section,
          treatments: nextTreatments,
          customTreatment: option === "Other" && section.treatments.includes(option) ? "" : section.customTreatment
        };
      });
      if (consentGenerated) {
        const nextTreatments = Array.from(new Set(nextSections.flatMap((section) => effectiveSectionTreatments(section))));
        setInstructions(nextTreatments.map((item) => instructionTemplates[item]).filter(Boolean).join("\n\n---\n\n"));
      } else {
        setInstructions("");
      }
      return nextSections;
    });
  }

  function addTreatmentSection() {
    setTreatmentSections((sections) => [...sections, createTreatmentSection()]);
  }

  function removeTreatmentSection(id: number) {
    setTreatmentSections((sections) => (sections.length === 1 ? sections : sections.filter((section) => section.id !== id)));
  }

  function updateMedicine(id: number, key: keyof Omit<MedicineRow, "id">, value: string) {
    setMedicines((rows) => rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function applyMedicinePreset(id: number, value: string) {
    const preset = medicinePresets.find((item) => item.name.toLowerCase() === value.toLowerCase());
    setMedicines((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...(preset ?? { name: value }) } : row))
    );
  }

  function chooseMedicinePreset(id: number, name: string) {
    applyMedicinePreset(id, name);
    setOpenMedicinePickerId(null);
  }

  function addUploadedFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadedFiles((current) => [...current, ...Array.from(files).map((file) => file.name)]);
  }

  function updateInvoice(id: number, key: keyof Omit<InvoiceRow, "id">, value: string) {
    setInvoiceItems((rows) => rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function updateTreatmentAmount(amountKey: string, value: string) {
    setTreatmentAmounts((current) => ({ ...current, [amountKey]: value }));
  }

  function updateInvestigation(id: number, key: keyof Omit<InvestigationRow, "id">, value: string) {
    setInvestigations((rows) => rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  return (
    <ClinicShell active="Patients">
      <div className="p-4 sm:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <a href="/clinic/dashboard" className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ArrowLeft className="h-4 w-4" />
            Back to Queue
          </a>
          <div className="flex flex-wrap gap-3">
            <Button variant="light" onClick={startNewVisit}>
              <Plus className="h-4 w-4" />
              Start New Visit
            </Button>
            <Button
              variant="light"
              onClick={() => {
                saveVisitDraft();
                setNotice("Visit draft saved for this patient. You can refresh and continue from here.");
              }}
            >
              <Save className="h-4 w-4" />
              Save Visit
            </Button>
            <Button variant="light" onClick={generateConsentForm}>
              <ShieldCheck className="h-4 w-4" />
              Generate Consent Form
            </Button>
            <Button variant="light" onClick={whatsAppPatient}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp Patient
            </Button>
            <Button variant="gold" onClick={generatePatientSummary}>
              <Send className="h-4 w-4" />
              Generate Patient Summary
            </Button>
          </div>
        </header>

        {notice && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {notice}
          </div>
        )}

        <Card className="mt-6 p-5 sm:p-6">
          <div className="grid gap-5 xl:grid-cols-[1fr_360px] xl:items-center">
            <div className="flex flex-wrap items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-linen text-2xl font-bold text-gold">
                {selectedPatient.initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{selectedPatient.name}</h1>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-muted">{selectedPatient.id}</span>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">{selectedPatient.ageGender}</span>
                </div>
                <p className="mt-3 text-sm text-muted">{selectedPatient.phone} - {selectedPatient.email}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-2xl border border-softgold/60 bg-white/70 px-3 py-2">Checked in: {selectedPatient.checkedInAt}</span>
                  <span className="rounded-2xl border border-softgold/60 bg-white/70 px-3 py-2">{selectedPatient.source}</span>
                  <span className="rounded-2xl border border-gold/40 bg-linen px-3 py-2 font-semibold text-gold">{activeVisitLabel}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-softgold/60 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">From Registration</p>
              <p className="mt-3 font-bold">Chief Complaint</p>
              <p className="mt-1 text-sm leading-6 text-muted">{selectedPatient.chiefComplaint}</p>
              <p className="mt-3 font-bold">Medical History</p>
              <p className="mt-1 text-sm leading-6 text-muted">{selectedPatient.medicalHistory}</p>
            </div>
          </div>
        </Card>

        <Card className="mt-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Patient Visit History</h2>
              <p className="mt-1 text-sm text-muted">Saved visits, documents, and charges for this patient.</p>
            </div>
            <Button variant="light" onClick={startNewVisit}>
              <Plus className="h-4 w-4" />
              Start New Visit
            </Button>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {visitHistory.length ? visitHistory.map((visit) => (
              <a
                key={`top-${visit.id}`}
                href={visitUrl(visit.id)}
                onClick={() => handleVisitLinkClick(visit.id)}
                className={`min-h-32 rounded-2xl border p-4 text-left transition ${
                  visit.id === activeVisitId ? "border-gold bg-linen shadow-soft" : "border-softgold/60 bg-white/70 hover:border-gold"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{visitDisplayLabel(visit)}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{formatVisitDate(visit.savedAt)}</p>
                  </div>
                  {visit.id === activeVisitId ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gold">Open</span>
                  ) : null}
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{visit.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted">
                  <span>{visit.documentCount} docs</span>
                  <span>Rs. {visit.total.toLocaleString("en-IN")}</span>
                  <span>{visit.id === "current" ? "Legacy record" : visit.id}</span>
                </div>
              </a>
            )) : (
              <div className="rounded-2xl border border-softgold/60 bg-white/70 p-4 lg:col-span-3">
                <p className="text-sm leading-6 text-muted">
                  No previous saved visits yet. Save this visit once and it will appear here.
                </p>
              </div>
            )}
          </div>
        </Card>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_480px]">
          <section className="space-y-5">
            {activeHistoryIsPartial && activeHistoryItem && (
              <Card className="border-amber-200 bg-amber-50/70 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Saved Visit Record</p>
                    <h2 className="mt-2 text-xl font-bold">{visitDisplayLabel(activeHistoryItem)}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      This history entry has saved billing/document information, but no clinical form details were saved for this visit.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gold">
                    {formatVisitDate(activeHistoryItem.savedAt)}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-softgold/60 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Summary</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{activeHistoryItem.summary}</p>
                  </div>
                  <div className="rounded-2xl border border-softgold/60 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Amount</p>
                    <p className="mt-2 text-lg font-bold text-gold">Rs. {activeHistoryItem.total.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-2xl border border-softgold/60 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Documents</p>
                    <p className="mt-2 text-lg font-bold text-ink">{activeHistoryItem.documentCount}</p>
                  </div>
                </div>
              </Card>
            )}
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <IconCircle icon={ClipboardCheck} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold">Today&apos;s Visit Entry</h2>
                  <p className="text-sm text-muted">Add one block per problem or treatment area in this appointment.</p>
                </div>
                <Button variant="light" onClick={addTreatmentSection}>
                  <Plus className="h-4 w-4" />
                  Add Treatment
                </Button>
              </div>

              <div className="mt-5 space-y-5">
                {treatmentSections.map((section, index) => (
                  <div key={section.id} className="rounded-3xl border border-softgold/60 bg-white/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Treatment Section {index + 1}</p>
                        <p className="mt-1 text-sm text-muted">Use this for one tooth, area, or problem.</p>
                      </div>
                      {treatmentSections.length > 1 && (
                        <button
                          onClick={() => removeTreatmentSection(section.id)}
                          className="grid h-10 w-10 place-items-center rounded-2xl border border-softgold/60 bg-white text-muted hover:border-gold hover:text-gold"
                          aria-label="Remove treatment section"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <Field label="Clinical Findings">
                      <textarea
                        value={section.clinicalFindings}
                        onChange={(event) => updateTreatmentSection(section.id, { clinicalFindings: event.target.value })}
                        className={`${textareaClass} mt-4`}
                        placeholder="E.g. calculus deposits, bleeding on probing, swelling, mobility, X-ray findings."
                      />
                    </Field>

                    <div className="mt-5 grid gap-4 md:grid-cols-[1fr_180px]">
                      <Field label="Diagnosis">
                        <input
                          value={section.diagnosis}
                          onChange={(event) => updateTreatmentSection(section.id, { diagnosis: event.target.value })}
                          className={inputClass}
                          placeholder="E.g. dental caries, pulpitis, impacted wisdom tooth"
                        />
                      </Field>
                      <Field label="Tooth Number / Area">
                        <input
                          value={section.tooth}
                          onChange={(event) => updateTreatmentSection(section.id, { tooth: event.target.value })}
                          className={inputClass}
                          placeholder="E.g. 46, 38, upper left"
                        />
                      </Field>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-xs font-semibold text-muted">Treatment Advised</p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {treatmentOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => selectTreatment(section.id, option)}
                            className={`min-h-11 rounded-2xl border px-3 text-sm font-semibold transition ${
                              section.treatments.includes(option) ? "border-gold bg-linen text-gold" : "border-softgold/70 bg-white/70 text-ink hover:border-gold"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3">
                        <input
                          className={inputClass}
                          value={section.customTreatment}
                          onChange={(event) => updateTreatmentSection(section.id, { customTreatment: event.target.value })}
                          placeholder="Other treatment name, e.g. biopsy, splinting, night guard"
                        />
                      </div>
                    </div>

                    <Field label="Clinical Notes">
                      <textarea
                        value={section.clinicalNotes}
                        onChange={(event) => updateTreatmentSection(section.id, { clinicalNotes: event.target.value })}
                        className={textareaClass}
                        placeholder="Write the note you would normally add on the prescription for this treatment."
                      />
                    </Field>
                  </div>
                ))}
                <button
                  onClick={addTreatmentSection}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gold bg-linen/40 text-sm font-semibold text-gold hover:bg-linen"
                >
                  <Plus className="h-4 w-4" />
                  Add another diagnosis / treatment
                </button>
                </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconCircle icon={Pill} tone="purple" />
                  <h2 className="text-xl font-bold">Medicines</h2>
                </div>
                <Button
                  variant="light"
                  onClick={() => setMedicines((rows) => [...rows, { id: Date.now(), name: "", dosage: "", frequency: "", duration: "" }])}
                >
                  <Plus className="h-4 w-4" />
                  Add Medicine
                </Button>
              </div>
              <div className="mt-5 space-y-3">
                {medicines.map((medicine) => {
                  const filteredPresets = medicinePresets.filter((preset) =>
                    preset.name.toLowerCase().includes(medicine.name.trim().toLowerCase())
                  );

                  return (
                    <div key={medicine.id} className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.9fr_0.7fr_auto]">
                      <div className="relative">
                        <input
                          className={inputClass}
                          value={medicine.name}
                          onChange={(event) => {
                            applyMedicinePreset(medicine.id, event.target.value);
                            setOpenMedicinePickerId(medicine.id);
                          }}
                          onFocus={() => setOpenMedicinePickerId(medicine.id)}
                          onClick={() => setOpenMedicinePickerId(medicine.id)}
                          onPointerDown={() => setOpenMedicinePickerId(medicine.id)}
                          onBlur={() => window.setTimeout(() => setOpenMedicinePickerId(null), 120)}
                          placeholder="Type or select medicine"
                          autoComplete="off"
                        />
                        {openMedicinePickerId === medicine.id && (
                          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-softgold/70 bg-white shadow-soft">
                            <div className="max-h-64 overflow-y-auto overscroll-contain p-2">
                              {(filteredPresets.length ? filteredPresets : medicinePresets).map((preset) => (
                                <button
                                  key={preset.name}
                                  type="button"
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    chooseMedicinePreset(medicine.id, preset.name);
                                  }}
                                  className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-linen"
                                >
                                  <span className="text-sm font-semibold text-ink">{preset.name}</span>
                                  <span className="text-xs leading-5 text-muted">
                                    {[preset.dosage, preset.frequency, preset.duration].join(" - ")}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <input className={inputClass} value={medicine.dosage} onChange={(event) => updateMedicine(medicine.id, "dosage", event.target.value)} placeholder="Dosage" />
                      <input className={inputClass} value={medicine.frequency} onChange={(event) => updateMedicine(medicine.id, "frequency", event.target.value)} placeholder="Frequency" />
                      <input className={inputClass} value={medicine.duration} onChange={(event) => updateMedicine(medicine.id, "duration", event.target.value)} placeholder="Duration" />
                      <button
                        onClick={() => setMedicines((rows) => rows.length === 1 ? rows : rows.filter((row) => row.id !== medicine.id))}
                        className="grid h-12 w-12 place-items-center rounded-2xl border border-softgold/60 bg-white/70 text-muted hover:border-gold hover:text-gold"
                        aria-label="Remove medicine"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconCircle icon={Search} tone="blue" />
                  <div>
                    <h2 className="text-xl font-bold">Investigations Advised</h2>
                    <p className="text-sm text-muted">Use this for OPG, CBCT, RVG, lateral cephalogram, or lab advice.</p>
                  </div>
                </div>
                <Button
                  variant="light"
                  onClick={() => setInvestigations((rows) => [...rows, { id: Date.now(), name: "", area: "", reason: "" }])}
                >
                  <Plus className="h-4 w-4" />
                  Add Investigation
                </Button>
              </div>
              <div className="mt-5 space-y-3">
                {investigations.map((item) => (
                  <div key={item.id} className="grid gap-3 lg:grid-cols-[1fr_0.8fr_1.1fr_auto]">
                    <div className="space-y-2">
                      <select
                        className={`${inputClass} appearance-none`}
                        value={investigationPresets.includes(item.name) ? item.name : item.name ? "custom" : ""}
                        onChange={(event) => updateInvestigation(item.id, "name", event.target.value === "custom" ? "" : event.target.value)}
                        aria-label="Select investigation"
                      >
                        <option value="">Select investigation</option>
                        {investigationPresets.map((preset) => <option key={preset} value={preset}>{preset}</option>)}
                        <option value="custom">Other / type manually</option>
                      </select>
                      {item.name && !investigationPresets.includes(item.name) ? (
                        <input
                          className={inputClass}
                          value={item.name}
                          onChange={(event) => updateInvestigation(item.id, "name", event.target.value)}
                          placeholder="Write investigation name"
                        />
                      ) : null}
                      {!item.name ? (
                        <input
                          className={inputClass}
                          value={item.name}
                          onChange={(event) => updateInvestigation(item.id, "name", event.target.value)}
                          placeholder="Or type investigation name"
                        />
                      ) : null}
                    </div>
                    <input className={inputClass} value={item.area} onChange={(event) => updateInvestigation(item.id, "area", event.target.value)} placeholder="Area / tooth" />
                    <input className={inputClass} value={item.reason} onChange={(event) => updateInvestigation(item.id, "reason", event.target.value)} placeholder="Reason" />
                    <button
                      onClick={() => setInvestigations((rows) => rows.length === 1 ? rows : rows.filter((row) => row.id !== item.id))}
                      className="grid h-12 w-12 place-items-center rounded-2xl border border-softgold/60 bg-white/70 text-muted hover:border-gold hover:text-gold"
                      aria-label="Remove investigation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <IconCircle icon={FileCheck2} tone="green" />
                  <div>
                    <h2 className="text-xl font-bold">Post-procedure Care Instructions</h2>
                    <p className="text-sm text-muted">Available only after consent is generated for today&apos;s treatment.</p>
                  </div>
                </div>
                {consentGenerated ? (
                  <textarea
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    className={`${textareaClass} mt-5 min-h-72`}
                    placeholder="Post-procedure instructions for the patient."
                  />
                ) : (
                  <div className="mt-5 rounded-2xl border border-softgold/60 bg-white/70 p-4">
                    <p className="text-sm leading-6 text-muted">
                      No care instructions are generated for consultation or treatment recommendation only.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Click Generate Consent Form when treatment is being done today. That will prepare consent and unlock care instructions.
                    </p>
                  </div>
                )}
              </Card>
              <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <IconCircle icon={CalendarDays} tone="blue" />
                  <h2 className="text-xl font-bold">Next Visit</h2>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <input
                    type="date"
                    className={inputClass}
                    value={nextDate}
                    onChange={(event) => setNextDate(event.target.value)}
                    aria-label="Next visit date"
                  />
                  <select
                    className={`${inputClass} appearance-none`}
                    value={nextTime}
                    onChange={(event) => setNextTime(event.target.value)}
                    aria-label="Next visit time"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <input
                  className={`${inputClass} mt-3`}
                  value={nextPurpose}
                  onChange={(event) => setNextPurpose(event.target.value)}
                  placeholder="Purpose"
                />
              </Card>
            </div>

            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconCircle icon={IndianRupee} />
                  <h2 className="text-xl font-bold">Invoice Items</h2>
                </div>
                <Button
                  variant="light"
                  onClick={() => setInvoiceItems((rows) => [...rows, { id: Date.now(), service: "", description: "", amount: "" }])}
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
              <div className="mt-5 space-y-3">
                {invoiceRows.map((item) => {
                  const treatmentSection = item.id >= 1000
                    ? treatmentSections[Math.floor((item.id - 1000) / 100)]
                    : undefined;
                  const treatmentName = treatmentSection ? effectiveSectionTreatments(treatmentSection)[(item.id - 1000) % 100] ?? "" : "";
                  return (
                  <div key={item.id} className="grid gap-3 lg:grid-cols-[1fr_160px_auto]">
                    <input
                      className={inputClass}
                      value={item.service}
                      onChange={(event) => updateInvoice(item.id, "service", event.target.value)}
                      placeholder="Service"
                      readOnly={item.locked && item.id !== 1}
                    />
                    <input
                      className={inputClass}
                      value={item.amount}
                      onChange={(event) => {
                        if (item.id >= 1000 && item.description) updateTreatmentAmount(item.description, event.target.value);
                        else updateInvoice(item.id, "amount", event.target.value);
                      }}
                      placeholder="Amount"
                    />
                    <button
                      onClick={() => {
                        if (item.id >= 1000 && treatmentSection && treatmentName) {
                          selectTreatment(treatmentSection.id, treatmentSection.treatments.includes(treatmentName) ? treatmentName : "Other");
                        }
                        else setInvoiceItems((rows) => rows.length === 1 ? rows : rows.filter((row) => row.id !== item.id));
                      }}
                      className="grid h-12 w-12 place-items-center rounded-2xl border border-softgold/60 bg-white/70 text-muted hover:border-gold hover:text-gold"
                      aria-label="Remove invoice item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );})}
              </div>
              <div className="mt-5 flex justify-end text-xl font-bold">
                Total <span className="ml-3 text-gold">Rs. {total.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                <label className="text-sm font-semibold text-muted" htmlFor="payment-status">Payment Status</label>
                <select
                  id="payment-status"
                  className="min-h-11 rounded-2xl border border-softgold/70 bg-white px-4 text-sm font-semibold text-ink outline-none focus:border-gold"
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value)}
                >
                  <option>Paid</option>
                  <option>Partial</option>
                  <option>Unpaid</option>
                </select>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconCircle icon={FolderOpen} tone="blue" />
                  <div>
                    <h2 className="text-xl font-bold">Uploads</h2>
                    <p className="text-sm text-muted">X-rays, photos, and reports can be attached when available.</p>
                  </div>
                </div>
                <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-gold bg-linen/60 px-5 text-sm font-semibold text-gold hover:bg-linen">
                  <Upload className="h-4 w-4" />
                  Upload Files
                  <input
                    type="file"
                    className="sr-only"
                    multiple
                    accept=".jpg,.jpeg,image/jpeg,image/png,application/pdf"
                    onChange={(event) => addUploadedFiles(event.target.files)}
                  />
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {uploadedFiles.map((fileName, index) => (
                    <div key={`${fileName}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-softgold/60 bg-white/70 px-4 py-3 text-sm">
                      <span className="truncate font-semibold text-ink">{fileName}</span>
                      <span className="shrink-0 text-xs text-muted">Attached</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <Card className="overflow-hidden">
              <div className="border-b border-softgold/50 p-5">
                <div className="flex items-center gap-3">
                  <IconCircle icon={Sparkles} />
                  <div>
                    <h2 className="text-xl font-bold">Patient Report Preview</h2>
                    <p className="text-sm text-muted">This updates from the fields you enter.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-5 p-5">
                <PreviewBlock icon={UserRound} title={`Hello, ${selectedPatient.name.split(" ")[0]}`} value="Your visit summary will appear here after the clinic completes your report." />
                <div className="rounded-2xl border border-softgold/60 bg-white/70 p-4">
                  <div className="flex items-center gap-3">
                    <IconCircle icon={ClipboardCheck} />
                    <p className="font-bold">Diagnosis & Treatment Sections</p>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    {clinicalSectionLines.length ? clinicalSectionLines.map((line, index) => (
                      <div key={`section-preview-${index}`} className="rounded-2xl bg-linen/50 p-3">
                        <p className="whitespace-pre-line leading-6 text-muted">{line}</p>
                      </div>
                    )) : <p className="text-muted">No diagnosis or treatment section added yet.</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-softgold/60 bg-white/70 p-4">
                  <div className="flex items-center gap-3">
                    <IconCircle icon={Search} tone="blue" />
                    <p className="font-bold">Investigations</p>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    {investigations.filter((item) => item.name).length ? investigations.filter((item) => item.name).map((item) => (
                      <p key={item.id}>
                        <span className="font-semibold">{item.name}</span>
                        <br />
                        <span className="text-muted">{[item.area, item.reason].filter(Boolean).join(" - ") || "Details pending"}</span>
                      </p>
                    )) : <p className="text-muted">No investigations advised yet.</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-softgold/60 bg-white/70 p-4">
                  <div className="flex items-center gap-3">
                    <IconCircle icon={Pill} tone="purple" />
                    <p className="font-bold">Medicines</p>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    {medicines.filter((medicine) => medicine.name).length ? medicines.filter((medicine) => medicine.name).map((medicine) => (
                      <p key={medicine.id}>
                        <span className="font-semibold">{medicine.name}</span>
                        <br />
                        <span className="text-muted">{[medicine.dosage, medicine.frequency, medicine.duration].filter(Boolean).join(" - ") || "Details pending"}</span>
                      </p>
                    )) : <p className="text-muted">No medicines added yet.</p>}
                  </div>
                </div>
                <PreviewBlock icon={FileCheck2} title="Care Instructions" value={procedureCompleted && instructions ? "Detailed post-procedure care instructions added. Patient can download the full instruction PDF." : "Not generated yet because procedure is not marked completed."} />
                <PreviewBlock icon={CalendarDays} title="Next Visit" value={nextDate || nextTime || nextPurpose ? [nextDate, nextTime, nextPurpose].filter(Boolean).join(" - ") : "Next visit not added yet."} />
                <PreviewBlock icon={ReceiptText} title="Charges" value={invoiceRows.some((item) => item.service || item.amount) ? `Total amount: Rs. ${total.toLocaleString("en-IN")}` : "Invoice items not added yet."} />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Visit History</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">Each saved appointment stays under this same patient profile.</p>
                </div>
                <Button variant="light" onClick={startNewVisit}>
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </div>
              <div className="mt-5 space-y-3">
                {visitHistory.length ? visitHistory.map((visit) => (
                  <a
                    key={visit.id}
                    href={visitUrl(visit.id)}
                    onClick={() => handleVisitLinkClick(visit.id)}
                    className={`block w-full rounded-2xl border p-4 text-left transition ${
                      visit.id === activeVisitId ? "border-gold bg-linen" : "border-softgold/60 bg-white/70 hover:border-gold"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-ink">{visitDisplayLabel(visit)}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{formatVisitDate(visit.savedAt)}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gold">Rs. {visit.total.toLocaleString("en-IN")}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{visit.summary}</p>
                    <p className="mt-2 text-xs font-semibold text-muted">{visit.documentCount} document{visit.documentCount === 1 ? "" : "s"} available - {visit.id === "current" ? "Legacy record" : visit.id}</p>
                  </a>
                )) : (
                  <div className="rounded-2xl border border-softgold/60 bg-white/70 p-4">
                    <p className="text-sm leading-6 text-muted">No saved previous visits yet. Save this visit once to add it here.</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-xl font-bold">Documents</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Prescription includes patient details, clinical findings, diagnosis, treatment advised, medicines, and investigations. Consent and care instructions appear only after Generate Consent Form is used.
              </p>
              <div className="mt-5 grid gap-3">
                {availableDocuments.map(({ label, Icon, kind }) => (
                  <button
                    key={label}
                    onClick={() => downloadDocument(kind as PdfKind)}
                    className="flex min-h-14 items-center justify-between rounded-2xl border border-softgold/60 bg-white/70 px-4 text-sm font-semibold hover:border-gold"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-gold" />
                      {label}
                    </span>
                    <Download className="h-4 w-4 text-muted" />
                  </button>
                ))}
              </div>
              {!hasVisitDetails && (
                <p className="mt-4 rounded-2xl bg-linen/70 p-3 text-sm leading-6 text-muted">
                  Start with diagnosis or treatment details. The final patient report will stay blank until clinical data is entered.
                </p>
              )}
            </Card>

            {(portalReady || summaryGenerated) && hasVisitDetails && (
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <IconCircle icon={QrCode} tone="green" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold">Patient Portal</p>
                    <h2 className="mt-1 text-xl font-bold">Report QR is ready</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Ask the patient to scan this QR before leaving. If their checked-in page is still open, refreshing it will also open this report.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
                  <div className="grid min-h-40 place-items-center rounded-3xl border border-softgold/70 bg-white p-3">
                    <object
                      data={patientPortalQrUrl()}
                      type="image/png"
                      aria-label="Patient portal QR"
                      className="h-36 w-36 rounded-2xl"
                    >
                      <div className="grid h-36 w-36 place-items-center rounded-2xl bg-linen p-3 text-center text-xs font-semibold leading-5 text-gold">
                        Open the portal link beside this box
                      </div>
                    </object>
                  </div>
                  <div className="space-y-3">
                    <p className="break-all rounded-2xl border border-softgold/60 bg-linen/45 p-3 text-xs font-semibold leading-5 text-muted">
                      {patientPortalUrl()}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={copyPatientPortalLink}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-softgold/70 bg-white px-4 text-sm font-semibold text-ink hover:border-gold"
                      >
                        <Copy className="h-4 w-4" />
                        {copiedPortal ? "Copied" : "Copy Link"}
                      </button>
                      <button
                        type="button"
                        onClick={openPatientPortal}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-sm font-semibold text-white shadow-soft hover:bg-black"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Portal
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {generatedDocument && (
              <Card className="overflow-hidden p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <IconCircle icon={FileText} tone="green" />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold">Generated Document</p>
                      <h2 className="text-xl font-bold">{generatedDocument.title}</h2>
                    </div>
                  </div>
                  <a
                    href="/clinic/document"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-softgold/70 bg-white/70 px-5 text-sm font-semibold text-ink hover:bg-white"
                  >
                    <Download className="h-4 w-4" />
                    Open Document
                  </a>
                </div>
                <div className="mt-5 grid gap-3">
                  {generatedDocument.sections.map((section) => (
                    <div key={section.title} className="rounded-2xl border border-softgold/60 bg-white/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">{section.title}</p>
                      <div className="mt-3 space-y-2 text-sm leading-6 text-ink">
                        {section.lines.map((line, index) => (
                          <p key={`${section.title}-${index}`} className="whitespace-pre-line">{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </ClinicShell>
  );
}

function PreviewBlock({
  icon,
  title,
  value,
  meta
}: {
  icon: typeof FileText;
  title: string;
  value: string;
  meta?: string;
}) {
  return (
    <div className="rounded-2xl border border-softgold/60 bg-white/70 p-4">
      <div className="flex items-start gap-3">
        <IconCircle icon={icon} />
        <div>
          <p className="font-bold">{title}</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{value}</p>
          {meta ? <p className="mt-2 text-xs font-semibold text-gold">{meta}</p> : null}
        </div>
      </div>
    </div>
  );
}

function documentPreviewSections(kind: PdfKind, data: DynamicVisitPdfData) {
  if (kind === "summary") {
    return [
      { title: "Clinical Findings", lines: [data.clinicalFindings || "Not added"] },
      { title: "Diagnosis", lines: [data.diagnosis || "Not added", data.tooth ? `Tooth / area: ${data.tooth}` : ""] },
      { title: "Recommended Treatment", lines: data.treatments.length ? data.treatments : ["Not added"] },
      { title: "Medicines", lines: data.medicines.length ? data.medicines.map((med) => `${med.name} - ${[med.dosage, med.frequency, med.duration].filter(Boolean).join(", ")}`) : ["Not prescribed"] },
      { title: "Next Visit", lines: [data.nextVisit || "Not scheduled"] }
    ];
  }

  if (kind === "prescription") {
    return [
      { title: "Clinical Findings", lines: [data.clinicalFindings || "Not added"] },
      { title: "Diagnosis", lines: [data.diagnosis || "Not added", data.tooth ? `Tooth / area: ${data.tooth}` : ""] },
      { title: "Treatment Advised", lines: data.treatments.length ? data.treatments : ["Not added"] },
      { title: "Medicines", lines: data.medicines.length ? data.medicines.map((med) => `${med.name} - ${[med.dosage, med.frequency, med.duration].filter(Boolean).join(", ")}`) : ["Not prescribed"] },
      { title: "Investigations Advised", lines: data.investigations.length ? data.investigations.map((item) => [item.name, item.area, item.reason].filter(Boolean).join(" - ")) : ["Not advised"] }
    ];
  }

  if (kind === "instructions") {
    return [{ title: "Care Instructions", lines: [data.instructions || "Care instructions were not added for this visit."] }];
  }

  if (kind === "invoice") {
    return [{
      title: "Charges",
      lines: data.invoiceItems.length ? [
        ...data.invoiceItems.map((item) => `${item.service}: Rs. ${item.amount || "0"}`),
        `Total: Rs. ${data.invoiceTotal.toLocaleString("en-IN")}`,
        `Payment Status: ${data.paymentStatus || "Paid"}`
      ] : ["No invoice items added."]
    }];
  }

  if (data.consentSections?.length) {
    return [
      ...data.consentSections.flatMap((section) => [
        { title: section.title, lines: section.treatmentDetails },
        { title: `${section.title} - Benefits`, lines: section.benefits },
        { title: `${section.title} - Risks`, lines: section.risks },
        { title: `${section.title} - Alternatives`, lines: section.alternatives }
      ]),
      { title: "Declaration", lines: ["I have read and understood the information about my treatment, including the benefits, risks, discomforts, alternatives, and possibility that additional treatment may be required. I agree to proceed."] }
    ];
  }

  return [
    { title: "Treatment Details", lines: data.treatments.length ? data.treatments : [data.clinicalNotes || "Planned dental procedure"] },
    { title: "Benefits", lines: data.consentBenefits },
    { title: "Risks and Possible Discomfort", lines: data.consentRisks },
    { title: "Alternatives", lines: data.consentAlternatives },
    { title: "Declaration", lines: ["I have read and understood the information about my treatment, including the benefits, risks, discomforts, alternatives, and possibility that additional treatment may be required. I agree to proceed."] }
  ];
}

function buildConsentList(treatments: string[], key: "risks" | "benefits") {
  const lines = treatments.flatMap((treatment) => consentCopy[treatment]?.[key] ?? []);
  const unique = Array.from(new Set(lines));

  if (unique.length) return unique.map((item) => `- ${item}`).join("\n");

  if (key === "benefits") {
    return "- Helps treat the diagnosed dental condition.\n- Aims to relieve symptoms and improve oral health.\n- Supports better comfort, function, or aesthetics as applicable.";
  }

  return "- Mild pain, swelling, sensitivity, or discomfort may occur.\n- Healing response can vary between patients.\n- Additional treatment may be required depending on clinical findings.";
}

function buildConsentProcedureSections(
  sections: TreatmentSection[],
  fallback: { clinicalFindings: string; diagnosis: string; clinicalNotes: string }
) {
  const procedureSections = sections.flatMap((section, sectionIndex) => {
    const sectionTreatments = effectiveSectionTreatments(section);
    const treatmentsForConsent = sectionTreatments.length ? sectionTreatments : section.clinicalNotes ? ["Planned Dental Procedure"] : [];

    return treatmentsForConsent.map((treatment) => {
      const copy = consentCopy[treatment];
      return {
        title: `${treatment}${section.tooth ? ` - Tooth / area: ${section.tooth}` : ""}`,
        treatmentDetails: [
          `Procedure: ${treatment}`,
          section.tooth ? `Tooth / area: ${section.tooth}` : "",
          section.diagnosis ? `Diagnosis: ${section.diagnosis}` : "",
          section.clinicalFindings ? `Clinical findings: ${section.clinicalFindings}` : "",
          section.clinicalNotes ? `Clinical notes: ${section.clinicalNotes}` : ""
        ].filter(Boolean),
        benefits: copy?.benefits ?? defaultConsentBenefits(),
        risks: copy?.risks ?? defaultConsentRisks(),
        alternatives: [copy?.alternatives ?? defaultConsentAlternative()],
        order: sectionIndex + 1
      };
    });
  });

  if (procedureSections.length) return procedureSections;

  return [{
    title: "Planned Dental Procedure",
    treatmentDetails: [
      fallback.diagnosis ? `Diagnosis: ${fallback.diagnosis}` : "Procedure: Planned dental procedure",
      fallback.clinicalFindings ? `Clinical findings: ${fallback.clinicalFindings}` : "",
      fallback.clinicalNotes ? `Clinical notes: ${fallback.clinicalNotes}` : ""
    ].filter(Boolean),
    benefits: defaultConsentBenefits(),
    risks: defaultConsentRisks(),
    alternatives: [defaultConsentAlternative()],
    order: 1
  }];
}

function buildConsentAlternatives(treatments: string[]) {
  const alternatives = treatments.map((treatment) => consentCopy[treatment]?.alternatives).filter(Boolean);
  const unique = Array.from(new Set(alternatives));
  return unique.length ? unique.join("\n") : defaultConsentAlternative();
}
