import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireApiSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name?: string;
      email?: string;
      password?: string;
      role?: "DOCTOR" | "ASSISTANT";
    };

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const role = body.role ?? "DOCTOR";

    if (!name || !email || password.length < 8) {
      return NextResponse.json({ error: "Name, email, and an 8+ character password are required." }, { status: 400 });
    }

    const { count, error: countError } = await supabaseAdmin
      .from("User")
      .select("id", { count: "exact", head: true });

    if (countError) {
      return NextResponse.json({ error: "Could not check user setup status." }, { status: 500 });
    }

    if ((count ?? 0) > 0) {
      const session = await requireApiSession(request);
      if (!session || session.role !== "DOCTOR") {
        return NextResponse.json({ error: "Only a signed-in doctor can create staff users." }, { status: 403 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabaseAdmin
      .from("User")
      .insert({
        id: crypto.randomUUID(),
        name,
        email,
        password: passwordHash,
        role
      })
      .select("id,name,email,role,createdAt")
      .single();

    if (error) {
      return NextResponse.json({ error: "Could not create user." }, { status: 500 });
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create user." }, { status: 500 });
  }
}
