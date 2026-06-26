"use client";

export type ClinicSettings = {
  clinicName: string;
  clinicDisplayName: string;
  doctorName: string;
  doctorQualification: string;
  registrationNumber: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  mapsUrl: string;
  googleReviewUrl: string;
  consultationFee: string;
  xrayFee: string;
};

export const clinicSettingsKey = "healDentalClinicSettings";

export const defaultClinicSettings: ClinicSettings = {
  clinicName: "Heal Dental Clinic",
  clinicDisplayName: "Heal Dental Clinic, Harlur Road, Bengaluru",
  doctorName: "Dr. Harshita Sharma",
  doctorQualification: "BDS, MDS - Periodontology & Oral Implantology",
  registrationNumber: "59062-A",
  phone: "9353403855",
  email: "healdentaltld@gmail.com",
  website: "https://healdental.in/",
  address: "First floor, Haralur Main Rd, above Kadence music centre, opposite Ozone Evergreen Society, Haralur, Eastwood Twp, Bengaluru, Karnataka 560102",
  mapsUrl: "https://maps.app.goo.gl/sr88APaGUQjWXH9V8",
  googleReviewUrl: "https://g.page/r/CfOYOxQzAQGUEBM/review",
  consultationFee: "500",
  xrayFee: "300"
};

export function loadClinicSettings(): ClinicSettings {
  if (typeof window === "undefined") return defaultClinicSettings;
  const saved = window.localStorage.getItem(clinicSettingsKey);
  if (!saved) return defaultClinicSettings;

  try {
    const parsed = JSON.parse(saved) as Partial<ClinicSettings>;
    return { ...defaultClinicSettings, ...parsed };
  } catch {
    return defaultClinicSettings;
  }
}

export function saveClinicSettings(settings: ClinicSettings) {
  window.localStorage.setItem(clinicSettingsKey, JSON.stringify(settings));
}

export function normalizePhoneForWhatsApp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length > 10) return digits;
  return "";
}

export function phoneHref(phone: string) {
  const number = normalizePhoneForWhatsApp(phone);
  return number ? `tel:+${number}` : "tel:";
}
