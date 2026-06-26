import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { NextResponse } from "next/server";

function cleanFileName(value: string) {
  const cleaned = value.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  return cleaned || "heal-dental-document";
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { fileName?: string; dataUrl?: string };
    const dataUrl = body.dataUrl ?? "";
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;

    if (!base64) {
      return NextResponse.json({ error: "PDF data missing" }, { status: 400 });
    }

    const fileName = `${cleanFileName(body.fileName ?? "heal-dental-document")}.pdf`;
    const filePath = join(homedir(), "Downloads", fileName);
    await writeFile(filePath, Buffer.from(base64, "base64"));

    return NextResponse.json({ fileName, filePath });
  } catch {
    return NextResponse.json({ error: "Could not save PDF" }, { status: 500 });
  }
}
