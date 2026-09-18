import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarDays, FileClock, Paperclip, ShieldAlert, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CentralPendencias({ vencidos, proximos, agendadas, sinistros, manutencoes, anexos }: {
  vencidos: number; proximos: number; agendadas: number; sinistros: number; manutencoes: number; anexos: number;
}) {
  const itens = [
    { icon: AlertTriangle, tone: "text-destructive", label: `${vencidos} documento${vencidos === 1 ? "" : "s"} vencido${vencidos === 1 ? "" : "s"}`, to: "/vencimentos" as const },
    { icon: FileClock, tone: "text-warning-foreground", label: `${proximos} documento${proximos === 1 ? "" : "s"} vencendo em 30 dias`, to: "/vencimentos" as const },
    { icon: CalendarDays, tone: "text-info", label: `${agendadas} atividade${agendadas === 1 ? "" : "s"} agendada${agendadas === 1 ? "" : "s"}`, to: "/vencimentos" as const },
    { icon: ShieldAlert, tone: "text-destructive", label: `${sinistros} sinistro${sinistros === 1 ? "" : "s"} em andamento`, to: "/sinistros" as const },
    { icon: Wrench, tone: "text-primary", label: `${manutencoes} veículo${manutencoes === 1 ? "" : "s"} em manutenção`, to: "/manutencao" as const },
    { icon: Paperclip, tone: "text-muted-foreground", label: `${anexos} documento${anexos === 1 ? "" : "s"} anexado${anexos === 1 ? "" : "s"} no sistema`, to: "/vencimentos" as const },
  ];
  return (
    <Card className="rounded-lg border-warning/40 bg-warning/5 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-4 text-warning-foreground" />
          Central de Pendências
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2">
          {itens.map((item) => (
            <li key={item.label}>
              <Link to={item.to} className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-2.5 text-sm transition-colors hover:bg-muted">
                <item.icon className={`size-4 shrink-0 ${item.tone}`} />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <Button asChild size="sm" variant="outline">
            <Link to="/vencimentos">Ver pendências</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
