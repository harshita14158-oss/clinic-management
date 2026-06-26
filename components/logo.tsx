import { ShieldCheck } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex max-w-max items-center gap-3 overflow-hidden">
      <div className="relative h-10 w-8 shrink-0 overflow-hidden">
        <svg
          width="32"
          height="40"
          viewBox="0 0 48 56"
          className="block h-10 max-h-10 w-8 max-w-8 overflow-hidden"
          aria-hidden="true"
        >
          <path
            d="M15 4c3.8 0 6.7 1.7 9 5 2.3-3.3 5.2-5 9-5 9 0 14.8 8.8 11 18L33.6 48.5c-1.8 4.5-8.3 3.2-8.1-1.6l.8-14.6c.2-3.8-2.8-7-6.6-7h-.2c-3.8 0-6.8 3.2-6.6 7l.8 14.6c.2 4.8-6.3 6.1-8.1 1.6L-4.9 22C-8.5 12.8-2.7 4 6.3 4c3.8 0 6.7 1.7 8.7 5 0 0 .8-5 0-5Z"
            transform="translate(4 2)"
            fill="none"
            stroke="#B98543"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {!compact && (
        <div>
          <div className="font-serif text-3xl font-semibold leading-none tracking-[0.16em] text-ink">HEAL</div>
          <div className="text-[10px] font-semibold tracking-[0.34em] text-ink">DENTAL CLINIC</div>
        </div>
      )}
    </div>
  );
}

export function SecureBadge() {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-ink">
      <ShieldCheck className="h-5 w-5" />
      <span>Secure & Private</span>
    </div>
  );
}
