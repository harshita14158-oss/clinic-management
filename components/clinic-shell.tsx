"use client";

import {
  BarChart3,
  CalendarDays,
  FileArchive,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Stethoscope,
  User,
  Users
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Logo } from "./logo";
import { defaultClinicSettings, loadClinicSettings } from "@/lib/clinic-settings";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/clinic/dashboard" },
  { label: "Patients", icon: Users, href: "/clinic/dashboard" },
  { label: "Calendar", icon: CalendarDays, href: "/clinic/calendar" },
  { label: "Pending Treatments", icon: Stethoscope, href: "/clinic/dashboard" },
  { label: "Invoices", icon: ReceiptText, href: "/clinic/dashboard" },
  { label: "Documents", icon: FileArchive, href: "/clinic/dashboard" },
  { label: "Settings", icon: Settings, href: "/clinic/settings" }
];

export function ClinicShell({
  active = "Dashboard",
  children
}: {
  active?: string;
  children: ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [settings, setSettings] = useState(defaultClinicSettings);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setSettings(loadClinicSettings());
    const session = window.localStorage.getItem("healDentalClinicSession");

    if (!session) {
      window.location.replace("/clinic");
      return;
    }

    setIsAuthorized(true);
  }, []);

  function handleLogout() {
    window.localStorage.removeItem("healDentalClinicSession");
    window.location.replace("/clinic");
  }

  if (!isAuthorized) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper/80 px-6 text-center">
        <div className="rounded-3xl border border-softgold/60 bg-white/85 p-8 shadow-soft">
          <Logo />
          <p className="mt-6 text-sm font-semibold text-muted">Checking clinic access...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper/80">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-softgold/50 bg-white/55 p-6 lg:block">
          <a href="/clinic/dashboard" aria-label="Open clinic dashboard">
            <Logo />
          </a>
          <nav className="mt-10 space-y-2">
            {nav.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
                  active === label ? "bg-linen text-ink shadow-card" : "text-muted hover:bg-linen/50"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </a>
            ))}
          </nav>
          <div className="mt-20 rounded-3xl border border-softgold/60 bg-linen/60 p-5">
            <Home className="h-8 w-8 text-gold" />
            <p className="mt-4 font-bold">Need Help?</p>
            <p className="mt-2 text-sm leading-6 text-muted">We&apos;re here to support you.</p>
            <p className="mt-4 text-sm font-semibold">+91 {settings.phone}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-softgold/70 bg-white/75 px-4 text-sm font-semibold text-ink transition hover:bg-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>
        <section>
          <div className="flex items-center justify-between border-b border-softgold/50 bg-white/65 px-4 py-4 lg:hidden">
            <a href="/clinic/dashboard" aria-label="Open clinic dashboard">
              <Logo />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="rounded-2xl border border-softgold/70 p-3"
              aria-label="Open clinic menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          {mobileMenuOpen && (
            <nav className="grid gap-2 border-b border-softgold/50 bg-white/90 p-4 shadow-card lg:hidden">
              {nav.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${
                    active === label ? "bg-linen text-ink" : "text-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </a>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </nav>
          )}
          {children}
        </section>
      </div>
    </main>
  );
}

export const profileTabs = [
  "Case Overview",
  "Clinical Notes",
  "Prescriptions",
  "Invoices",
  "Documents",
  "Timeline"
];

export const quickActions = [
  { label: "Add Clinical Note", icon: FileText },
  { label: "Add Prescription", icon: User },
  { label: "Upload Document", icon: FileArchive },
  { label: "Generate Invoice", icon: ReceiptText },
  { label: "Reports", icon: BarChart3 }
];
