import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DataPage, type DataColumn } from "@/components/data-page";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Row } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/_app/manutencao")({ head: () => ({ meta: [{ title: "Manutenção — Controle de Frota" }, { name: "description", content: "Ordens e acompanhamento de manutenção da frota." }, { property: "og:title", content: "Manutenção — Controle de Frota" }, { property: "og:description", content: "Ordens e acompanhamento de manutenção da frota." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: MaintenancePage });
function MaintenancePage() {
  const { data } = useQuery({ queryKey: ["manutencoes"], queryFn: async () => { const [rows, cars] = await Promise.all([supabase.from("manutencoes").select("*").order("data_abertura", { ascending: false }), supabase.from("veiculos").select("id, placa")]); if (rows.error || cars.error) throw rows.error || cars.error; return { rows: rows.data ?? [], plates: new Map((cars.data ?? []).map(c => [c.id, c.placa])) }; } });
  const cols = useMemo<DataColumn<Row<"manutencoes">>[]>(() => [{ label: "Veículo", value: r => r.veiculo_id ? data?.plates.get(r.veiculo_id) ?? "—" : "—" }, { label: "Tipo / problema", value: r => <div><p className="font-medium">{r.tipo || "Manutenção"}</p><p className="max-w-72 truncate text-xs text-muted-foreground">{r.problema || "—"}</p></div> }, { label: "Abertura", value: r => formatDate(r.data_abertura) }, { label: "Previsão", value: r => formatDate(r.previsao_saida) }, { label: "Oficina", value: r => r.oficina || "—" }, { label: "Custo", value: r => formatCurrency(r.custo) }, { label: "Status", value: r => <StatusBadge value={r.status} /> }], [data]);
  return <><PageHeader title="Manutenção" description="Ordens de serviço, prazos, oficinas e custos da frota." /><DataPage rows={data?.rows ?? []} columns={cols} /></>;
}