import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const visitToken = `visit-${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;

  return NextResponse.json({
    patient: {
      id: `P-${Math.floor(1000 + Math.random() * 8999)}`,
      ...body
    },
    visitToken,
    portalUrl: `/p/${visitToken}`
  });
}
