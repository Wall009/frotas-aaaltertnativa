import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ value }: { value?: string | null }) {
  const normalized = (value ?? "—").toUpperCase();
  const tone = normalized.includes("VENCID") || normalized.includes("CANCEL") || normalized.includes("INDEFERID")
    ? "border-transparent bg-destructive/12 text-destructive"
    : normalized.includes("PRÓXIM") || normalized.includes("PROXIM") || normalized.includes("PROCESSO") || normalized.includes("AGEND") || normalized.includes("PENDENTE") || normalized.includes("ANALISE") || normalized.includes("ANÁLISE") || normalized.includes("RECURSO")
      ? "border-transparent bg-warning/20 text-warning-foreground"
      : normalized.includes("ATIVO") || normalized.includes("VALIDADE") || normalized.includes("CONCLU") || normalized.includes("REGULAR") || normalized.includes("PAGA") || normalized.includes("ENCERRAD") || normalized.includes("DEFERID")
        ? "border-transparent bg-success/15 text-success"
        : "border-transparent bg-neutralbadge text-neutralbadge-foreground";
  return <Badge variant="outline" className={cn("whitespace-nowrap", tone)}>{value || "—"}</Badge>;
}