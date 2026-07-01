"use client";

import { ArrowRight, Eye, HeartHandshake, Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { Logo } from "@/components/logo";

export default function ClinicLoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: login.trim(), password })
      });
      const result = await response.json() as { error?: string };

      if (!response.ok) {
        setError(result.error || "Please enter the correct email and password.");
        return;
      }

      const next = new URLSearchParams(window.location.search).get("next") || "/clinic/dashboard";
      window.location.assign(next);
    } catch {
      setError("Could not sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fffaf3]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1280px] gap-8 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-14 lg:py-16">
        <section className="relative hidden min-h-[760px] flex-col justify-between overflow-hidden rounded-[34px] border border-softgold/40 bg-gradient-to-br from-white via-[#fffaf3] to-[#f2e6d5] p-10 shadow-soft lg:flex">
          <div>
            <Logo />
            <div className="mt-28">
              <h1 className="font-serif text-5xl font-semibold tracking-tight text-ink">
                Welcome back
                <span className="ml-2 text-gold">✦</span>
              </h1>
              <p className="mt-6 max-w-md text-xl leading-9 text-ink">
                Sign in to access your clinic dashboard and manage patient care seamlessly.
              </p>
            </div>
          </div>

          <div className="absolute bottom-64 left-44 h-28 w-24 rounded-[10px] border border-softgold/70 bg-white/60" />
          <div className="absolute bottom-28 left-0 right-0 h-52 bg-gradient-to-t from-[#dcc5a7]/75 to-transparent" />
          <div className="absolute bottom-20 left-24 h-36 w-60 -rotate-12 rounded-[42px] border border-softgold/70 bg-white/50" />
          <div className="absolute bottom-20 left-64 h-24 w-28 rounded-[24px] border border-softgold/60 bg-white/45" />
          <div className="absolute bottom-36 left-10 h-32 w-24 rounded-t-full bg-[#89956e]/35" />

          <div className="relative mt-auto space-y-6">
            <TrustItem icon={<ShieldCheck className="h-7 w-7" />} title="Secure & Private" text="Your data is encrypted and always protected." />
            <TrustItem icon={<UserRound className="h-7 w-7" />} title="Built for Clinics" text="Designed to simplify your daily workflow." />
            <TrustItem icon={<HeartHandshake className="h-7 w-7" />} title="Better Patient Care" text="Everything you need to deliver exceptional care." />
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center lg:min-h-0">
          <div className="w-full max-w-[640px]">
            <div className="mb-10 flex items-center justify-center lg:hidden">
              <Logo />
            </div>

            <div className="rounded-[28px] border border-softgold/50 bg-white/86 p-6 shadow-soft backdrop-blur sm:p-12 lg:p-16">
              <div className="text-center">
                <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-linen text-gold">
                  <Logo compact />
                </div>
                <h2 className="mt-8 text-4xl font-bold tracking-tight text-ink">Clinic Login</h2>
                <p className="mt-4 text-lg text-muted">Please enter your credentials to continue</p>
              </div>

              <form
                className="mt-12 space-y-7"
                action="/clinic"
                method="post"
                onSubmit={handleSubmit}
              >
                <label className="block">
                  <span className="mb-3 block text-lg font-semibold text-ink">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-muted" />
                    <input
                      name="login"
                      required
                      value={login}
                      onChange={(event) => {
                        setLogin(event.target.value);
                        setError("");
                      }}
                      className="h-16 w-full rounded-2xl border border-softgold/70 bg-white px-14 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-gold focus:ring-4 focus:ring-softgold/30"
                      placeholder="Enter your clinic email"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-3 block text-lg font-semibold text-ink">Password</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-muted" />
                    <input
                      name="password"
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setError("");
                      }}
                      className="h-16 w-full rounded-2xl border border-softgold/70 bg-white px-14 pr-14 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-gold focus:ring-4 focus:ring-softgold/30"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-linen hover:text-ink"
                    >
                      <Eye className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="mt-4 text-right">
                    <a href="#" className="text-base font-semibold text-gold">Forgot password?</a>
                  </div>
                </label>

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                ) : null}

                <button type="submit" disabled={isSubmitting} className="flex min-h-[70px] w-full items-center justify-center gap-4 rounded-2xl bg-ink px-6 text-xl font-bold text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? "Signing In..." : "Sign In"}
                  <ArrowRight className="h-8 w-8" />
                </button>
              </form>

              <div className="mt-24 flex items-center justify-center gap-4 text-center text-sm text-muted">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-softgold/60 bg-white text-gold">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <p>
                  Secure login powered by<br />
                  <span className="font-semibold text-gold">Heal Dental Clinic</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function TrustItem({
  icon,
  title,
  text
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-4 border-b border-softgold/60 pb-6 last:border-b-0">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-linen text-gold">
        {icon}
      </span>
      <span>
        <span className="block text-lg font-bold text-ink">{title}</span>
        <span className="mt-1 block text-base leading-7 text-muted">{text}</span>
      </span>
    </div>
  );
}
