import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ visitToken: string }> }
) {
  try {
    const { visitToken } = await context.params;
    const { data: visit, error } = await supabaseAdmin
      .from("Visit")
      .select("*, patient:Patient(*), medicines:Medicine(*), invoiceItems:InvoiceItem(*), documents:Document(*)")
      .eq("visitToken", visitToken)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Could not load visit." }, { status: 500 });
    }

    if (!visit) {
      return NextResponse.json({ error: "Visit not found." }, { status: 404 });
    }

    return NextResponse.json({ visit });
  } catch {
    return NextResponse.json({ error: "Could not load visit." }, { status: 500 });
  }
}
