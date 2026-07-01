import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireApiSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await requireApiSession(request);
  if (!session) return NextResponse.json({ error: "Clinic login required." }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = supabaseAdmin
      .from("Appointment")
      .select("*, patient:Patient(*)")
      .order("startsAt", { ascending: true });

    if (from) query = query.gte("startsAt", from);
    if (to) query = query.lte("startsAt", to);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: "Could not load appointments." }, { status: 500 });
    return NextResponse.json({ appointments: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Could not load appointments." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireApiSession(request);
  if (!session) return NextResponse.json({ error: "Clinic login required." }, { status: 401 });

  try {
    const body = await request.json() as {
      patientId?: string;
      fullName?: string;
      phone?: string;
      startsAt?: string;
      purpose?: string;
    };

    if (!body.startsAt || (!body.patientId && (!body.fullName || !body.phone))) {
      return NextResponse.json({ error: "Patient details and appointment time are required." }, { status: 400 });
    }

    let patientId = body.patientId;

    if (!patientId) {
      const { data: patient, error: patientError } = await supabaseAdmin
        .from("Patient")
        .insert({
          id: crypto.randomUUID(),
          patientCode: `P-${Math.floor(10000 + Math.random() * 90000)}`,
          fullName: body.fullName,
          phone: body.phone
        })
        .select("*")
        .single();

      if (patientError) {
        return NextResponse.json({ error: "Could not create appointment patient." }, { status: 500 });
      }
      patientId = patient.id;
    }

    const { data: appointment, error } = await supabaseAdmin
      .from("Appointment")
      .insert({
        id: crypto.randomUUID(),
        patientId,
        startsAt: body.startsAt,
        purpose: body.purpose || "Appointment",
        status: "SCHEDULED"
      })
      .select("*, patient:Patient(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: "Could not create appointment." }, { status: 500 });
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create appointment." }, { status: 500 });
  }
}
