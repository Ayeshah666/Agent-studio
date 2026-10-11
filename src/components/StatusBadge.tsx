import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  active: "bg-success-soft text-success",
  paused: "bg-warning-soft text-warning",
  draft: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", STYLES[status] ?? STYLES["draft"])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
