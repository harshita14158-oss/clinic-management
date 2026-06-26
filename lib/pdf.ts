"use client";

import { jsPDF } from "jspdf";
import { invoiceItems, medicines, patient, instructions, currency } from "./data";
import { loadClinicSettings } from "./clinic-settings";

export type PdfKind = "summary" | "prescription" | "instructions" | "invoice" | "consent";

type DynamicMedicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
};

type DynamicInvestigation = {
  name: string;
  area: string;
  reason: string;
};

type DynamicInvoiceItem = {
  service: string;
  amount: string;
};

export type DynamicVisitPdfData = {
  patientName: string;
  patientId: string;
  patientPhone: string;
  ageGender: string;
  chiefComplaint?: string;
  clinicalFindings: string;
  diagnosis: string;
  tooth: string;
  treatments: string[];
  clinicalNotes: string;
  medicines: DynamicMedicine[];
  investigations: DynamicInvestigation[];
  instructions: string;
  nextVisit: string;
  invoiceItems: DynamicInvoiceItem[];
  invoiceTotal: number;
  consentBenefits: string[];
  consentRisks: string[];
  consentAlternatives: string[];
  consentSections?: Array<{
    title: string;
    treatmentDetails: string[];
    benefits: string[];
    risks: string[];
    alternatives: string[];
  }>;
};

const titles: Record<PdfKind, string> = {
  summary: "Visit Summary",
  prescription: "Prescription",
  instructions: "Care Instructions",
  invoice: "Invoice",
  consent: "Consent Form"
};

export function downloadPdf(kind: PdfKind) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const gold = "#B98543";
  const ink = "#1F2428";
  const muted = "#6E6860";
  const total = invoiceItems.reduce((sum, item) => sum + item.amount, 0);

  doc.setFillColor("#FFFCF7");
  doc.rect(0, 0, 595, 842, "F");
  doc.setDrawColor("#E8D4B6");
  doc.roundedRect(28, 28, 539, 786, 12, 12, "S");

  doc.setTextColor(gold);
  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.text("HEAL", 52, 78);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("DENTAL DIGITAL CLINIC", 52, 94);

  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(titles[kind].toUpperCase(), 52, 142);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(muted);
  doc.text(`Patient: ${patient.name}`, 52, 172);
  doc.text(`Visit: ${patient.visitDate} - ${patient.visitTime}`, 52, 190);
  doc.text(`Prepared by: ${patient.doctor}`, 52, 208);

  let y = 252;
  const section = (title: string, lines: string[]) => {
    doc.setDrawColor("#E8D4B6");
    doc.setFillColor("#FFFFFF");
    doc.roundedRect(52, y - 24, 491, 34 + lines.length * 18, 8, 8, "FD");
    doc.setTextColor(gold);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), 72, y);
    doc.setTextColor(ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    lines.forEach((line, index) => doc.text(line, 72, y + 24 + index * 18, { maxWidth: 440 }));
    y += 56 + lines.length * 18;
  };

  if (kind === "summary") {
    section("Diagnosis", [patient.diagnosis]);
    section("Recommended Treatment", [patient.treatment, patient.treatmentReason]);
    section("What To Expect", instructions);
    section("Next Visit", [`${patient.nextVisit} at ${patient.nextTime}`, patient.stage]);
  }

  if (kind === "prescription") {
    section(
      "Medicines",
      medicines.map((med) => `${med.name} - ${med.dosage}, ${med.frequency.toLowerCase()} for ${med.duration}`)
    );
    section("Instructions", instructions);
  }

  if (kind === "invoice") {
    section(
      "Charges",
      [...invoiceItems.map((item) => `${item.service}: ${currency.format(item.amount)}`), `Total: ${currency.format(total)}`]
    );
    section("Payment", ["Payment completed. This is a system-generated invoice."]);
  }

  if (kind === "consent") {
    section("Treatment", [patient.treatment, `Tooth ${patient.tooth}`, patient.treatmentReason]);
    section("Declaration", [
      `Consent ${patient.consentStatus.toLowerCase()} by ${patient.name}.`,
      "The patient confirms they have read the treatment information and voluntarily agree to proceed."
    ]);
  }

  doc.setTextColor(muted);
  doc.setFontSize(9);
  doc.text("Need help? +91 98765 43210 - hello@healdental.com", 52, 780);
  doc.save(`Heal_Dental_${titles[kind].replaceAll(" ", "_")}_${patient.firstName}.pdf`);
}

