import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ClipboardList, Plus, ScrollText, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataPage, type DataColumn } from "@/components/data-page";
import { MultaForm } from "@/components/multa-form";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { diasRestantes, formatCurrency, formatDate, STATUS_MULTA_LABEL, SITUACAO_CONDUTOR_LABEL } from "@/lib/format";
import type { Row } from "@/lib/db";

type MultaRow = Row<"multas"> & { veiculos: { placa: string } | null };

export const Route = createFileRoute("/_authenticated/_app/multas")({ head: () => ({ meta: [{ title: "Multas — Controle de Frota" }, { name: "description", content: "Infrações, indicação de condutor, pagamentos e recursos." }, { property: "og:title", content: "Multas — Controle de Frota" }, { property: "og:description", content: "Infrações, indicação de condutor, pagamentos e recursos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: FinesPage });

function FinesPage() {
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({ queryKey: ["multas"], queryFn: async () => { const r = await supabase.from("multas").select("*, veiculos(placa)").order("data_infracao", { ascending: false }); if (r.error) throw r.error; return (r.data ?? []) as MultaRow[]; } });
  const { data: vehicles = [] } = useQuery({ queryKey: ["veiculos-lite"], queryFn: async () => { const r = await supabase.from("veiculos").select("id, placa").neq("status", "VENDIDO").order("placa"); if (r.error) throw r.error; return r.data ?? []; } });

  const pendentes = useMemo(() => data.filter(m => !["PAGA", "ENCERRADA", "CANCELADA"].includes(m.status)), [data]);
  const indicacao = useMemo(() => data.filter(m => m.situacao_condutor === "AGUARDANDO_INDICACAO" && !["ENCERRADA", "CANCELADA"].includes(m.status)), [data]);
  const vencidas = useMemo(() => data.filter(m => { const d = diasRestantes(m.data_vencimento); return d !== null && d < 0 && !["PAGA", "ENCERRADA", "CANCELADA"].includes(m.status); }), [data]);
  const pagamentos = useMemo(() => data.filter(m => ["AGUARDANDO_PAGAMENTO", "PAGA"].includes(m.status)), [data]);
  const recursos = useMemo(() => data.filter(m => ["EM_RECURSO", "RECURSO_DEFERIDO", "RECURSO_INDEFERIDO"].includes(m.status)), [data]);

  const goTo = (row: Row<"multas">) => navigate({ to: "/multas/$multaId", params: { multaId: row.id } });

  const baseCols: DataColumn<MultaRow>[] = [
    { label: "Placa", value: r => r.veiculos?.placa || "—" },
    { label: "Data", value: r => formatDate(r.data_infracao) },
    { label: "Infração", value: r => r.descricao_infracao || r.enquadramento || "—" },
    { label: "Condutor", value: r => SITUACAO_CONDUTOR_LABEL[r.situacao_condutor] ?? r.situacao_condutor },
    { label: "Status", value: r => <StatusBadge value={STATUS_MULTA_LABEL[r.status] ?? r.status} /> },
  ];
  const indicacaoCols: DataColumn<MultaRow>[] = [
    { label: "Placa", value: r => r.veiculos?.placa || "—" },
    { label: "Auto", value: r => r.numero_auto || "—" },
    { label: "Prazo", value: r => formatDate(r.prazo_indicacao) },
    { label: "Situação", value: r => { const d = diasRestantes(r.prazo_indicacao); const label = d === null ? "Sem prazo" : d < 0 ? "Prazo vencido" : d === 0 ? "Vence hoje" : d <= 3 ? `Urgente · ${d}d` : `${d} dias`; return <StatusBadge value={label} />; } },
  ];
  const pagamentosCols: DataColumn<MultaRow>[] = [
    { label: "Placa", value: r => r.veiculos?.placa || "—" },
    { label: "Auto", value: r => r.numero_auto || "—" },
    { label: "Valor atualizado", value: r => formatCurrency(r.valor_atualizado ?? r.valor_original) },
    { label: "Vencimento", value: r => formatDate(r.data_vencimento) },
    { label: "Status", value: r => <StatusBadge value={STATUS_MULTA_LABEL[r.status] ?? r.status} /> },
  ];
  const recursosCols: DataColumn<MultaRow>[] = [
    { label: "Placa", value: r => r.veiculos?.placa || "—" },
    { label: "Auto", value: r => r.numero_auto || "—" },
    { label: "Infração", value: r => r.descricao_infracao || r.enquadramento || "—" },
    { label: "Status", value: r => <StatusBadge value={STATUS_MULTA_LABEL[r.status] ?? r.status} /> },
  ];

  const cards = [
    ["Total", data.length, ClipboardList, "text-primary bg-primary/10"],
    ["Pendentes", pendentes.length, AlertTriangle, "text-warning-foreground bg-warning/20"],
    ["Indicação", indicacao.length, UserRound, "text-info bg-info/10"],
    ["Vencidas", vencidas.length, ScrollText, "text-destructive bg-destructive/10"],
  ] as const;

  return <>
    <PageHeader title="Multas" description={isLoading ? "Carregando…" : `${data.length} multas registradas.`} actions={<MultaForm vehicles={vehicles} trigger={<Button><Plus className="mr-2 size-4" />Nova multa</Button>} />} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value, Icon, tone]) => (
        <Card key={label} className="rounded-lg shadow-card">
          <CardContent className="flex items-center justify-between p-5">
            <div><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>
            <span className={`flex size-10 items-center justify-center rounded-md ${tone}`}><Icon className="size-5" /></span>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="mt-6">
      <Tabs defaultValue="todas">
        <TabsList>
          <TabsTrigger value="todas">Todas ({data.length})</TabsTrigger>
          <TabsTrigger value="pendentes">Pendentes ({pendentes.length})</TabsTrigger>
          <TabsTrigger value="indicacao">Indicação ({indicacao.length})</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos ({pagamentos.length})</TabsTrigger>
          <TabsTrigger value="recursos">Recursos ({recursos.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="todas"><DataPage rows={data} columns={baseCols} onRowClick={goTo} /></TabsContent>
        <TabsContent value="pendentes"><DataPage rows={pendentes} columns={baseCols} onRowClick={goTo} /></TabsContent>
        <TabsContent value="indicacao"><DataPage rows={indicacao} columns={indicacaoCols} onRowClick={goTo} empty="Nenhuma indicação pendente." /></TabsContent>
        <TabsContent value="pagamentos"><DataPage rows={pagamentos} columns={pagamentosCols} onRowClick={goTo} empty="Nenhuma multa aguardando pagamento." /></TabsContent>
        <TabsContent value="recursos"><DataPage rows={recursos} columns={recursosCols} onRowClick={goTo} empty="Nenhum recurso em andamento." /></TabsContent>
      </Tabs>
    </div>
  </>;
}
