import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireApiSession } from "@/lib/session";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

function patientCode() {
  return `P-${Math.floor(10000 + Math.random() * 90000)}`;
}

function visitToken() {
  return `visit-${crypto.randomUUID().replace(/-/g, "")}`;
}

export async function GET(request: NextRequest) {
  const session = await requireApiSession(request);
  if (!session) return NextResponse.json({ error: "Clinic login required." }, { status: 401 });

  try {
    const { data, error } = await supabaseAdmin
      .from("Patient")
      .select(`
        *,
        visits:Visit(*, medicines:Medicine(*), invoiceItems:InvoiceItem(*), documents:Document(*)),
        appointments:Appointment(*)
      `)
      .order("createdAt", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Could not load patients." }, { status: 500 });
    }

    return NextResponse.json({ patients: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Could not load patients." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      fullName?: string;
      name?: string;
      phone?: string;
      email?: string;
      age?: string | number;
      gender?: string;
      address?: string;
      chiefComplaint?: string;
      complaint?: string;
      medicalHistory?: string;
      history?: string;
    };

    const fullName = (body.fullName ?? body.name ?? "").trim();
    const phone = (body.phone ?? "").trim();

    if (!fullName || !phone) {
      return NextResponse.json({ error: "Full name and phone are required." }, { status: 400 });
    }

    const patientId = crypto.randomUUID();
    const visitId = crypto.randomUUID();
    const token = visitToken();

    const patientPayload = {
      id: patientId,
      patientCode: patientCode(),
      fullName,
      phone,
      email: body.email?.trim() || null,
      age: body.age === undefined || body.age === "" ? null : Number(body.age),
      gender: body.gender?.trim() || null,
      address: body.address?.trim() || null,
      chiefComplaint: (body.chiefComplaint ?? body.complaint ?? "").trim() || null,
      medicalHistory: (body.medicalHistory ?? body.history ?? "").trim() || null
    };

    const { data: patient, error: patientError } = await supabaseAdmin
      .from("Patient")
      .insert(patientPayload)
      .select("*")
      .single();

    if (patientError) {
      return NextResponse.json({ error: "Could not create patient." }, { status: 500 });
    }

    const { data: visit, error: visitError } = await supabaseAdmin
      .from("Visit")
      .insert({
        id: visitId,
        visitToken: token,
        patientId
      })
      .select("*")
      .single();

    if (visitError) {
      return NextResponse.json({ error: "Patient created, but visit could not be started." }, { status: 500 });
    }

    return NextResponse.json({
      patient,
      visit,
      visitToken: token,
      portalUrl: `/p/${token}`
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create patient." }, { status: 500 });
  }
}
