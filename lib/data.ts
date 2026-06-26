export type Medicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
};

export type InvoiceItem = {
  service: string;
  description: string;
  amount: number;
};

export const patient = {
  id: "P-1024",
  visitId: "visit-ABCD123",
  name: "Rahul Sharma",
  firstName: "Rahul",
  phone: "+91 98765 43210",
  email: "rahul.sharma@gmail.com",
  age: 32,
  gender: "Male",
  address: "Civil Lines, New Delhi",
  visitDate: "12 May 2026",
  visitTime: "10:30 AM",
  nextVisit: "19 May 2026",
  nextTime: "5:30 PM",
  doctor: "Dr. Harshita Sharma",
  diagnosis: "Deep decay with pulpal involvement in tooth 46.",
  finding: "Deep decay involving the nerve of your lower right tooth.",
  treatment: "Root Canal Treatment (RCT) followed by crown placement.",
  treatmentReason: "This helps remove infection, relieve pain and save the tooth.",
  tooth: "46",
  stage: "RCT - Next Session",
  status: "Consultation Done",
  consentStatus: "Accepted"
};

export const medicines: Medicine[] = [
  {
    name: "Amoxicillin 500mg",
    dosage: "1 capsule",
    frequency: "Twice daily",
    duration: "5 days"
  },
  {
    name: "Zerodol-SP",
    dosage: "1 tablet",
    frequency: "Twice daily",
    duration: "3 days"
  },
  {
    name: "Chlorhexidine Mouthwash",
    dosage: "10 ml",
    frequency: "Twice daily",
    duration: "7 days"
  }
];

export const instructions = [
  "Mild pain or sensitivity for 1-2 days is normal.",
  "Avoid chewing from the treated side.",
  "Complete medicines as prescribed.",
  "Contact us if swelling or severe pain increases."
];

export const invoiceItems: InvoiceItem[] = [
  { service: "Consultation", description: "Dental consultation", amount: 300 },
  { service: "Digital X-Ray", description: "Periapical X-Ray", amount: 200 },
  { service: "RCT (Tooth 46) - Advance", description: "Root Canal Treatment Advance", amount: 3500 }
];

export const visits = [
  {
    name: "Rahul Sharma",
    initials: "RS",
    phone: "+91 98765 43210",
    time: "10:30 AM",
    status: "Consultation Done",
    treatment: "RCT + Crown",
    next: "Consent Pending",
    tone: "gold"
  },
  {
    name: "Priya Choudhary",
    initials: "PC",
    phone: "+91 91234 56789",
    time: "11:15 AM",
    status: "In Progress",
    treatment: "Scaling + Polishing",
    next: "Prophy Follow-up",
    tone: "blue"
  },
  {
    name: "Amit Kumar",
    initials: "AK",
    phone: "+91 99887 66554",
    time: "12:00 PM",
    status: "Consultation Done",
    treatment: "Implant Placement",
    next: "Treatment Plan",
    tone: "gold"
  },
  {
    name: "Sneha Nair",
    initials: "SN",
    phone: "+91 87654 32109",
    time: "1:00 PM",
    status: "Completed",
    treatment: "Filling",
    next: "None",
    tone: "green"
  }
];

export const documents = [
  "Visit Summary PDF",
  "Prescription PDF",
  "Invoice PDF",
  "Consent PDF"
];

export const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});
