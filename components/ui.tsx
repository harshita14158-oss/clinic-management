import { LucideIcon } from "lucide-react";
import { HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>) {
  return (
    <section {...props} className={`rounded-[28px] border border-softgold/55 bg-paper shadow-card ${className}`}>
      {children}
    </section>
  );
}

export function Button({
  children,
  variant = "dark",
  className = "",
  onClick,
  type = "button"
}: {
  children: ReactNode;
  variant?: "dark" | "gold" | "light";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const styles = {
    dark: "bg-ink text-white shadow-soft hover:bg-black",
    gold: "bg-gold text-white shadow-soft hover:bg-[#A57438]",
    light: "border border-softgold/70 bg-white/70 text-ink hover:bg-white"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconCircle({
  icon: Icon,
  tone = "gold"
}: {
  icon: LucideIcon;
  tone?: "gold" | "green" | "blue" | "purple" | "red";
}) {
  const tones = {
    gold: "bg-linen text-gold",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-sky-50 text-sky-700",
    purple: "bg-violet-50 text-violet-700",
    red: "bg-red-50 text-red-700"
  };
  return (
    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${tones[tone]}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-12 w-full rounded-2xl border border-softgold/70 bg-white/75 px-4 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-gold focus:ring-4 focus:ring-softgold/30";

export const textareaClass =
  "min-h-24 w-full rounded-2xl border border-softgold/70 bg-white/75 p-4 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-gold focus:ring-4 focus:ring-softgold/30";
