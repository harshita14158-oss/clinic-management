import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json({
    status: "accepted",
    acceptedAt: new Date().toISOString(),
    patientName: body.patientName,
    phone: body.phone
  });
}
