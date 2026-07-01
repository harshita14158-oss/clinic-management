import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireApiSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await requireApiSession(request);
  if (!session) return NextResponse.json({ error: "Clinic login required." }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    let query = supabaseAdmin
      .from("Visit")
      .select("*, patient:Patient(*), medicines:Medicine(*), invoiceItems:InvoiceItem(*), documents:Document(*)")
      .order("createdAt", { ascending: false });

    if (patientId) query = query.eq("patientId", patientId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: "Could not load visits." }, { status: 500 });
    return NextResponse.json({ visits: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Could not load visits." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireApiSession(request);
  if (!session) return NextResponse.json({ error: "Clinic login required." }, { status: 401 });

  try {
    const body = await request.json() as {
      patientId?: string;
      visitToken?: string;
      diagnosis?: string;
      toothNumber?: string;
      recommendedTreatment?: string;
      clinicalNotes?: string;
      instructions?: string;
      nextVisitAt?: string;
      medicines?: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
      invoiceItems?: Array<{ serviceName: string; description?: string; amount: number | string }>;
    };

    if (!body.patientId && !body.visitToken) {
      return NextResponse.json({ error: "Patient id or visit token is required." }, { status: 400 });
    }

    let visitId = "";
    let visitToken = body.visitToken;

    if (visitToken) {
      const { data: existing, error } = await supabaseAdmin
        .from("Visit")
        .select("id,visitToken")
        .eq("visitToken", visitToken)
        .maybeSingle();
      if (error) return NextResponse.json({ error: "Could not find visit." }, { status: 500 });
      if (!existing) return NextResponse.json({ error: "Visit not found." }, { status: 404 });
      visitId = existing.id;
    } else {
      let patientId = body.patientId;
      if (patientId) {
        const { data: directPatient, error: directError } = await supabaseAdmin
          .from("Patient")
          .select("id")
          .eq("id", patientId)
          .maybeSingle();

        if (directError) return NextResponse.json({ error: "Could not verify patient." }, { status: 500 });

        if (!directPatient) {
          const { data: codePatient, error: codeError } = await supabaseAdmin
            .from("Patient")
            .select("id")
            .eq("patientCode", patientId)
            .maybeSingle();

          if (codeError) return NextResponse.json({ error: "Could not verify patient." }, { status: 500 });
          patientId = codePatient?.id;
        }
      }

      if (!patientId) {
        return NextResponse.json({ error: "Patient not found." }, { status: 404 });
      }

      visitToken = `visit-${crypto.randomUUID().replace(/-/g, "")}`;
      visitId = crypto.randomUUID();
      const { error } = await supabaseAdmin
        .from("Visit")
        .insert({ id: visitId, visitToken, patientId });
      if (error) return NextResponse.json({ error: "Could not create visit." }, { status: 500 });
    }

    const { data: visit, error: updateError } = await supabaseAdmin
      .from("Visit")
      .update({
        diagnosis: body.diagnosis ?? null,
        toothNumber: body.toothNumber ?? null,
        recommendedTreatment: body.recommendedTreatment ?? null,
        clinicalNotes: body.clinicalNotes ?? null,
        instructions: body.instructions ?? null,
        nextVisitAt: body.nextVisitAt || null
      })
      .eq("id", visitId)
      .select("*")
      .single();

    if (updateError) return NextResponse.json({ error: "Could not save visit." }, { status: 500 });

    if (body.medicines) {
      await supabaseAdmin.from("Medicine").delete().eq("visitId", visitId);
      const medicines = body.medicines
        .filter((item) => item.name)
        .map((item) => ({ id: crypto.randomUUID(), visitId, ...item }));
      if (medicines.length) {
        const { error } = await supabaseAdmin.from("Medicine").insert(medicines);
        if (error) return NextResponse.json({ error: "Visit saved, but medicines could not be saved." }, { status: 500 });
      }
    }

    if (body.invoiceItems) {
      await supabaseAdmin.from("InvoiceItem").delete().eq("visitId", visitId);
      const items = body.invoiceItems
        .filter((item) => item.serviceName && Number(item.amount) > 0)
        .map((item) => ({
          id: crypto.randomUUID(),
          visitId,
          serviceName: item.serviceName,
          description: item.description ?? null,
          amount: Number(item.amount)
        }));
      if (items.length) {
        const { error } = await supabaseAdmin.from("InvoiceItem").insert(items);
        if (error) return NextResponse.json({ error: "Visit saved, but invoice items could not be saved." }, { status: 500 });
      }
    }

    return NextResponse.json({ visit: { ...visit, visitToken } });
  } catch {
    return NextResponse.json({ error: "Could not save visit." }, { status: 500 });
  }
}
