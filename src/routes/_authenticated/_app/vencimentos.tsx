import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenCheck, CalendarDays, CalendarRange, ClipboardPen, Info, LayoutDashboard, ListFilter, ListTodo, Plus } from "lucide-react";
import { toast } from "sonner";
import { AgendaEventoDialog } from "@/components/agenda-evento-dialog";
import { AgendaForm } from "@/components/agenda-form";
import { AgendaPainel, type EventoLinha } from "@/components/agenda-painel";
import { DataPage, type DataColumn } from "@/components/data-page";
import { PageHeader } from "@/components/page-header";
import { PreencherDatas } from "@/components/preencher-datas";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VencimentoEditDialog } from "@/components/vencimento-edit-dialog";
import { VencimentoForm } from "@/components/vencimento-form";
import { VencimentosCalendar } from "@/components/vencimentos-calendar";
import { supabase } from "@/integrations/supabase/client";
import { fetchDiasAlerta } from "@/lib/queries";
import { daysUntil, formatDate, situacaoDocumento, SITUACAO_DOCUMENTO_LABEL, type SituacaoDocumento } from "@/lib/format";
import { fetchRegras, type DadosAnoVeiculo, type VencimentoRow } from "@/lib/validade";
import type { Row } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/_app/vencimentos")({ head: () => ({ meta: [{ title: "Vencimentos e Agenda — Controle de Frota" }, { name: "description", content: "Prazos documentais e agenda operacional da frota." }, { property: "og:title", content: "Vencimentos e Agenda — Controle de Frota" }, { property: "og:description", content: "Prazos documentais e agenda operacional da frota." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: DeadlinesPage });

type Filtro = "TODOS" | SituacaoDocumento;
type Linha = VencimentoRow & { situacao: SituacaoDocumento; dias: number | null };

// Ordem de urgência: o que precisa de ação aparece primeiro.
const ORDEM: Record<SituacaoDocumento, number> = { VENCIDO: 0, "PROXIMO DO VENCIMENTO": 1, "EM PROCESSO": 2, "SEM DATA": 3, "DENTRO DA VALIDADE": 4, "NAO SE APLICA": 5 };

const RESUMO: Array<{ key: SituacaoDocumento; titulo: string; cor: string }> = [
  { key: "VENCIDO", titulo: "Vencidos", cor: "text-destructive" },
  { key: "PROXIMO DO VENCIMENTO", titulo: "Próximos do vencimento", cor: "text-warning-foreground" },
  { key: "EM PROCESSO", titulo: "Em processo", cor: "text-info" },
  { key: "SEM DATA", titulo: "Sem data cadastrada", cor: "text-warning-foreground" },
  { key: "DENTRO DA VALIDADE", titulo: "Dentro da validade", cor: "text-success" },
];

const FILTROS: Array<{ key: Filtro; label: string }> = [
  { key: "TODOS", label: "Todos" },
  { key: "VENCIDO", label: "Vencidos" },
  { key: "PROXIMO DO VENCIMENTO", label: "Próximos" },
  { key: "EM PROCESSO", label: "Em processo" },
  { key: "SEM DATA", label: "Sem data" },
  { key: "DENTRO DA VALIDADE", label: "Em dia" },
  { key: "NAO SE APLICA", label: "Não se aplica" },
];

function detalheResumo(key: SituacaoDocumento, diasAlerta: number): string {
  switch (key) {
    case "VENCIDO": return "A data de vencimento já passou";
    case "PROXIMO DO VENCIMENTO": return `Vencem em até ${diasAlerta} dias`;
    case "EM PROCESSO": return "Renovação já iniciada";
    case "SEM DATA": return "Clique para preencher as datas";
    case "DENTRO DA VALIDADE": return `Vencem em mais de ${diasAlerta} dias`;
    case "NAO SE APLICA": return "Não exigido para o veículo";
  }
}

const CHAVE_DESTINO = "vencimentos:destino";
const ABAS = ["calendario", "vencimentos", "preencher", "agenda"];

