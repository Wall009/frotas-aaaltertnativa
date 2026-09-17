import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, situacaoVencimento, SITUACAO_LABEL, toISODate } from "@/lib/format";
import type { Row } from "@/lib/db";

type Vencimento = Row<"vencimentos">;

export function VencimentosCalendar({ vencimentos, plates }: { vencimentos: Vencimento[]; plates: Map<string, string> }) {
  const byDay = useMemo(() => {
    const map = new Map<string, Vencimento[]>();
    for (const v of vencimentos) {
      if (!v.data_vencimento) continue;
      const key = v.data_vencimento.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(v);
      map.set(key, list);
    }
    return map;
  }, [vencimentos]);

  const dayStatus = useMemo(() => {
    const map = new Map<string, "VENCIDO" | "PROXIMO" | "OK">();
    for (const [key, items] of byDay) {
      let status: "VENCIDO" | "PROXIMO" | "OK" = "OK";
      for (const v of items) {
        const s = situacaoVencimento(v.data_vencimento, v.status);
        if (s === "VENCIDO") { status = "VENCIDO"; break; }
        if (s === "PROXIMO DO VENCIMENTO") status = "PROXIMO";
      }
      map.set(key, status);
    }
    return map;
  }, [byDay]);

  const toDate = (key: string) => {
    const parts = key.split("-");
    const y = Number(parts[0] ?? 0);
    const m = Number(parts[1] ?? 1);
    const d = Number(parts[2] ?? 1);
    return new Date(y, m - 1, d);
  };

  const [selected, setSelected] = useState<Date>(() => new Date());
  const selectedKey = toISODate(selected);
  const dayItems = byDay.get(selectedKey) ?? [];

  const vencidas = Array.from(dayStatus.entries()).filter(([, s]) => s === "VENCIDO").map(([k]) => toDate(k));
  const proximas = Array.from(dayStatus.entries()).filter(([, s]) => s === "PROXIMO").map(([k]) => toDate(k));
  const ok = Array.from(dayStatus.entries()).filter(([, s]) => s === "OK").map(([k]) => toDate(k));

  return (
    <Card className="rounded-lg shadow-card">
      <CardContent className="grid gap-6 p-4 md:grid-cols-[auto_1fr]">
        <div>
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => d && setSelected(d)}
            modifiers={{ vencido: vencidas, proximo: proximas, ok }}
            modifiersClassNames={{
              vencido: "bg-destructive/15 text-destructive font-semibold rounded-md",
              proximo: "bg-amber-100 text-amber-800 font-semibold rounded-md dark:bg-amber-950 dark:text-amber-300",
              ok: "bg-emerald-50 text-emerald-700 rounded-md dark:bg-emerald-950 dark:text-emerald-300",
            }}
          />
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-destructive/60" />Vencido</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-amber-400" />Próximo</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-400" />Dentro da validade</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarClock className="size-4 text-muted-foreground" />
            Vencimentos em {formatDate(selectedKey)}
          </div>
          {dayItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum vencimento nessa data.</p>
          ) : (
            <ul className="space-y-2">
              {dayItems.map(v => (
                <li key={v.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div>
                    <div className="font-medium">{v.veiculo_id ? plates.get(v.veiculo_id) ?? "—" : "—"} · {v.descricao || v.tipo_codigo || "—"}</div>
                    {v.responsavel && <div className="text-xs text-muted-foreground">Responsável: {v.responsavel}</div>}
                  </div>
                  <StatusBadge value={SITUACAO_LABEL[situacaoVencimento(v.data_vencimento, v.status)]} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
