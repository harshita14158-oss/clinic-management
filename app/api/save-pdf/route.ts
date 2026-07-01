import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireApiSession } from "@/lib/session";

export const runtime = "nodejs";

function cleanFileName(value: string) {
  const cleaned = value.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  return cleaned || "heal-dental-document";
}

export async function POST(request: NextRequest) {
  const session = await requireApiSession(request);
  if (!session) {
    return NextResponse.json({ error: "Clinic login required." }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      fileName?: string;
      dataUrl?: string;
      visitToken?: string;
      type?: string;
    };
    const dataUrl = body.dataUrl ?? "";
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    const visitToken = body.visitToken?.trim();

    if (!base64 || !visitToken) {
      return NextResponse.json({ error: "PDF data and visit token are required." }, { status: 400 });
    }

    const { data: visit, error: visitError } = await supabaseAdmin
      .from("Visit")
      .select("id,visitToken")
      .eq("visitToken", visitToken)
      .maybeSingle();

    if (visitError) {
      return NextResponse.json({ error: "Could not verify visit." }, { status: 500 });
    }

    if (!visit) {
      return NextResponse.json({ error: "Visit not found." }, { status: 404 });
    }

    const fileName = `${cleanFileName(body.fileName ?? "heal-dental-document")}.pdf`;
    const storagePath = `${visitToken}/${fileName}`;
    const buffer = Buffer.from(base64, "base64");

    const { error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true
      });

    if (uploadError) {
      return NextResponse.json({ error: "Could not upload PDF." }, { status: 500 });
    }

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from("documents")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    if (signedError || !signed?.signedUrl) {
      return NextResponse.json({ error: "Could not create document link." }, { status: 500 });
    }

    const { data: document, error: documentError } = await supabaseAdmin
      .from("Document")
      .insert({
        id: crypto.randomUUID(),
        visitId: visit.id,
        type: body.type || "PDF",
        fileUrl: signed.signedUrl
      })
      .select("*")
      .single();

    if (documentError) {
      return NextResponse.json({ error: "PDF uploaded, but document record could not be saved." }, { status: 500 });
    }

    return NextResponse.json({
      fileName,
      storagePath,
      fileUrl: signed.signedUrl,
      document
    });
  } catch {
    return NextResponse.json({ error: "Could not save PDF." }, { status: 500 });
  }
}
