import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ListFilter, Plus, CalendarRange } from "lucide-react";
import { AgendaForm } from "@/components/agenda-form";
import { DataPage, type DataColumn } from "@/components/data-page";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VencimentoForm } from "@/components/vencimento-form";
import { VencimentosCalendar } from "@/components/vencimentos-calendar";
import { supabase } from "@/integrations/supabase/client";
import { fetchDiasAlerta } from "@/lib/queries";
import { formatDate, situacaoVencimento, SITUACAO_LABEL } from "@/lib/format";
import type { Row } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/_app/vencimentos")({ head: () => ({ meta: [{ title: "Vencimentos e Agenda — Controle de Frota" }, { name: "description", content: "Prazos documentais e agenda operacional da frota." }, { property: "og:title", content: "Vencimentos e Agenda — Controle de Frota" }, { property: "og:description", content: "Prazos documentais e agenda operacional da frota." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: DeadlinesPage });
function DeadlinesPage() {
  const { data } = useQuery({ queryKey: ["vencimentos-agenda"], queryFn: async () => { const [v, a, cars] = await Promise.all([supabase.from("vencimentos").select("*").order("data_vencimento"), supabase.from("agenda_eventos").select("*").order("data"), supabase.from("veiculos").select("id, placa, status").order("placa")]); const err = v.error || a.error || cars.error; if (err) throw err; const allVehicles = cars.data ?? []; return { vencimentos: v.data ?? [], agenda: a.data ?? [], vehicles: allVehicles.filter(c => c.status !== "VENDIDO"), plates: new Map(allVehicles.map(c => [c.id, c.placa])) }; } });
  const { data: diasAlerta = 30 } = useQuery({ queryKey: ["dias-alerta"], queryFn: fetchDiasAlerta, staleTime: 5 * 60_000 });
  const deadlineCols = useMemo<DataColumn<Row<"vencimentos">>[]>(() => [{ label: "Veículo", value: r => r.veiculo_id ? data?.plates.get(r.veiculo_id) ?? "—" : "—" }, { label: "Tipo", value: r => r.descricao || r.tipo_codigo || "—" }, { label: "Vencimento", value: r => formatDate(r.data_vencimento) }, { label: "Responsável", value: r => r.responsavel || "—" }, { label: "Situação", value: r => <StatusBadge value={SITUACAO_LABEL[situacaoVencimento(r.data_vencimento, r.status, diasAlerta)]} /> }], [data, diasAlerta]);
  const agendaCols = useMemo<DataColumn<Row<"agenda_eventos">>[]>(() => [{ label: "Data", value: r => formatDate(r.data) }, { label: "Hora", value: r => r.hora?.slice(0,5) || "—" }, { label: "Atividade", value: r => r.titulo || r.atividade }, { label: "Veículo", value: r => r.veiculo_id ? data?.plates.get(r.veiculo_id) ?? "—" : "—" }, { label: "Responsável", value: r => r.responsavel || "—" }, { label: "Status", value: r => <StatusBadge value={r.status} /> }], [data]);
  const vehicles = data?.vehicles ?? [];
  return <><PageHeader title="Vencimentos e Agenda" description="Controle de prazos e compromissos operacionais." /><Tabs defaultValue="calendario"><TabsList><TabsTrigger value="calendario"><CalendarRange className="mr-2 size-4" />Calendário</TabsTrigger><TabsTrigger value="vencimentos"><ListFilter className="mr-2 size-4" />Vencimentos</TabsTrigger><TabsTrigger value="agenda"><CalendarDays className="mr-2 size-4" />Agenda</TabsTrigger></TabsList><TabsContent value="calendario"><VencimentosCalendar vencimentos={data?.vencimentos ?? []} plates={data?.plates ?? new Map()} diasAlerta={diasAlerta} /></TabsContent><TabsContent value="vencimentos"><DataPage rows={data?.vencimentos ?? []} columns={deadlineCols} actions={<VencimentoForm vehicles={vehicles} trigger={<Button size="sm"><Plus className="mr-2 size-4" />Novo vencimento</Button>} />} /></TabsContent><TabsContent value="agenda"><DataPage rows={data?.agenda ?? []} columns={agendaCols} actions={<AgendaForm vehicles={vehicles} trigger={<Button size="sm"><Plus className="mr-2 size-4" />Novo evento</Button>} />} /></TabsContent></Tabs></>;
}