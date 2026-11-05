import { StatusBadge } from "@/components/ui/Badge";
import { shortDate } from "@/lib/format";

export interface TimelineItem {
  old_status: string | null;
  new_status: string;
  changed_at: string;
  note: string | null;
  changed_by?: string | null;
}

/** Status history written by trg_vuln_history_ai / trg_vuln_history_au. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) return <p className="text-sm text-muted">No history yet.</p>;
  return (
    <ol className="relative ml-2 border-l border-line">
      {items.map((h, i) => (
        <li key={i} className="mb-4 ml-4">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-line bg-panel-2" />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {h.old_status ? (
              <>
                <StatusBadge value={h.old_status} />
                <span className="text-muted">to</span>
              </>
            ) : null}
            <StatusBadge value={h.new_status} />
            <span className="text-xs text-muted">{shortDate(h.changed_at)}</span>
            {h.changed_by ? <span className="text-xs text-muted">by {h.changed_by}</span> : null}
          </div>
          {h.note ? <p className="mt-1 text-sm text-muted">{h.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}
