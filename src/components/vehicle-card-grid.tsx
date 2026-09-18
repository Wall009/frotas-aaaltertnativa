import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import type { Row } from "@/lib/db";
import { formatNumber } from "@/lib/format";

type Veiculo = Row<"veiculos">;

export function VehicleCardGrid({ vehicles, onSelect }: { vehicles: Veiculo[]; onSelect: (v: Veiculo) => void }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("pt-BR");
    if (!q) return vehicles;
    return vehicles.filter(v => [v.placa, v.marca_modelo, v.marca, v.modelo, v.renavam].some(field => (field ?? "").toLocaleLowerCase("pt-BR").includes(q)));
  }, [vehicles, search]);

  const groups = useMemo(() => {
    const map = new Map<string, Veiculo[]>();
    for (const v of filtered) {
      const key = v.tipo_veiculo?.trim() || "Sem tipo definido";
      const list = map.get(key) ?? [];
      list.push(v);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Buscar placa, marca ou modelo…" />
      </div>
      {groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nenhum veículo encontrado.</p>
      ) : (
        groups.map(([tipo, list]) => (
          <div key={tipo}>
            <div className="mb-3 flex items-baseline gap-2">
              <h3 className="text-sm font-semibold">{tipo}</h3>
              <span className="text-xs text-muted-foreground">{list.length} veículo{list.length === 1 ? "" : "s"}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {list.map(v => (
                <button key={v.id} onClick={() => onSelect(v)} className="text-left">
                  <Card className="h-full rounded-lg shadow-card transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-base font-bold tracking-wide">{v.placa}</span>
                        <StatusBadge value={v.status} />
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{v.marca_modelo || [v.marca, v.modelo].filter(Boolean).join(" ") || "Sem descrição"}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {v.ano_modelo || v.ano_fabricacao || "—"}{v.quilometragem ? ` · ${formatNumber(v.quilometragem, 0)} km` : ""}
                      </p>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
