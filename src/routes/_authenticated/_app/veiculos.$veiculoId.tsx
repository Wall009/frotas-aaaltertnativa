import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, ShieldAlert, TrafficCone } from "lucide-react";
import { AnexosPanel } from "@/components/anexos-panel";
import { MarcarVendidoForm } from "@/components/marcar-vendido-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate, formatDateTime, formatNumber, situacaoVencimento, SITUACAO_LABEL, STATUS_MULTA_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_app/veiculos/$veiculoId")({ head: () => ({ meta: [{ title: "Ficha do veículo — Controle de Frota" }, { name: "description", content: "Ficha completa e histórico do veículo." }, { property: "og:title", content: "Ficha do veículo — Controle de Frota" }, { property: "og:description", content: "Ficha completa e histórico do veículo." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: VehicleDetail });

function VehicleDetail() {
  const { veiculoId } = Route.useParams();
  const { data, isLoading } = useQuery({ queryKey: ["veiculo", veiculoId], queryFn: async () => {
    const [vehicle, deadlines, maintenance, claims, fines, technical, history, files] = await Promise.all([
      supabase.from("veiculos").select("*").eq("id", veiculoId).single(), supabase.from("vencimentos").select("*").eq("veiculo_id", veiculoId).order("data_vencimento"), supabase.from("manutencoes").select("*").eq("veiculo_id", veiculoId).order("data_abertura", { ascending: false }), supabase.from("sinistros").select("*").eq("veiculo_id", veiculoId).order("data", { ascending: false }), supabase.from("multas").select("*").eq("veiculo_id", veiculoId).order("data_infracao", { ascending: false }), supabase.from("ficha_tecnica").select("*").eq("veiculo_id", veiculoId).maybeSingle(), supabase.from("historico").select("*").eq("veiculo_id", veiculoId).order("created_at", { ascending: false }), supabase.from("anexos").select("*").eq("entidade_id", veiculoId).order("created_at", { ascending: false }),
    ]); if (vehicle.error) throw vehicle.error; return { vehicle: vehicle.data, deadlines: deadlines.data ?? [], maintenance: maintenance.data ?? [], claims: claims.data ?? [], fines: fines.data ?? [], technical: technical.data, history: history.data ?? [], files: files.data ?? [] };
  } });
  if (isLoading || !data) return <div className="py-20 text-center text-muted-foreground">Carregando ficha…</div>;
  const v = data.vehicle; const details = [["Placa", v.placa], ["RENAVAM", v.renavam], ["Chassi", v.chassi], ["Marca", v.marca], ["Modelo", v.modelo], ["Ano fabricação", v.ano_fabricacao], ["Ano modelo", v.ano_modelo], ["Cor", v.cor], ["Tipo", v.tipo_veiculo], ["Categoria", v.categoria], ["Combustível", v.combustivel], ["Capacidade", v.capacidade], ["Quilometragem", v.quilometragem ? `${formatNumber(v.quilometragem, 0)} km` : null], ["Proprietário", v.proprietario], ["Unidade", v.unidade], ["Localização", v.localizacao], ["Aquisição", formatDate(v.data_aquisicao)], ["Valor aquisição", formatCurrency(v.valor_aquisicao)], ...(v.status === "VENDIDO" ? [["Data da venda", formatDate(v.data_venda)], ["Comprador", v.comprador], ["Valor da venda", formatCurrency(v.valor_venda)], ["Motivo da venda", v.motivo_venda]] : [])];
  const tabClass = "h-10 shrink-0";

  const docsAtencao = data.deadlines.filter(r => ["VENCIDO", "PROXIMO DO VENCIMENTO"].includes(situacaoVencimento(r.data_vencimento, r.status)));
  const multasPendentes = data.fines.filter(m => !["PAGA", "ENCERRADA", "CANCELADA"].includes(m.status));
  const sinistrosAbertos = data.claims.filter(c => !c.status.toUpperCase().includes("CONCLU"));

  return <><PageHeader title={v.placa} description={v.marca_modelo || [v.marca, v.modelo].filter(Boolean).join(" ") || "Veículo sem descrição"} actions={<><StatusBadge value={v.status} />{v.status !== "VENDIDO" && <MarcarVendidoForm veiculoId={v.id} placa={v.placa} trigger={<Button variant="outline">Marcar como vendido</Button>} />}<Button variant="outline" asChild><Link to="/veiculos"><ArrowLeft />Voltar</Link></Button></>} /><Tabs defaultValue="visao-geral"><div className="overflow-x-auto"><TabsList className="h-auto w-max min-w-full justify-start"><TabsTrigger className={tabClass} value="visao-geral">Visão geral</TabsTrigger><TabsTrigger className={tabClass} value="dados">Dados gerais</TabsTrigger><TabsTrigger className={tabClass} value="documentacao">Documentação</TabsTrigger><TabsTrigger className={tabClass} value="manutencao">Manutenção</TabsTrigger><TabsTrigger className={tabClass} value="sinistros">Sinistros</TabsTrigger><TabsTrigger className={tabClass} value="multas">Multas</TabsTrigger><TabsTrigger className={tabClass} value="ficha">Ficha técnica</TabsTrigger><TabsTrigger className={tabClass} value="historico">Histórico</TabsTrigger><TabsTrigger className={tabClass} value="anexos">Anexos</TabsTrigger></TabsList></div>

    <TabsContent value="visao-geral">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg shadow-card"><CardContent className="p-4"><p className="text-xs font-medium uppercase text-muted-foreground">Placa / Modelo</p><p className="mt-1 text-sm font-semibold">{v.placa}</p><p className="text-xs text-muted-foreground">{v.marca_modelo || [v.marca, v.modelo].filter(Boolean).join(" ") || "—"}</p></CardContent></Card>
        <Card className="rounded-lg shadow-card"><CardContent className="p-4"><p className="text-xs font-medium uppercase text-muted-foreground">Unidade / Localização</p><p className="mt-1 text-sm font-semibold">{v.unidade || "—"}</p><p className="text-xs text-muted-foreground">{v.localizacao || "—"}</p></CardContent></Card>
        <Card className="rounded-lg shadow-card"><CardContent className="p-4"><p className="text-xs font-medium uppercase text-muted-foreground">Quilometragem</p><p className="mt-1 text-sm font-semibold">{v.quilometragem ? `${formatNumber(v.quilometragem, 0)} km` : "—"}</p></CardContent></Card>
        <Card className="rounded-lg shadow-card"><CardContent className="p-4"><p className="text-xs font-medium uppercase text-muted-foreground">Status</p><p className="mt-1"><StatusBadge value={v.status} /></p></CardContent></Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="rounded-lg shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><CardTitle className="flex items-center gap-2 text-sm"><CalendarClock className="size-4 text-primary" />Documentação</CardTitle><span className="text-xs text-muted-foreground">{data.deadlines.length} registro(s)</span></CardHeader>
          <CardContent className="space-y-2 pt-0">
            {docsAtencao.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum documento vencido ou próximo do vencimento.</p> : docsAtencao.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{r.descricao || r.tipo_codigo || "—"}</p><p className="text-xs text-muted-foreground">{formatDate(r.data_vencimento)}</p></div>
                <StatusBadge value={SITUACAO_LABEL[situacaoVencimento(r.data_vencimento, r.status)]} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-lg shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><CardTitle className="flex items-center gap-2 text-sm"><TrafficCone className="size-4 text-warning-foreground" />Multas</CardTitle><span className="text-xs text-muted-foreground">{data.fines.length} registro(s)</span></CardHeader>
          <CardContent className="space-y-2 pt-0">
            {multasPendentes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma multa pendente.</p> : multasPendentes.slice(0, 5).map(m => (
              <Link key={m.id} to="/multas/$multaId" params={{ multaId: m.id }} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 hover:opacity-80">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{m.numero_auto || m.descricao_infracao || "Multa"}</p><p className="text-xs text-muted-foreground">{formatDate(m.data_infracao)}</p></div>
                <StatusBadge value={STATUS_MULTA_LABEL[m.status] ?? m.status} />
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-lg shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><CardTitle className="flex items-center gap-2 text-sm"><ShieldAlert className="size-4 text-destructive" />Sinistros</CardTitle><span className="text-xs text-muted-foreground">{data.claims.length} registro(s)</span></CardHeader>
          <CardContent className="space-y-2 pt-0">
            {sinistrosAbertos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum sinistro em andamento.</p> : sinistrosAbertos.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{c.tipo || "Sinistro"}</p><p className="text-xs text-muted-foreground">{formatDate(c.data)} · {c.local || "—"}</p></div>
                <StatusBadge value={c.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </TabsContent>

    <TabsContent value="dados"><Card className="rounded-lg"><CardContent className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2 lg:grid-cols-3">{details.map(([label, value]) => <div key={String(label)}><p className="text-xs font-medium uppercase text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value || "—"}</p></div>)}{v.observacoes && <div className="sm:col-span-2 lg:col-span-3"><p className="text-xs font-medium uppercase text-muted-foreground">Observações</p><p className="mt-1 whitespace-pre-wrap text-sm">{v.observacoes}</p></div>}</CardContent></Card></TabsContent>
    <TabsContent value="documentacao"><Card className="rounded-lg"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead><TableHead>Vencimento</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader><TableBody>{data.deadlines.map(r => <TableRow key={r.id}><TableCell className="font-medium">{r.tipo_codigo || "—"}</TableCell><TableCell>{r.descricao || "—"}</TableCell><TableCell>{formatDate(r.data_vencimento)}</TableCell><TableCell><StatusBadge value={SITUACAO_LABEL[situacaoVencimento(r.data_vencimento, r.status)]} /></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
    <TabsContent value="manutencao"><SimpleRows rows={data.maintenance.map(r => [r.id, r.tipo || "Manutenção", r.problema || "—", formatDate(r.data_abertura), r.status])} /></TabsContent>
    <TabsContent value="sinistros"><SimpleRows rows={data.claims.map(r => [r.id, r.tipo || "Sinistro", r.local || "—", formatDate(r.data), r.status])} /></TabsContent>
    <TabsContent value="multas"><Card className="rounded-lg"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Auto</TableHead><TableHead>Infração</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{data.fines.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Nenhuma multa registrada.</TableCell></TableRow> : data.fines.map(m => <TableRow key={m.id} className="cursor-pointer"><TableCell className="font-medium"><Link to="/multas/$multaId" params={{ multaId: m.id }}>{m.numero_auto || "—"}</Link></TableCell><TableCell>{m.descricao_infracao || m.enquadramento || "—"}</TableCell><TableCell>{formatDate(m.data_infracao)}</TableCell><TableCell><StatusBadge value={STATUS_MULTA_LABEL[m.status] ?? m.status} /></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
    <TabsContent value="ficha"><Card className="rounded-lg"><CardContent className="grid gap-5 p-6 sm:grid-cols-2">{data.technical ? [["Identificação", data.technical.identificacao], ["Modelo", data.technical.modelo], ["Comprimento", data.technical.comprimento], ["Altura", data.technical.altura], ["Largura", data.technical.largura], ["Observações", data.technical.observacoes]].map(([l, x]) => <div key={String(l)}><p className="text-xs font-medium uppercase text-muted-foreground">{l}</p><p className="mt-1 text-sm">{x || "—"}</p></div>) : <p className="text-sm text-muted-foreground">Nenhuma ficha técnica vinculada.</p>}</CardContent></Card></TabsContent>
    <TabsContent value="historico"><Card className="rounded-lg"><CardContent className="divide-y p-6">{data.history.length ? data.history.map(h => <div key={h.id} className="py-4 first:pt-0"><div className="flex justify-between gap-3"><p className="text-sm font-semibold">{h.acao} {h.campo ? `· ${h.campo}` : ""}</p><span className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</span></div><p className="mt-1 text-sm text-muted-foreground">{h.valor_anterior || "—"} → {h.valor_novo || "—"}</p></div>) : <p className="text-sm text-muted-foreground">Nenhuma alteração registrada.</p>}</CardContent></Card></TabsContent>
    <TabsContent value="anexos"><AnexosPanel entidade="veiculo" entidadeId={veiculoId} files={data.files} queryKey={["veiculo", veiculoId]} /></TabsContent>
  </Tabs></>;
}

function SimpleRows({ rows }: { rows: Array<[string, string, string, string, string]> }) { return <Card className="rounded-lg"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{rows.map(r => <TableRow key={r[0]}><TableCell className="font-medium">{r[1]}</TableCell><TableCell>{r[2]}</TableCell><TableCell>{r[3]}</TableCell><TableCell><StatusBadge value={r[4]} /></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>; }