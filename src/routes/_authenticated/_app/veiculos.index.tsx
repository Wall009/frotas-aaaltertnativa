import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CarFront, CircleDollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataPage, type DataColumn } from "@/components/data-page";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleCardGrid } from "@/components/vehicle-card-grid";
import { VehicleForm } from "@/components/vehicle-form";
import { supabase } from "@/integrations/supabase/client";
import type { Row } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_app/veiculos/")({ head: () => ({ meta: [{ title: "Veículos — Controle de Frota" }, { name: "description", content: "Cadastro e consulta completa dos veículos da frota." }, { property: "og:title", content: "Veículos — Controle de Frota" }, { property: "og:description", content: "Cadastro e consulta completa dos veículos da frota." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: VehiclesPage });
function VehiclesPage() {
  const navigate = useNavigate(); const { data = [], isLoading } = useQuery({ queryKey: ["veiculos"], queryFn: async () => { const r = await supabase.from("veiculos").select("*").order("placa"); if (r.error) throw r.error; return r.data; } });
  const ativos = useMemo(() => data.filter(v => v.status !== "VENDIDO"), [data]);
  const vendidos = useMemo(() => data.filter(v => v.status === "VENDIDO"), [data]);
  const vendidosColumns = useMemo<DataColumn<Row<"veiculos">>[]>(() => [{ label: "Placa", value: r => <span className="font-semibold">{r.placa}</span> }, { label: "Marca / modelo", value: r => r.marca_modelo || [r.marca, r.modelo].filter(Boolean).join(" ") || "—" }, { label: "Data da venda", value: r => formatDate(r.data_venda) }, { label: "Comprador", value: r => r.comprador || "—" }, { label: "Valor", value: r => formatCurrency(r.valor_venda) }, { label: "Motivo", value: r => r.motivo_venda || "—" }], []);
  const goTo = (row: Row<"veiculos">) => navigate({ to: "/veiculos/$veiculoId", params: { veiculoId: row.id } });
  return <><PageHeader title="Veículos" description={isLoading ? "Carregando frota…" : `${ativos.length} ativos · ${vendidos.length} vendidos`} actions={<VehicleForm trigger={<Button><Plus />Novo veículo</Button>} />} /><Tabs defaultValue="ativos"><TabsList><TabsTrigger value="ativos"><CarFront className="mr-2 size-4" />Frota ativa ({ativos.length})</TabsTrigger><TabsTrigger value="vendidos"><CircleDollarSign className="mr-2 size-4" />Vendidos ({vendidos.length})</TabsTrigger></TabsList><TabsContent value="ativos"><VehicleCardGrid vehicles={ativos} onSelect={goTo} /></TabsContent><TabsContent value="vendidos"><DataPage rows={vendidos} columns={vendidosColumns} onRowClick={goTo} empty="Nenhum veículo vendido até o momento." /></TabsContent></Tabs></>;
}