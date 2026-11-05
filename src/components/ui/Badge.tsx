const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-accent/15 text-accent border-accent/30",
  TRIAGED: "bg-warn/15 text-warn border-warn/30",
  ACCEPTED: "bg-ok/15 text-ok border-ok/30",
  REJECTED: "bg-muted/15 text-muted border-muted/30",
  DUPLICATE: "bg-accent-2/15 text-accent-2 border-accent-2/30",
  ACTIVE: "bg-ok/15 text-ok border-ok/30",
  PAUSED: "bg-warn/15 text-warn border-warn/30",
  CLOSED: "bg-muted/15 text-muted border-muted/30",
  PENDING: "bg-warn/15 text-warn border-warn/30",
  VERIFIED: "bg-ok/15 text-ok border-ok/30",
  FAILED: "bg-bad/15 text-bad border-bad/30",
  COMPLETED: "bg-ok/15 text-ok border-ok/30",
  DONE: "bg-ok/15 text-ok border-ok/30",
  ADMIN: "bg-accent/15 text-accent border-accent/30",
  RESEARCHER: "bg-accent-2/15 text-accent-2 border-accent-2/30",
};

const SEVERITY_STYLES: Record<string, string> = {
  LOW: "bg-muted/15 text-muted border-muted/30",
  MEDIUM: "bg-warn/15 text-warn border-warn/30",
  HIGH: "bg-bad/15 text-bad border-bad/30",
  CRITICAL: "bg-crit/20 text-crit border-crit/40",
};

function Pill({ value, styles }: { value: string | null | undefined; styles: Record<string, string> }) {
  if (!value) return <span className="text-muted">-</span>;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${
        styles[value] ?? "border-line text-muted"
      }`}
    >
      {value}
    </span>
  );
}

export function StatusBadge({ value }: { value: string | null | undefined }) {
  return <Pill value={value} styles={STATUS_STYLES} />;
}

export function SeverityBadge({ value }: { value: string | null | undefined }) {
  return <Pill value={value} styles={SEVERITY_STYLES} />;
}