export function downloadVisitPdf(kind: PdfKind, data: DynamicVisitPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const settings = loadClinicSettings();
  const gold = "#B98543";
  const ink = "#1F2428";
  const muted = "#6E6860";
  let y = 52;

  if (kind === "prescription") {
    renderPrescriptionPdf(doc, data);
    return doc.output("datauristring");
  }

  if (kind === "invoice") {
    renderInvoicePdf(doc, data);
    return doc.output("datauristring");
  }

  const addPageIfNeeded = (height = 90) => {
    if (y + height < 790) return;
    doc.addPage();
    doc.setFillColor("#FFFCF7");
    doc.rect(0, 0, 595, 842, "F");
    y = 52;
  };

  const textLines = (value: string | string[]) => {
    const raw = Array.isArray(value) ? value : value.split("\n");
    return raw.flatMap((line) => doc.splitTextToSize(line || "Not added", 455));
  };

  const section = (title: string, value: string | string[]) => {
    const lines = textLines(value);
    const height = 46 + lines.length * 15;
    addPageIfNeeded(height + 18);
    doc.setDrawColor("#E8D4B6");
    doc.setFillColor("#FFFFFF");
    doc.roundedRect(40, y, 515, height, 10, 10, "FD");
    doc.setTextColor(gold);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), 60, y + 24);
    doc.setTextColor(ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    lines.forEach((line, index) => doc.text(line, 60, y + 46 + index * 15));
    y += height + 14;
  };

  doc.setFillColor("#FFFCF7");
  doc.rect(0, 0, 595, 842, "F");
  doc.setDrawColor("#E8D4B6");
  doc.roundedRect(28, 28, 539, 786, 12, 12, "S");
  doc.setTextColor(gold);
  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.text("HEAL", 52, 72);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("DENTAL CLINIC", 52, 88);
  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(titles[kind].toUpperCase(), 52, 126);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(muted);
  doc.text(`Patient: ${data.patientName} (${data.patientId})`, 52, 154);
  doc.text(`Phone: ${data.patientPhone}`, 52, 172);
  doc.text(`Age / Gender: ${data.ageGender}`, 52, 190);
  y = 228;

  if (kind === "summary") {
    section("Clinical Findings", data.clinicalFindings);
    section("Diagnosis", [data.diagnosis || "Not added", data.tooth ? `Tooth / area: ${data.tooth}` : ""]);
    section("Recommended Treatment", data.treatments.length ? data.treatments : "Not added");
    section("Medicines", data.medicines.length ? data.medicines.map((med) => `${med.name} - ${[med.dosage, med.frequency, med.duration].filter(Boolean).join(", ")}`) : "Not prescribed");
    section("Next Visit", data.nextVisit || "Not scheduled");
  }

  if (kind === "instructions") {
    section("Care Instructions", data.instructions || "Care instructions were not added for this visit.");
  }

  if (kind === "consent") {
    if (data.consentSections?.length) {
      data.consentSections.forEach((consentSection) => {
        section(consentSection.title, consentSection.treatmentDetails);
        section("Benefits", consentSection.benefits);
        section("Risks and Possible Discomfort", consentSection.risks);
        section("Alternatives", consentSection.alternatives);
      });
    } else {
      section("Treatment Details", data.treatments.length ? data.treatments : data.clinicalNotes || "Planned dental procedure");
      section("Benefits", data.consentBenefits);
      section("Risks and Possible Discomfort", data.consentRisks);
      section("Alternatives", data.consentAlternatives);
    }
    section("Declaration", "I have read and understood the information about my treatment, including the benefits, risks, discomforts, alternatives, and possibility that additional treatment may be required. I agree to proceed.");
  }

  doc.setTextColor(muted);
  doc.setFontSize(9);
  doc.text(`${settings.clinicName} - ${settings.phone} - ${settings.email}`, 52, 805);
  return doc.output("datauristring");
}

