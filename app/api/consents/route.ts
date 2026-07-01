import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { visitToken?: string };
    const visitToken = body.visitToken?.trim();

    if (!visitToken) {
      return NextResponse.json({ error: "Visit token is required." }, { status: 400 });
    }

    const { data: visit, error } = await supabaseAdmin
      .from("Visit")
      .update({
        consentStatus: "ACCEPTED",
        consentAcceptedAt: new Date().toISOString()
      })
      .eq("visitToken", visitToken)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Could not update consent." }, { status: 500 });
    }

    if (!visit) {
      return NextResponse.json({ error: "Visit not found." }, { status: 404 });
    }

    return NextResponse.json({ status: "accepted", visit });
  } catch {
    return NextResponse.json({ error: "Could not update consent." }, { status: 500 });
  }
}
