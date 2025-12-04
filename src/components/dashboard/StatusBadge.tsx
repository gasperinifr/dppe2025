import { cn } from "@/lib/utils";
import { SITUACAO_COLORS } from "@/types/projeto";

interface StatusBadgeProps {
  situacao: string;
  className?: string;
}

export function StatusBadge({ situacao, className }: StatusBadgeProps) {
  const colorClass = SITUACAO_COLORS[situacao] || "bg-muted text-muted-foreground";
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
        colorClass,
        className
      )}
    >
      {situacao}
    </span>
  );
}
