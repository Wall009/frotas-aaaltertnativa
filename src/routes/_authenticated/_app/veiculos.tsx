import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataPage, type DataColumn } from "@/components/data-page";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { VehicleForm } from "@/components/vehicle-form";
import { supabase } from "@/integrations/supabase/client";
import type { Row } from "@/lib/db";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_app/veiculos")({ head: () => ({ meta: [{ title: "Veículos — Controle de Frota" }, { name: "description", content: "Cadastro e consulta completa dos veículos da frota." }, { property: "og:title", content: "Veículos — Controle de Frota" }, { property: "og:description", content: "Cadastro e consulta completa dos veículos da frota." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: VehiclesPage });
function VehiclesPage() {
  const navigate = useNavigate(); const { data = [], isLoading } = useQuery({ queryKey: ["veiculos"], queryFn: async () => { const r = await supabase.from("veiculos").select("*").order("placa"); if (r.error) throw r.error; return r.data; } });
  const columns = useMemo<DataColumn<Row<"veiculos">>[]>(() => [{ label: "Placa", value: r => <span className="font-semibold">{r.placa}</span> }, { label: "Marca / modelo", value: r => r.marca_modelo || [r.marca, r.modelo].filter(Boolean).join(" ") || "—" }, { label: "Tipo", value: r => r.tipo_veiculo || "—" }, { label: "Ano", value: r => r.ano_modelo || r.ano_fabricacao || "—" }, { label: "Unidade", value: r => r.unidade || "—" }, { label: "Quilometragem", value: r => r.quilometragem ? `${formatNumber(r.quilometragem, 0)} km` : "—" }, { label: "Status", value: r => <StatusBadge value={r.status} /> }], []);
  return <><PageHeader title="Veículos" description={isLoading ? "Carregando frota…" : `${data.length} veículos cadastrados, incluindo o histórico de vendidos.`} actions={<VehicleForm trigger={<Button><Plus />Novo veículo</Button>} />} /><DataPage rows={data} columns={columns} onRowClick={row => navigate({ to: "/veiculos/$veiculoId", params: { veiculoId: row.id } })} /></>;
}