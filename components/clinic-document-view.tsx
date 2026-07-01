"use client";

import { ArrowLeft, Download, LayoutDashboard, MessageCircle, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { ClinicSettings, defaultClinicSettings, loadClinicSettings, normalizePhoneForWhatsApp } from "@/lib/clinic-settings";

type GeneratedDocument = {
  title: string;
  url?: string;
  kind?: string;
  returnUrl?: string;
  data?: PrescriptionData;
  sections: Array<{ title: string; lines: string[] }>;
};

type PrescriptionData = {
  visitToken?: string;
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
  medicines: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
  investigations: Array<{ name: string; area: string; reason: string }>;
  instructions: string;
  nextVisit: string;
  invoiceItems?: Array<{ service: string; amount: string }>;
  invoiceTotal?: number;
  paymentStatus?: string;
};

const emptyDocument: GeneratedDocument = {
  title: "Generated Document",
  sections: [
    {
      title: "No Document Selected",
      lines: ["Please generate a document from the patient profile first."]
    }
  ]
};

export function ClinicDocumentView() {
  const [document, setDocument] = useState<GeneratedDocument>(emptyDocument);
  const [downloadNotice, setDownloadNotice] = useState("");
  const [pdfObjectUrl, setPdfObjectUrl] = useState("");
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [settings, setSettings] = useState<ClinicSettings>(defaultClinicSettings);

  useEffect(() => {
    setSettings(loadClinicSettings());
    const saved = window.localStorage.getItem("healDentalGeneratedDocument");
    if (!saved) return;
    try {
      setDocument(JSON.parse(saved));
    } catch {
      setDocument(emptyDocument);
    }
  }, []);

  useEffect(() => {
    if (!document.url) {
      setPdfObjectUrl("");
      setShowPdfPreview(false);
      return;
    }

    try {
      const objectUrl = createPdfObjectUrl(document.url);
      setPdfObjectUrl(objectUrl);
      return () => window.URL.revokeObjectURL(objectUrl);
    } catch {
      setPdfObjectUrl("");
    }
  }, [document.url]);

  function documentFileName() {
    const kind = document.kind || document.title || "document";
    const patientName = document.data?.patientName || "patient";
    const patientId = document.data?.patientId || "patient-id";
    const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).replace(/\s+/g, "");
    return [kind, patientName, patientId, date]
      .join("_")
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "heal-dental-document";
  }

  function sharePatientPortalAgain() {
    if (!document.data?.patientId) {
      setDownloadNotice("Open a patient document first to share the portal.");
      return;
    }

    const token = window.localStorage.getItem(`healDentalLatestPatientPortal:${document.data.patientId}`);
    if (!token) {
      setDownloadNotice("Generate the patient summary once before sharing the portal again.");
      return;
    }

    const number = normalizePhoneForWhatsApp(document.data.patientPhone || "");
    if (!number) {
      setDownloadNotice("Patient phone number is not valid for WhatsApp sharing.");
      return;
    }

    const portalUrl = `${window.location.origin}/p/${token}`;
    const firstName = document.data.patientName?.split(" ")[0] || "there";
    const message = [
      `Hello ${firstName},`,
      "",
      `Your visit documents from ${settings.clinicName} are ready here:`,
      portalUrl,
      "",
      "You can open this link anytime to view or download your documents.",
      "",
      settings.clinicName
    ].join("\n");
    const whatsAppUrl = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    const opened = window.open(whatsAppUrl, "_blank", "noopener,noreferrer");
    if (!opened) window.location.assign(whatsAppUrl);
  }

  async function downloadGeneratedPdf() {
    if (!document.url) {
      setDownloadNotice("Generate a document from the patient profile first.");
      return;
    }

    const fileName = documentFileName();

    try {
      const response = await fetch("/api/save-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          dataUrl: document.url,
          visitToken: document.data?.visitToken,
          type: document.kind || document.title
        })
      });
      const result = await response.json() as { fileUrl?: string; error?: string };

      if (response.ok && result.fileUrl) {
        setDownloadNotice(`PDF saved to Supabase Storage: ${result.fileUrl}`);
        return;
      }
    } catch {
      // Fall back to browser download below.
    }

    try {
      if (!pdfObjectUrl) throw new Error("PDF preview not ready");
      const link = window.document.createElement("a");
      link.href = pdfObjectUrl;
      link.download = `${fileName}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      setDownloadNotice("PDF download started. If the in-app browser hides downloads, use Print / Save as PDF.");
    } catch {
      setDownloadNotice("Download could not start here. Please use Print / Save as PDF.");
    }
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-5 text-ink sm:px-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-[920px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <a href={document.returnUrl ?? "/clinic/profile?patient=P-1024"} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-softgold/70 bg-white/80 px-4 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" />
            Back to Patient Profile
          </a>
          <div className="flex flex-wrap gap-3">
            <a
              href="/clinic/dashboard"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-softgold/70 bg-white/80 px-4 text-sm font-semibold"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </a>
            {document.data ? (
              <button
                onClick={sharePatientPortalAgain}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-softgold/70 bg-white/80 px-4 text-sm font-semibold"
              >
                <MessageCircle className="h-4 w-4" />
                Share Portal Again
              </button>
            ) : null}
            {document.url ? (
              <button
                onClick={downloadGeneratedPdf}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-softgold/70 bg-white/80 px-4 text-sm font-semibold"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            ) : null}
            {pdfObjectUrl ? (
              <button
                onClick={() => {
                  setShowPdfPreview(true);
                  setDownloadNotice("PDF preview opened below. Use the viewer controls or Print / Save as PDF if your browser blocks downloads.");
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-softgold/70 bg-white/80 px-4 text-sm font-semibold"
              >
                Open PDF
              </button>
            ) : null}
            <button
              onClick={() => window.print()}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-ink px-4 text-sm font-semibold text-white shadow-soft"
            >
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </button>
          </div>
        </div>

        {downloadNotice ? (
          <div className="mb-5 rounded-2xl border border-softgold/70 bg-white/80 px-4 py-3 text-sm font-semibold text-muted print:hidden">
            {downloadNotice}
          </div>
        ) : null}

        {document.kind === "prescription" && document.data ? (
          <PrescriptionTemplate data={document.data} settings={settings} />
        ) : document.kind === "invoice" && document.data ? (
          <InvoiceTemplate data={document.data} settings={settings} />
        ) : (
          <article className="rounded-[28px] border border-softgold/60 bg-paper p-6 shadow-card sm:p-10 print:rounded-none print:border-0 print:shadow-none">
            <header className="flex flex-wrap items-start justify-between gap-6 border-b border-softgold/60 pb-6">
              <Logo />
              <div className="text-right text-sm leading-6 text-muted">
                <p className="font-semibold text-ink">{settings.clinicName}</p>
                <p>{settings.phone}</p>
                <p>{settings.email}</p>
              </div>
            </header>

            <section className="py-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Generated Document</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{document.title}</h1>
              <p className="mt-3 text-sm leading-6 text-muted print:hidden">
                This page is ready to print or save as PDF from the button above.
              </p>
            </section>

            <div className="grid gap-4">
              {document.sections.map((section) => (
                <section key={section.title} className="rounded-2xl border border-softgold/60 bg-white/80 p-5 print:break-inside-avoid">
                  <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-gold">{section.title}</h2>
                  <div className="mt-4 space-y-2 text-sm leading-7">
                    {section.lines.filter(Boolean).map((line, index) => (
                      <p key={`${section.title}-${index}`} className="whitespace-pre-line">{line}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <footer className="mt-8 border-t border-softgold/60 pt-5 text-xs leading-6 text-muted">
              This is a system generated document from Heal Dental Clinic.
            </footer>
          </article>
        )}

        {showPdfPreview && pdfObjectUrl ? (
          <section className="mt-5 overflow-hidden rounded-[24px] border border-softgold/70 bg-white shadow-card print:hidden">
            <div className="flex items-center justify-between border-b border-softgold/60 px-4 py-3">
              <p className="text-sm font-bold text-ink">PDF Preview</p>
              <a href={pdfObjectUrl} className="text-sm font-semibold text-gold">
                Open raw PDF
              </a>
            </div>
            <iframe title={`${document.title} PDF preview`} src={pdfObjectUrl} className="h-[760px] w-full bg-white" />
          </section>
        ) : null}
      </div>
    </main>
  );
}

function createPdfObjectUrl(dataUrl: string) {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return window.URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
}

function PrescriptionTemplate({ data, settings }: { data: PrescriptionData; settings: ClinicSettings }) {
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const complaint = data.chiefComplaint || data.clinicalNotes || "Not added";
  const diagnosis = [data.diagnosis || "Not added", data.tooth ? `Tooth / area: ${data.tooth}` : ""].filter(Boolean).join("\n");
  const treatments = data.treatments.length ? data.treatments.map((item) => (data.tooth ? `${item} - ${data.tooth}` : item)) : ["Not added"];
  const medicines = data.medicines.length ? data.medicines : [{ name: "Not prescribed", dosage: "", frequency: "", duration: "" }];
  const investigations = data.investigations.length ? data.investigations : [{ name: "Not advised", area: "", reason: "" }];
  const advice = data.instructions
    ? data.instructions.split("\n").map((line) => line.replace(/^- /, "").trim()).filter((line) => line && !line.endsWith(":") && !line.toLowerCase().includes("instructions")).slice(0, 6)
    : ["Complete medicines as prescribed", "Maintain good oral hygiene", "Contact clinic if pain or swelling increases"];

  return (
    <article className="rounded-[28px] border border-softgold/60 bg-paper p-5 shadow-card sm:p-8 print:rounded-none print:border-0 print:shadow-none">
      <header className="grid gap-6 border-b border-softgold/70 pb-6 md:grid-cols-[1fr_1fr] md:items-start">
        <div>
          <Logo />
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-linen px-4 py-2 text-sm font-semibold text-ink">
            <span className="text-gold">Phone</span> {settings.phone}
          </p>
        </div>
        <div className="md:text-right">
          <p className="text-2xl font-bold text-ink">{settings.doctorName}</p>
          <p className="mt-2 text-sm text-muted">{settings.doctorQualification}</p>
          <p className="mt-2 text-sm font-semibold text-ink">Dental Registration No.: <span className="text-gold">{settings.registrationNumber}</span></p>
        </div>
      </header>

      <section className="py-6 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border border-softgold/80 bg-white text-3xl text-gold">Rx</div>
        <h1 className="font-serif text-3xl font-bold tracking-wide text-ink">PRESCRIPTION</h1>
      </section>

      <section className="grid gap-4 rounded-2xl border border-softgold/70 bg-white/70 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCell label="Patient Name" value={data.patientName} />
        <InfoCell label="Date" value={today} />
        <InfoCell label="Patient ID" value={data.patientId} />
        <InfoCell label="Age / Gender" value={data.ageGender} />
      </section>

      <section className="mt-5 grid gap-5 rounded-2xl border border-softgold/70 bg-white/60 p-5 lg:grid-cols-2">
        <div className="space-y-5">
          <PrescriptionBlock title="Chief Complaint" value={complaint} />
          <PrescriptionBlock title="Clinical Diagnosis" value={diagnosis} />
        </div>
        <PrescriptionBlock title="Recommended Treatment" lines={treatments} />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.9fr]">
        <div className="rounded-2xl border border-softgold/70 bg-white/70 p-5">
          <h2 className="font-serif text-xl font-bold uppercase tracking-wide">Medications</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-softgold/70">
            <div className="grid grid-cols-[1.5fr_0.7fr_0.85fr_0.7fr] bg-linen text-xs font-bold text-ink">
              <span className="p-3">Medicine</span>
              <span className="border-l border-softgold/70 p-3">Dose</span>
              <span className="border-l border-softgold/70 p-3">Frequency</span>
              <span className="border-l border-softgold/70 p-3">Duration</span>
            </div>
            {medicines.map((medicine, index) => (
              <div key={`${medicine.name}-${index}`} className="grid grid-cols-[1.5fr_0.7fr_0.85fr_0.7fr] border-t border-softgold/60 text-sm">
                <span className="p-3 font-medium">{medicine.name}</span>
                <span className="border-l border-softgold/60 p-3">{medicine.dosage || "-"}</span>
                <span className="border-l border-softgold/60 p-3">{medicine.frequency || "-"}</span>
                <span className="border-l border-softgold/60 p-3">{medicine.duration || "-"}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-softgold/70 pt-5">
            <h2 className="font-serif text-xl font-bold uppercase tracking-wide">Instructions / Advice</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {advice.map((item) => (
                <p key={item} className="flex gap-2 text-sm leading-6"><span className="text-gold">-</span>{item}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-softgold/70 bg-white/70 p-5">
            <h2 className="font-serif text-xl font-bold uppercase tracking-wide">Investigations Advised</h2>
            <div className="mt-4 space-y-4 rounded-xl border border-softgold/60 bg-paper p-4">
              {investigations.map((item, index) => (
                <div key={`${item.name}-${index}`} className="border-b border-softgold/60 pb-3 last:border-b-0 last:pb-0">
                  <p className="font-bold">{[item.name, item.area].filter(Boolean).join(" - ")}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{item.reason || "As advised."}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-softgold/70 bg-white/70 p-5">
            <h2 className="font-serif text-xl font-bold uppercase tracking-wide">Next Visit</h2>
            <p className="mt-4 rounded-xl border border-softgold/60 bg-paper p-4 text-sm font-semibold leading-6">
              {data.nextVisit || "Not scheduled"}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 rounded-2xl border border-softgold/70 bg-white/70 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-serif text-xl font-bold">We&apos;re here to care for your smile.</p>
          <p className="mt-1 text-sm text-muted">Thank you for trusting {settings.clinicName}.</p>
        </div>
        <div className="text-sm font-semibold text-muted">Scan to verify prescription</div>
      </section>

      <footer className="mt-8 grid gap-4 border-t border-softgold/70 pt-5 text-sm text-muted md:grid-cols-3 md:items-end">
        <p>This is a digitally generated prescription. No physical signature is required.</p>
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-gold text-center text-[10px] font-bold uppercase text-gold">Verified</div>
        <div className="md:text-right">
          <p className="font-serif text-xl text-emerald-700">{settings.doctorName.replace(/^Dr\.\s*/i, "")}</p>
          <p className="font-bold text-ink">{settings.doctorName}</p>
          <p>Dental Registration No.: {settings.registrationNumber}</p>
        </div>
      </footer>
    </article>
  );
}

function InvoiceTemplate({ data, settings }: { data: PrescriptionData; settings: ClinicSettings }) {
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const items = data.invoiceItems?.length ? data.invoiceItems : [{ service: "No invoice items added", amount: "0" }];
  const total = data.invoiceTotal ?? items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const paymentStatus = data.paymentStatus || "Paid";

  return (
    <article className="rounded-[28px] border border-softgold/60 bg-paper p-5 shadow-card sm:p-8 print:rounded-none print:border-0 print:shadow-none">
      <header className="grid gap-6 border-b border-softgold/70 pb-6 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <Logo />
          <p className="mt-4 text-sm font-semibold text-muted">{settings.phone} - {settings.email}</p>
        </div>
        <div className="grid gap-3 md:min-w-72">
          <div className="rounded-2xl border border-softgold/70 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Issued By</p>
            <h2 className="mt-2 text-xl font-bold">{settings.doctorName}</h2>
            <p className="mt-1 text-sm text-muted">{settings.doctorQualification}</p>
            <p className="mt-1 text-sm font-semibold text-ink">Dental Registration No.: <span className="text-gold">{settings.registrationNumber}</span></p>
          </div>
          <div className="rounded-2xl border border-softgold/70 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Billed To</p>
            <h2 className="mt-2 text-xl font-bold">{data.patientName}</h2>
            <p className="mt-1 text-sm text-muted">{data.patientPhone}</p>
            <p className="mt-1 text-sm text-muted">{data.ageGender}</p>
          </div>
        </div>
      </header>

      <section className="py-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Generated Invoice</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Invoice</h1>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <InfoCell label="Invoice Date" value={today} />
          <InfoCell label="Patient ID" value={data.patientId} />
          <InfoCell label="Tooth / Area" value={data.tooth || "Not added"} />
        </div>
      </section>

      <section className="rounded-2xl border border-softgold/70 bg-white/70 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCell label="Diagnosis" value={data.diagnosis || "Not added"} />
          <InfoCell label="Recommended Treatment" value={data.treatments.length ? data.treatments.join(", ") : "Not added"} />
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-softgold/70 bg-white/80">
        <div className="grid grid-cols-[56px_1fr_140px] bg-linen px-4 py-3 text-sm font-bold">
          <span>#</span>
          <span>Service</span>
          <span className="text-right">Amount</span>
        </div>
        {items.map((item, index) => (
          <div key={`${item.service}-${index}`} className="grid grid-cols-[56px_1fr_140px] border-t border-softgold/60 px-4 py-4 text-sm">
            <span className="text-muted">{index + 1}</span>
            <span className="font-semibold">{item.service}</span>
            <span className="text-right font-bold">Rs. {Number(item.amount || 0).toLocaleString("en-IN")}</span>
          </div>
        ))}
      </section>

      <section className="mt-5 flex justify-end">
        <div className="w-full max-w-sm rounded-2xl border border-softgold/70 bg-white/80 p-5">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Total Amount</span>
            <span className="text-2xl font-bold text-gold">Rs. {total.toLocaleString("en-IN")}</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-softgold/60 pt-4 text-sm">
            <span className="font-semibold text-muted">Payment Status</span>
            <span className="rounded-full bg-linen px-3 py-1 font-bold text-gold">{paymentStatus}</span>
          </div>
        </div>
      </section>

      <section className="mt-7 grid gap-4 rounded-2xl border border-softgold/70 bg-white/70 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-sm font-bold text-ink">Digitally generated by {settings.clinicName}</p>
          <p className="mt-1 text-xs leading-6 text-muted">This invoice is system generated from the saved visit entry.</p>
        </div>
        <div className="grid h-24 w-24 place-items-center rounded-full border border-dashed border-gold text-center text-[10px] font-bold uppercase leading-4 text-gold">
          Clinic<br />Stamp
        </div>
      </section>

      <footer className="mt-8 grid gap-4 border-t border-softgold/70 pt-5 text-xs leading-6 text-muted sm:grid-cols-[1fr_auto] sm:items-end">
        <p>{settings.clinicName} - {settings.phone} - {settings.email}</p>
        <div className="sm:text-right">
          <p className="font-bold text-ink">{settings.doctorName}</p>
          <p>{settings.doctorQualification}</p>
          <p>Dental Registration No.: {settings.registrationNumber}</p>
        </div>
      </footer>
    </article>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm font-bold text-ink">{value || "Not added"}</p>
    </div>
  );
}

function PrescriptionBlock({ title, value, lines }: { title: string; value?: string; lines?: string[] }) {
  return (
    <div>
      <h2 className="font-serif text-xl font-bold uppercase tracking-wide">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-ink">
        {lines ? lines.map((line) => <p key={line} className="flex gap-3"><span className="text-gold">-</span><span>{line}</span></p>) : <p className="whitespace-pre-line">{value || "Not added"}</p>}
      </div>
    </div>
  );
}
