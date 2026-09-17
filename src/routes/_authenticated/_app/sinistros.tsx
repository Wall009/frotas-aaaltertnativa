import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { DataPage, type DataColumn } from "@/components/data-page";
import { PageHeader } from "@/components/page-header";
import { SinistroForm } from "@/components/sinistro-form";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Row } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/_app/sinistros")({ head: () => ({ meta: [{ title: "Sinistros — Controle de Frota" }, { name: "description", content: "Acompanhamento de sinistros, seguros e reparações." }, { property: "og:title", content: "Sinistros — Controle de Frota" }, { property: "og:description", content: "Acompanhamento de sinistros, seguros e reparações." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: ClaimsPage });
function ClaimsPage() {
  const { data } = useQuery({ queryKey: ["sinistros"], queryFn: async () => { const [rows, cars] = await Promise.all([supabase.from("sinistros").select("*").order("data", { ascending: false }), supabase.from("veiculos").select("id, placa").order("placa")]); if (rows.error || cars.error) throw rows.error || cars.error; const vehicles = cars.data ?? []; return { rows: rows.data ?? [], vehicles, plates: new Map(vehicles.map(c => [c.id, c.placa])) }; } });
  const cols = useMemo<DataColumn<Row<"sinistros">>[]>(() => [{ label: "Data", value: r => formatDate(r.data) }, { label: "Veículo", value: r => r.veiculo_id ? data?.plates.get(r.veiculo_id) ?? "—" : "—" }, { label: "Tipo", value: r => r.tipo || "—" }, { label: "Local", value: r => r.local || "—" }, { label: "Seguradora", value: r => r.seguradora || "—" }, { label: "Valor final", value: r => formatCurrency(r.valor_final) }, { label: "Status", value: r => <StatusBadge value={r.status} /> }], [data]);
  return <><PageHeader title="Sinistros" description="Ocorrências, acompanhamento do seguro e reparação dos veículos." /><DataPage rows={data?.rows ?? []} columns={cols} actions={<SinistroForm vehicles={data?.vehicles ?? []} trigger={<Button size="sm"><Plus className="mr-2 size-4" />Novo sinistro</Button>} />} /></>;
}