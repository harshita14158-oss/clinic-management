import QRCode from "qrcode";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") ?? "";

  if (!text.trim()) {
    return new Response("QR text missing", { status: 400 });
  }

  const png = await QRCode.toBuffer(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
    type: "png",
    color: {
      dark: "#17191c",
      light: "#ffffff"
    }
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store"
    }
  });
}