function renderPrescriptionPdf(doc: jsPDF, data: DynamicVisitPdfData) {
  const settings = loadClinicSettings();
  const gold = "#B98543";
  const ink = "#1F2428";
  const muted = "#6E6860";
  const line = "#E8D4B6";
  const paper = "#FFFCF7";
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const medicines = data.medicines.length ? data.medicines : [{ name: "Not prescribed", dosage: "", frequency: "", duration: "" }];
  const investigations = data.investigations.length ? data.investigations : [{ name: "Not advised", area: "", reason: "" }];
  const advice = data.instructions
    ? data.instructions.split("\n").map((item) => item.replace(/^- /, "").trim()).filter((item) => item && !item.endsWith(":") && !item.toLowerCase().includes("instructions")).slice(0, 6)
    : ["Complete medicines as prescribed", "Maintain good oral hygiene", "Contact clinic if pain or swelling increases"];

  doc.setFillColor(paper);
  doc.rect(0, 0, 595, 842, "F");
  doc.setDrawColor(line);
  doc.roundedRect(24, 24, 547, 794, 12, 12, "S");

  doc.setTextColor(gold);
  doc.setFont("times", "bold");
  doc.setFontSize(32);
  doc.text("HEAL", 70, 72);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("DENTAL CLINIC", 72, 91);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(settings.phone, 78, 124);

  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(settings.doctorName, 410, 64, { maxWidth: 125 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(settings.doctorQualification, 410, 82, { maxWidth: 125 });
  doc.text("Dental Registration No.:", 410, 101);
  doc.setTextColor(gold);
  doc.setFont("helvetica", "bold");
  doc.text(settings.registrationNumber, 528, 101, { align: "right" });

  doc.setDrawColor(line);
  doc.line(215, 132, 380, 132);
  doc.setTextColor(ink);
  doc.setFont("times", "bold");
  doc.setFontSize(23);
  doc.text("PRESCRIPTION", 297, 174, { align: "center" });
  doc.line(140, 164, 220, 164);
  doc.line(375, 164, 455, 164);

  doc.setFillColor("#FFFFFF");
  doc.roundedRect(42, 200, 511, 58, 8, 8, "FD");
  const meta = [
    ["Patient Name", data.patientName],
    ["Date", today],
    ["Patient ID", data.patientId],
    ["Age / Gender", data.ageGender]
  ];
  meta.forEach(([label, value], index) => {
    const x = 65 + index * 124;
    if (index > 0) doc.line(x - 18, 214, x - 18, 246);
    doc.setTextColor(muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(label, x, 224);
    doc.setTextColor(ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(value || "Not added", x, 242, { maxWidth: 96 });
  });

  const heading = (title: string, x: number, yy: number) => {
    doc.setTextColor(ink);
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text(title.toUpperCase(), x, yy);
  };
  const body = (value: string | string[], x: number, yy: number, width: number, size = 9) => {
    const raw = Array.isArray(value) ? value : value.split("\n");
    const lines = raw.flatMap((item) => doc.splitTextToSize(item || "Not added", width));
    doc.setTextColor(ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    lines.forEach((item, index) => doc.text(item, x, yy + index * 14));
  };

  doc.setDrawColor(line);
  doc.roundedRect(42, 278, 511, 134, 10, 10, "S");
  doc.line(297, 294, 297, 392);
  heading("Chief Complaint", 72, 292);
  body(data.chiefComplaint || data.clinicalNotes || "Not added", 72, 316, 195);
  doc.line(72, 350, 267, 350);
  heading("Clinical Diagnosis", 72, 376);
  body([data.diagnosis || "Not added", data.tooth ? `Tooth / area: ${data.tooth}` : ""], 72, 400, 195);
  heading("Recommended Treatment", 322, 292);
  body(data.treatments.length ? data.treatments.map((item) => `- ${data.tooth ? `${item} - ${data.tooth}` : item}`) : "Not added", 322, 316, 190);

  heading("Medications", 72, 448);
  const tableX = 72;
  const tableY = 466;
  const widths = [128, 58, 74, 58];
  doc.setFillColor("#F7EFE4");
  doc.roundedRect(tableX, tableY, 318, 24, 6, 6, "F");
  ["Medicine", "Dose", "Frequency", "Duration"].forEach((label, index) => {
    const x = tableX + widths.slice(0, index).reduce((sum, value) => sum + value, 0);
    doc.setTextColor(ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(label, x + 8, tableY + 15);
  });
  medicines.slice(0, 6).forEach((medicine, row) => {
    const rowY = tableY + 24 + row * 23;
    doc.setDrawColor(line);
    doc.line(tableX, rowY, tableX + 318, rowY);
    const values = [medicine.name, medicine.dosage || "-", medicine.frequency || "-", medicine.duration || "-"];
    values.forEach((value, index) => {
      const x = tableX + widths.slice(0, index).reduce((sum, item) => sum + item, 0);
      doc.setTextColor(ink);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(String(value), x + 8, rowY + 15, { maxWidth: widths[index] - 12 });
    });
  });

  heading("Investigations Advised", 410, 448);
  doc.roundedRect(410, tableY, 118, 118, 8, 8, "S");
  investigations.slice(0, 3).forEach((item, index) => {
    const yy = tableY + 24 + index * 34;
    doc.setTextColor(ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text([item.name, item.area].filter(Boolean).join(" - ") || "Not advised", 422, yy, { maxWidth: 92 });
    doc.setTextColor(muted);
    doc.setFont("helvetica", "normal");
    doc.text(item.reason || "As advised.", 422, yy + 12, { maxWidth: 92 });
  });

  heading("Instructions / Advice", 72, 642);
  advice.forEach((item, index) => {
    const x = index % 2 === 0 ? 72 : 240;
    const yy = 670 + Math.floor(index / 2) * 22;
    doc.setTextColor(gold);
    doc.setFont("helvetica", "bold");
    doc.text("o", x, yy);
    doc.setTextColor(ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(item, x + 14, yy, { maxWidth: 142 });
  });

  heading("Next Visit", 410, 642);
  doc.roundedRect(410, 660, 118, 52, 8, 8, "S");
  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(data.nextVisit || "Not scheduled", 422, 688, { maxWidth: 92 });

  doc.roundedRect(42, 728, 511, 54, 8, 8, "S");
  doc.setTextColor(ink);
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.text("We're here to care for your smile.", 82, 754);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Thank you for trusting ${settings.clinicName}.`, 82, 770, { maxWidth: 280 });
  doc.text("Scan to verify this prescription", 410, 754);
  doc.text(settings.website.replace(/^https?:\/\//, "").replace(/\/$/, ""), 410, 770, { maxWidth: 115 });

  doc.setTextColor(muted);
  doc.setFontSize(8);
  doc.text("This is a digitally generated prescription. No physical signature is required.", 52, 806);
  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.text(settings.doctorName, 420, 806, { maxWidth: 120 });
}

function renderInvoicePdf(doc: jsPDF, data: DynamicVisitPdfData) {
  const settings = loadClinicSettings();
  const gold = "#B98543";
  const ink = "#1F2428";
  const muted = "#6E6860";
  const line = "#E8D4B6";
  const paper = "#FFFCF7";
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const items = data.invoiceItems.length ? data.invoiceItems : [{ service: "No invoice items added", amount: "0" }];

  doc.setFillColor(paper);
  doc.rect(0, 0, 595, 842, "F");
  doc.setDrawColor(line);
  doc.roundedRect(28, 28, 539, 786, 12, 12, "S");

  doc.setTextColor(gold);
  doc.setFont("times", "bold");
  doc.setFontSize(30);
  doc.text("HEAL", 52, 72);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("DENTAL CLINIC", 54, 90);

  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.text("INVOICE", 52, 138);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(muted);
  doc.text(`Invoice Date: ${today}`, 52, 164);
  doc.text(`Patient ID: ${data.patientId}`, 52, 182);

  doc.setFillColor("#FFFFFF");
  doc.roundedRect(350, 54, 175, 92, 8, 8, "FD");
  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(data.patientName || "Patient", 370, 80, { maxWidth: 135 });
  doc.setTextColor(muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(data.patientPhone || "Phone not added", 370, 100, { maxWidth: 135 });
  doc.text(data.ageGender || "Age / gender not added", 370, 118, { maxWidth: 135 });

  doc.roundedRect(52, 216, 491, 54, 8, 8, "S");
  doc.setTextColor(muted);
  doc.setFontSize(9);
  doc.text("Diagnosis", 72, 238);
  doc.text("Treatment / Tooth Area", 300, 238);
  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(data.diagnosis || "Not added", 72, 256, { maxWidth: 190 });
  doc.text(data.tooth ? `Tooth / area: ${data.tooth}` : "Not added", 300, 256, { maxWidth: 190 });

  const tableX = 52;
  let y = 315;
  doc.setFillColor("#F7EFE4");
  doc.roundedRect(tableX, y - 24, 491, 32, 8, 8, "F");
  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("#", 72, y - 4);
  doc.text("Service", 108, y - 4);
  doc.text("Amount", 504, y - 4, { align: "right" });

  items.forEach((item, index) => {
    y += 38;
    doc.setDrawColor(line);
    doc.line(72, y - 20, 523, y - 20);
    doc.setTextColor(muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(String(index + 1), 72, y);
    doc.setTextColor(ink);
    doc.setFont("helvetica", "bold");
    doc.text(item.service || "Service", 108, y, { maxWidth: 310 });
    doc.text(`Rs. ${item.amount || "0"}`, 504, y, { align: "right" });
  });

  y += 36;
  doc.setDrawColor(line);
  doc.line(340, y, 523, y);
  doc.setTextColor(muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Total Amount", 350, y + 28);
  doc.setTextColor(gold);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`Rs. ${data.invoiceTotal.toLocaleString("en-IN")}`, 504, y + 30, { align: "right" });

  doc.setTextColor(muted);
  doc.setFontSize(9);
  doc.text(`${settings.phone} - ${settings.email}`, 52, 800);
}
