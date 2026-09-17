import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DataPage, type DataColumn } from "@/components/data-page";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Row } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/_app/dados-complementares")({
  head: () => ({ meta: [
    { title: "Dados complementares — Controle de Frota" },
    { name: "description", content: "Valores negociados e veículos flutuantes importados da fonte original." },
    { property: "og:title", content: "Dados complementares — Controle de Frota" },
    { property: "og:description", content: "Valores negociados e veículos flutuantes importados da fonte original." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ComplementaryDataPage,
});

function ComplementaryDataPage() {
  const { data } = useQuery({ queryKey: ["dados-complementares"], queryFn: async () => {
    const [values, floating] = await Promise.all([
      supabase.from("valores_negociados").select("*").order("descricao"),
      supabase.from("flutuante").select("*").order("data_entrada", { ascending: false }),
    ]);
    if (values.error || floating.error) throw values.error || floating.error;
    return { values: values.data ?? [], floating: floating.data ?? [] };
  } });
  const valueColumns = useMemo<DataColumn<Row<"valores_negociados">>[]>(() => [
    { label: "Descrição", value: row => <span className="font-medium">{row.descricao}</span> },
    { label: "Ano", value: row => row.ano ?? "—" },
    { label: "Valor", value: row => formatCurrency(row.valor) },
    { label: "Observações", value: row => row.observacoes || "—" },
  ], []);
  const floatingColumns = useMemo<DataColumn<Row<"flutuante">>[]>(() => [
    { label: "Placa", value: row => <span className="font-semibold">{row.placa || "—"}</span> },
    { label: "Proprietário", value: row => row.proprietario || "—" },
    { label: "Tipo", value: row => row.tipo_veiculo || "—" },
    { label: "Entrada", value: row => formatDate(row.data_entrada) },
    { label: "Saída", value: row => formatDate(row.data_saida) || row.data_saida_texto || "—" },
    { label: "Observações", value: row => row.observacoes || "—" },
  ], []);
  return <><PageHeader title="Dados complementares" description="Informações preservadas das abas Valores Negociados e Flutuante." /><Tabs defaultValue="valores" className="space-y-4"><TabsList><TabsTrigger value="valores">Valores negociados ({data?.values.length ?? 0})</TabsTrigger><TabsTrigger value="flutuante">Flutuante ({data?.floating.length ?? 0})</TabsTrigger></TabsList><TabsContent value="valores"><DataPage rows={data?.values ?? []} columns={valueColumns} /></TabsContent><TabsContent value="flutuante"><DataPage rows={data?.floating ?? []} columns={floatingColumns} /></TabsContent></Tabs></>;
}