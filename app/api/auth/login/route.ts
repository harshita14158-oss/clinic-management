import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from("User")
      .select("id,name,email,password,role")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 500 });
    }

    if (!user || !await bcrypt.compare(password, user.password)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await createSessionToken({ sub: user.id, email: user.email, role: user.role });
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    setSessionCookie(response, token);
    return response;
  } catch {
    return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
}