// O Dashboard guarda aqui qual aba/filtro abrir ao clicar num cartão.
function lerDestino(): { aba?: string; filtro?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.sessionStorage.getItem(CHAVE_DESTINO);
    return bruto ? (JSON.parse(bruto) as { aba?: string; filtro?: string }) : null;
  } catch {
    return null;
  }
}

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

function prazoDocumento(dias: number | null): string {
  if (dias === null) return "—";
  if (dias === 0) return "Vence hoje";
  if (dias > 0) return `Em ${plural(dias, "dia", "dias")}`;
  return `Há ${plural(Math.abs(dias), "dia", "dias")}`;
}

function SituacaoBadge({ situacao }: { situacao: SituacaoDocumento }) {
  if (situacao === "SEM DATA") {
    return <span className="inline-flex items-center rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">Sem data cadastrada</span>;
  }
  return <StatusBadge value={SITUACAO_DOCUMENTO_LABEL[situacao]} />;
}

function DeadlinesPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["vencimentos-agenda"], queryFn: async () => { const [v, a, cars, instr] = await Promise.all([supabase.from("vencimentos").select("*").order("data_vencimento"), supabase.from("agenda_eventos").select("*").order("data"), supabase.from("veiculos").select("id, placa, status, ano_fabricacao, ano_modelo").order("placa"), supabase.from("instrucoes_documento").select("id, tipo_codigo").eq("ativo", true)]); const err = v.error || a.error || cars.error || instr.error; if (err) throw err; const allVehicles = cars.data ?? []; return { vencimentos: v.data ?? [], agenda: a.data ?? [], vehicles: allVehicles.filter(c => c.status !== "VENDIDO"), plates: new Map(allVehicles.map(c => [c.id, c.placa])), anos: new Map<string, DadosAnoVeiculo>(allVehicles.map(c => [c.id, { anoFabricacao: c.ano_fabricacao, anoModelo: c.ano_modelo }])), instrucoes: new Map((instr.data ?? []).map(i => [i.tipo_codigo, i.id])) }; } });
  const { data: diasAlerta = 30 } = useQuery({ queryKey: ["dias-alerta"], queryFn: fetchDiasAlerta, staleTime: 5 * 60_000 });
  const { data: regras = [] } = useQuery({ queryKey: ["regras_validade"], queryFn: fetchRegras });

  const [destino] = useState(lerDestino);
  const [tab, setTab] = useState(destino?.aba && ABAS.includes(destino.aba) ? destino.aba : "calendario");
  const [filtro, setFiltro] = useState<Filtro>(FILTROS.find(f => f.key === destino?.filtro)?.key ?? "TODOS");
  useEffect(() => { try { window.sessionStorage.removeItem(CHAVE_DESTINO); } catch { /* ignora */ } }, []);
  const [filtroAgenda, setFiltroAgenda] = useState<"PENDENTES" | "TODOS">("PENDENTES");
  const [vistaAgenda, setVistaAgenda] = useState<"PAINEL" | "LISTA">("PAINEL");
  const [editando, setEditando] = useState<VencimentoRow | null>(null);
  const [editandoEvento, setEditandoEvento] = useState<Row<"agenda_eventos"> | null>(null);

  // Só veículos ativos (vendidos ficam fora), igual ao Dashboard. Itens sem veículo continuam aparecendo.
  const ativosIds = useMemo(() => new Set((data?.vehicles ?? []).map(v => v.id)), [data]);
  const vencimentosAtivos = useMemo<VencimentoRow[]>(() => (data?.vencimentos ?? []).filter(r => !r.veiculo_id || ativosIds.has(r.veiculo_id)), [data, ativosIds]);

  const linhas = useMemo<Linha[]>(() => vencimentosAtivos
    .map(r => ({ ...r, situacao: situacaoDocumento(r.data_vencimento, r.status, diasAlerta), dias: daysUntil(r.data_vencimento) }))
    .sort((a, b) => ORDEM[a.situacao] - ORDEM[b.situacao] || (a.dias ?? 0) - (b.dias ?? 0)), [vencimentosAtivos, diasAlerta]);

  const contagem = useMemo(() => {
    const c: Record<SituacaoDocumento, number> = { VENCIDO: 0, "PROXIMO DO VENCIMENTO": 0, "EM PROCESSO": 0, "SEM DATA": 0, "DENTRO DA VALIDADE": 0, "NAO SE APLICA": 0 };
    for (const l of linhas) c[l.situacao] += 1;
    return c;
  }, [linhas]);

  const linhasFiltradas = useMemo(() => filtro === "TODOS" ? linhas : linhas.filter(l => l.situacao === filtro), [linhas, filtro]);
  const semData = useMemo(() => linhas.filter(l => l.situacao === "SEM DATA"), [linhas]);

  const agendaLinhas = useMemo<EventoLinha[]>(() => (data?.agenda ?? [])
    .filter(r => !r.veiculo_id || ativosIds.has(r.veiculo_id))
    .map(r => ({ ...r, dias: daysUntil(r.data), pendente: (r.status ?? "").toUpperCase().trim() === "AGENDADO" }))
    .sort((a, b) => Number(b.pendente) - Number(a.pendente) || (a.pendente ? (a.data ?? "").localeCompare(b.data ?? "") : (b.data ?? "").localeCompare(a.data ?? ""))), [data, ativosIds]);
  const agendaPendentes = agendaLinhas.filter(a => a.pendente);
  const agendaAtrasadas = agendaPendentes.filter(a => a.dias !== null && a.dias < 0).length;
  const agendaFiltrada = filtroAgenda === "PENDENTES" ? agendaPendentes : agendaLinhas;

  const atualizarTudo = async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ["vencimentos-agenda"] }), queryClient.invalidateQueries({ queryKey: ["dashboard"] })]);
  };

  const concluirEvento = async (evento: Row<"agenda_eventos">) => {
    const { error } = await supabase.from("agenda_eventos").update({ status: "CONCLUIDO" }).eq("id", evento.id);
    if (error) { toast.error("Não foi possível concluir", { description: error.message }); return; }
    toast.success("Atividade concluída");
    await atualizarTudo();
  };

  const abrirVencimentos = (f: Filtro) => { setFiltro(f); setTab("vencimentos"); };

  const deadlineCols = useMemo<DataColumn<Linha>[]>(() => [
    { label: "Veículo", value: r => r.veiculo_id ? data?.plates.get(r.veiculo_id) ?? "—" : "—" },
    { label: "Documento", value: r => r.descricao || r.tipo_codigo || "—" },
    { label: "Vencimento", value: r => r.data_vencimento ? formatDate(r.data_vencimento) : <span className="text-xs text-muted-foreground">{r.vencimento_texto || "—"}</span> },
    { label: "Prazo", value: r => <span className={r.situacao === "VENCIDO" ? "font-medium text-destructive" : ""}>{prazoDocumento(r.dias)}</span> },
    { label: "Validade", value: r => r.validade_meses ? <span className="text-xs">{r.validade_meses} meses</span> : <span className="text-xs text-muted-foreground">—</span> },
    { label: "Responsável", value: r => r.responsavel || "—" },
    { label: "Situação", value: r => <SituacaoBadge situacao={r.situacao} /> },
    { label: "Como renovar", value: r => { const instrucaoId = r.tipo_codigo ? data?.instrucoes.get(r.tipo_codigo) : undefined; return instrucaoId ? <Link to="/documentacao/$instrucaoId" params={{ instrucaoId }} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline" onClick={e => e.stopPropagation()}><BookOpenCheck className="size-3.5" />Ver instrução</Link> : <span className="text-xs text-muted-foreground">—</span>; } },
  ], [data]);

  const agendaCols = useMemo<DataColumn<EventoLinha>[]>(() => [
    { label: "Data", value: r => formatDate(r.data) },
    { label: "Hora", value: r => r.hora?.slice(0, 5) || "—" },
    { label: "Atividade", value: r => r.titulo || r.atividade },
    { label: "Veículo", value: r => r.veiculo_id ? data?.plates.get(r.veiculo_id) ?? "—" : "—" },
    { label: "Responsável", value: r => r.responsavel || "—" },
    { label: "Prazo", value: r => {
      if (!r.pendente || r.dias === null) return <span className="text-xs text-muted-foreground">—</span>;
      if (r.dias < 0) return <span className="font-medium text-destructive">Atrasada há {plural(Math.abs(r.dias), "dia", "dias")}</span>;
      if (r.dias === 0) return <span className="font-medium">Hoje</span>;
      return <span>Em {plural(r.dias, "dia", "dias")}</span>;
    } },
    { label: "Status", value: r => <StatusBadge value={r.status} /> },
  ], [data]);

  const vehicles = data?.vehicles ?? [];
  const placaEditando = editando?.veiculo_id ? data?.plates.get(editando.veiculo_id) ?? "—" : "—";
  const veiculoEditando = editando?.veiculo_id ? data?.anos.get(editando.veiculo_id) ?? null : null;
  const novoEvento = <AgendaForm vehicles={vehicles} trigger={<Button size="sm"><Plus className="mr-2 size-4" />Novo evento</Button>} />;

  return <>
    <PageHeader title="Vencimentos e Agenda" description="Prazos dos documentos de cada veículo e compromissos da operação." />

    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
      {RESUMO.map(item => {
        const ativo = (item.key === "SEM DATA" ? tab === "preencher" : tab === "vencimentos" && filtro === item.key);
        return (
          <button key={item.key} type="button" onClick={() => { if (item.key === "SEM DATA") setTab("preencher"); else abrirVencimentos(item.key); }} className={`flex flex-col items-start justify-start rounded-lg border bg-card p-4 text-left shadow-card transition hover:ring-1 hover:ring-primary/30 ${ativo ? "ring-2 ring-primary" : ""}`}>
            <p className="text-xs font-medium text-muted-foreground">{item.titulo}</p>
            <p className={`mt-1 text-2xl font-bold ${item.cor}`}>{contagem[item.key]}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{detalheResumo(item.key, diasAlerta)}</p>
          </button>
        );
      })}
    </div>

    <details className="mb-4 rounded-lg border bg-card p-4 text-sm">
      <summary className="flex cursor-pointer items-center gap-2 font-medium"><Info className="size-4 text-primary" />Como ler esses números e status</summary>
      <div className="mt-3 space-y-2 text-muted-foreground">
        <p>Aqui a contagem é <b>por documento</b> (um veículo tem vários documentos). No Dashboard, a contagem é <b>por veículo</b>.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Vencido</b> — a data de vencimento já passou. Renovar com urgência.</li>
          <li><b>Próximo do vencimento</b> — vence em até {diasAlerta} dias: é a janela para renovar sem aperto. O prazo pode ser alterado em Configurações.</li>
          <li><b>Em processo</b> — a renovação já foi iniciada (marcado manualmente no documento).</li>
          <li><b>Dentro da validade</b> — vence daqui a mais de {diasAlerta} dias.</li>
          <li><b>Sem data cadastrada</b> — o documento existe, mas ninguém informou a data de vencimento. Enquanto estiver vazia o sistema não consegue avisar: use a aba <b>Preencher datas</b>.</li>
          <li><b>Não se aplica</b> — documento não exigido para esse veículo; não entra em nenhuma contagem de pendência.</li>
        </ul>
        <p>O vencimento pode ser calculado pela <b>data de emissão + validade</b>. A validade de cada documento (e se muda conforme a idade do caminhão) é definida em <b>Documentação → Prazos de validade</b>.</p>
      </div>
    </details>

    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="calendario"><CalendarRange className="mr-2 size-4" />Calendário</TabsTrigger>
        <TabsTrigger value="vencimentos"><ListFilter className="mr-2 size-4" />Vencimentos ({linhas.length})</TabsTrigger>
        <TabsTrigger value="preencher"><ClipboardPen className="mr-2 size-4" />Preencher datas ({semData.length})</TabsTrigger>
        <TabsTrigger value="agenda"><CalendarDays className="mr-2 size-4" />Agenda ({agendaPendentes.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="calendario">
        <p className="mb-3 text-sm text-muted-foreground">Cada dia mostra os documentos que vencem nele — clique num dia para ver os detalhes. Documentos <b>sem data</b> não aparecem aqui: use a aba Preencher datas.</p>
        <VencimentosCalendar vencimentos={vencimentosAtivos} plates={data?.plates ?? new Map()} diasAlerta={diasAlerta} />
      </TabsContent>

      <TabsContent value="vencimentos">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {FILTROS.map(f => (
            <Button key={f.key} size="sm" variant={filtro === f.key ? "default" : "outline"} onClick={() => setFiltro(f.key)}>
              {f.label} ({f.key === "TODOS" ? linhas.length : contagem[f.key]})
            </Button>
          ))}
        </div>
        {filtro === "SEM DATA" && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
            <span>Estes documentos vieram da planilha <b>sem data de vencimento</b>, então o sistema não consegue avisar sobre eles.</span>
            <Button size="sm" onClick={() => setTab("preencher")}>Preencher em lote</Button>
          </div>
        )}
        <p className="mb-3 text-sm text-muted-foreground">Ordenado por urgência. Clique em uma linha para editar a emissão, o vencimento, o status ou o responsável.</p>
        <DataPage rows={linhasFiltradas} columns={deadlineCols} onRowClick={row => setEditando(row)} empty="Nenhum documento neste filtro." actions={<VencimentoForm vehicles={vehicles} trigger={<Button size="sm"><Plus className="mr-2 size-4" />Novo vencimento</Button>} />} />
      </TabsContent>

      <TabsContent value="preencher">
        <PreencherDatas itens={semData} plates={data?.plates ?? new Map()} anos={data?.anos ?? new Map()} regras={regras} onSaved={atualizarTudo} />
      </TabsContent>

      <TabsContent value="agenda">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant={vistaAgenda === "PAINEL" ? "default" : "outline"} onClick={() => setVistaAgenda("PAINEL")}><LayoutDashboard className="mr-2 size-4" />Painel</Button>
          <Button size="sm" variant={vistaAgenda === "LISTA" ? "default" : "outline"} onClick={() => setVistaAgenda("LISTA")}><ListTodo className="mr-2 size-4" />Lista</Button>
          {agendaAtrasadas > 0 && <span className="text-sm font-medium text-destructive">{plural(agendaAtrasadas, "atividade atrasada", "atividades atrasadas")}</span>}
        </div>

        {vistaAgenda === "PAINEL" ? (
          <AgendaPainel
            eventos={agendaLinhas}
            documentos={linhas}
            plates={data?.plates ?? new Map()}
            novoEvento={novoEvento}
            onEditarEvento={setEditandoEvento}
            onConcluirEvento={concluirEvento}
            onEditarDocumento={setEditando}
            onAbrirVencimentos={abrirVencimentos}
          />
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">Compromissos da operação (revisões, vistorias, renovações agendadas) — diferentes dos prazos de documentos. Clique numa linha para editar ou concluir.</p>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Button size="sm" variant={filtroAgenda === "PENDENTES" ? "default" : "outline"} onClick={() => setFiltroAgenda("PENDENTES")}>A fazer ({agendaPendentes.length})</Button>
              <Button size="sm" variant={filtroAgenda === "TODOS" ? "default" : "outline"} onClick={() => setFiltroAgenda("TODOS")}>Todas ({agendaLinhas.length})</Button>
            </div>
            <DataPage rows={agendaFiltrada} columns={agendaCols} onRowClick={row => setEditandoEvento(row)} empty="Nenhuma atividade agendada." actions={novoEvento} />
          </>
        )}
      </TabsContent>
    </Tabs>

    <VencimentoEditDialog row={editando} placa={placaEditando} veiculo={veiculoEditando} regras={regras} onClose={() => setEditando(null)} />
    <AgendaEventoDialog row={editandoEvento} vehicles={vehicles} onClose={() => setEditandoEvento(null)} />
  </>;
}
