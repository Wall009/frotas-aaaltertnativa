import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AnexosPanel } from "@/components/anexos-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { diasRestantes, formatCurrency, formatDate, formatDateTime, STATUS_MULTA_LABEL, SITUACAO_CONDUTOR_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_app/multas/$multaId")({ head: () => ({ meta: [{ title: "Multa — Controle de Frota" }, { name: "description", content: "Detalhes da multa, condutor, pagamento e recurso." }] }), component: FineDetail });

function FineDetail() {
  const { multaId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["multa", multaId], queryFn: async () => {
    const [multa, motoristas, pagamentos, recursos, timeline, anexos] = await Promise.all([
      supabase.from("multas").select("*, veiculos(placa, marca_modelo)").eq("id", multaId).single(),
      supabase.from("motoristas").select("id, nome, cpf, cnh, categoria_cnh, validade_cnh").eq("ativo", true).order("nome"),
      supabase.from("multa_pagamentos").select("*").eq("multa_id", multaId).order("created_at", { ascending: false }),
      supabase.from("multa_recursos").select("*").eq("multa_id", multaId).order("created_at", { ascending: false }),
      supabase.from("multa_timeline").select("*").eq("multa_id", multaId).order("created_at", { ascending: false }),
      supabase.from("anexos").select("*").eq("entidade_id", multaId).order("created_at", { ascending: false }),
    ]);
    if (multa.error) throw multa.error;
    return { multa: multa.data, motoristas: motoristas.data ?? [], pagamentos: pagamentos.data ?? [], recursos: recursos.data ?? [], timeline: timeline.data ?? [], anexos: anexos.data ?? [] };
  } });

  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: ["multa", multaId] }); await queryClient.invalidateQueries({ queryKey: ["multas"] }); };

  const [savingStatus, setSavingStatus] = useState(false);
  const changeStatus = async (status: string) => {
    setSavingStatus(true);
    const { error } = await supabase.from("multas").update({ status }).eq("id", multaId);
    if (!error) await supabase.from("multa_timeline").insert({ multa_id: multaId, evento: `Status alterado para ${STATUS_MULTA_LABEL[status] ?? status}` });
    setSavingStatus(false);
    if (error) { toast.error("Não foi possível atualizar o status", { description: error.message }); return; }
    await refresh();
  };

  const [savingCondutor, setSavingCondutor] = useState(false);
  const salvarCondutor = async (formData: FormData) => {
    setSavingCondutor(true);
    const motoristaId = String(formData.get("motorista_id") ?? "") || null;
    const situacao = motoristaId ? "IDENTIFICADO" : "AGUARDANDO_INDICACAO";
    const payload = {
      motorista_id: motoristaId,
      situacao_condutor: situacao,
      data_identificacao: String(formData.get("data_identificacao") ?? "") || null,
      data_indicacao: String(formData.get("data_indicacao") ?? "") || null,
      responsavel_indicacao: String(formData.get("responsavel_indicacao") ?? "").trim() || null,
      protocolo_indicacao: String(formData.get("protocolo_indicacao") ?? "").trim() || null,
    };
    const { error } = await supabase.from("multas").update(payload).eq("id", multaId);
    setSavingCondutor(false);
    if (error) { toast.error("Não foi possível salvar", { description: error.message }); return; }
    if (payload.data_indicacao) await supabase.from("multa_timeline").insert({ multa_id: multaId, evento: "Indicação de condutor realizada", detalhe: payload.protocolo_indicacao ? `Protocolo ${payload.protocolo_indicacao}` : null });
    else if (motoristaId) await supabase.from("multa_timeline").insert({ multa_id: multaId, evento: "Condutor identificado" });
    toast.success("Condutor atualizado");
    await refresh();
  };

  const [savingPagamento, setSavingPagamento] = useState(false);
  const registrarPagamento = async (formData: FormData) => {
    setSavingPagamento(true);
    const num = (k: string) => { const v = String(formData.get(k) ?? "").trim(); return v ? Number(v.replace(",", ".")) : null; };
    const text = (k: string) => String(formData.get(k) ?? "").trim() || null;
    const dataPagamento = text("data_pagamento");
    const payload = { multa_id: multaId, valor_original: num("valor_original"), desconto: num("desconto"), valor_pago: num("valor_pago"), data_pagamento: dataPagamento, forma_pagamento: text("forma_pagamento"), responsavel: text("responsavel"), observacao: text("observacao") };
    const { error } = await supabase.from("multa_pagamentos").insert(payload);
    if (!error) {
      await supabase.from("multas").update({ status: "PAGA" }).eq("id", multaId);
      await supabase.from("multa_timeline").insert({ multa_id: multaId, evento: "Pagamento efetuado", detalhe: payload.valor_pago ? formatCurrency(payload.valor_pago) : null });
    }
    setSavingPagamento(false);
    if (error) { toast.error("Não foi possível registrar o pagamento", { description: error.message }); return; }
    toast.success("Pagamento registrado");
    await refresh();
  };

  const [savingRecurso, setSavingRecurso] = useState(false);
  const registrarRecurso = async (formData: FormData) => {
    setSavingRecurso(true);
    const text = (k: string) => String(formData.get(k) ?? "").trim() || null;
    const payload = { multa_id: multaId, tipo_recurso: text("tipo_recurso"), data_protocolo: text("data_protocolo"), numero_protocolo: text("numero_protocolo"), orgao: text("orgao"), prazo: text("prazo"), responsavel: text("responsavel"), status: "EM_ANALISE", observacoes: text("observacoes") };
    const { error } = await supabase.from("multa_recursos").insert(payload);
    if (!error) {
      await supabase.from("multas").update({ status: "EM_RECURSO" }).eq("id", multaId);
      await supabase.from("multa_timeline").insert({ multa_id: multaId, evento: "Recurso protocolado", detalhe: payload.numero_protocolo ? `Protocolo ${payload.numero_protocolo}` : null });
    }
    setSavingRecurso(false);
    if (error) { toast.error("Não foi possível registrar o recurso", { description: error.message }); return; }
    toast.success("Recurso registrado");
    await refresh();
  };

  const decidirRecurso = async (recursoId: string, resultado: "DEFERIDO" | "INDEFERIDO") => {
    const { error } = await supabase.from("multa_recursos").update({ status: resultado, resultado, data_decisao: new Date().toISOString().slice(0, 10) }).eq("id", recursoId);
    if (!error) {
      await supabase.from("multas").update({ status: resultado === "DEFERIDO" ? "RECURSO_DEFERIDO" : "RECURSO_INDEFERIDO" }).eq("id", multaId);
      await supabase.from("multa_timeline").insert({ multa_id: multaId, evento: `Recurso ${resultado === "DEFERIDO" ? "deferido" : "indeferido"}` });
    }
    if (error) { toast.error("Não foi possível atualizar o recurso", { description: error.message }); return; }
    toast.success("Recurso atualizado");
    await refresh();
  };

  if (isLoading || !data) return <div className="py-20 text-center text-muted-foreground">Carregando multa…</div>;
  const m = data.multa;
  const prazoDias = diasRestantes(m.prazo_indicacao);

  return <>
    <PageHeader
      title={m.veiculos?.placa || "Multa"}
      description={m.descricao_infracao || m.enquadramento || "Sem descrição da infração"}
      actions={<>
        <Select value={m.status} onValueChange={changeStatus} disabled={savingStatus}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(STATUS_MULTA_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" asChild><Link to="/multas"><ArrowLeft />Voltar</Link></Button>
      </>}
    />

    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <InfoCard label="Auto de infração" value={m.numero_auto || "—"} />
      <InfoCard label="Data / hora" value={`${formatDate(m.data_infracao)}${m.hora_infracao ? " · " + m.hora_infracao.slice(0, 5) : ""}`} />
      <InfoCard label="Valor atualizado" value={formatCurrency(m.valor_atualizado ?? m.valor_original)} />
      <InfoCard label="Condutor" value={<StatusBadge value={SITUACAO_CONDUTOR_LABEL[m.situacao_condutor] ?? m.situacao_condutor} />} />
    </div>

    <Tabs defaultValue="condutor">
      <div className="overflow-x-auto"><TabsList className="h-auto w-max min-w-full justify-start">
        <TabsTrigger className="h-10 shrink-0" value="condutor">Condutor</TabsTrigger>
        <TabsTrigger className="h-10 shrink-0" value="infracao">Infração</TabsTrigger>
        <TabsTrigger className="h-10 shrink-0" value="pagamento">Pagamento</TabsTrigger>
        <TabsTrigger className="h-10 shrink-0" value="recurso">Recurso</TabsTrigger>
        <TabsTrigger className="h-10 shrink-0" value="historico">Histórico</TabsTrigger>
        <TabsTrigger className="h-10 shrink-0" value="anexos">Anexos</TabsTrigger>
      </TabsList></div>

      <TabsContent value="condutor">
        <Card className="rounded-lg"><CardContent className="p-6">
          {prazoDias !== null && m.situacao_condutor === "AGUARDANDO_INDICACAO" && (
            <p className={`mb-4 text-sm font-medium ${prazoDias < 0 ? "text-destructive" : prazoDias <= 3 ? "text-warning-foreground" : "text-muted-foreground"}`}>
              {prazoDias < 0 ? `Prazo de indicação vencido há ${Math.abs(prazoDias)} dia(s).` : prazoDias === 0 ? "Prazo de indicação termina hoje." : `Prazo de indicação: ${prazoDias} dia(s) restantes.`}
            </p>
          )}
          <form action={salvarCondutor} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="motorista_id">Motorista</Label>
              <Select name="motorista_id" defaultValue={m.motorista_id ?? ""}>
                <SelectTrigger id="motorista_id"><SelectValue placeholder="Buscar motorista…" /></SelectTrigger>
                <SelectContent>{data.motoristas.map(mo => <SelectItem key={mo.id} value={mo.id}>{mo.nome}{mo.cpf ? ` · ${mo.cpf}` : ""}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Cadastre motoristas em Configurações se ainda não existirem na lista.</p>
            </div>
            <div className="space-y-2"><Label htmlFor="data_identificacao">Data de identificação</Label><Input id="data_identificacao" name="data_identificacao" type="date" defaultValue={m.data_identificacao ?? ""} /></div>
            <div className="space-y-2"><Label htmlFor="data_indicacao">Data da indicação</Label><Input id="data_indicacao" name="data_indicacao" type="date" defaultValue={m.data_indicacao ?? ""} /></div>
            <div className="space-y-2"><Label htmlFor="responsavel_indicacao">Responsável pela indicação</Label><Input id="responsavel_indicacao" name="responsavel_indicacao" defaultValue={m.responsavel_indicacao ?? ""} maxLength={255} /></div>
            <div className="space-y-2"><Label htmlFor="protocolo_indicacao">Protocolo</Label><Input id="protocolo_indicacao" name="protocolo_indicacao" defaultValue={m.protocolo_indicacao ?? ""} maxLength={255} /></div>
            <div className="sm:col-span-2"><Button type="submit" disabled={savingCondutor}>{savingCondutor ? "Salvando…" : "Salvar condutor"}</Button></div>
          </form>
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="infracao">
        <Card className="rounded-lg"><CardContent className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {[["Órgão autuador", m.orgao_autuador], ["Código", m.codigo_infracao], ["Enquadramento", m.enquadramento], ["Gravidade", m.gravidade], ["Pontos", m.pontos], ["Local", m.local], ["Município", m.municipio], ["UF", m.uf], ["Rodovia", m.rodovia], ["Km", m.km], ["Sentido", m.sentido], ["Vencimento", formatDate(m.data_vencimento)]].map(([label, value]) => (
            <div key={String(label)}><p className="text-xs font-medium uppercase text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value || "—"}</p></div>
          ))}
          {m.observacoes && <div className="sm:col-span-2 lg:col-span-3"><p className="text-xs font-medium uppercase text-muted-foreground">Observações</p><p className="mt-1 whitespace-pre-wrap text-sm">{m.observacoes}</p></div>}
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="pagamento">
        <div className="space-y-4">
          <Card className="rounded-lg"><CardContent className="p-6">
            <form action={registrarPagamento} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="valor_original">Valor da multa</Label><Input id="valor_original" name="valor_original" type="number" step="0.01" defaultValue={m.valor_atualizado ?? m.valor_original ?? undefined} /></div>
              <div className="space-y-2"><Label htmlFor="desconto">Desconto</Label><Input id="desconto" name="desconto" type="number" step="0.01" /></div>
              <div className="space-y-2"><Label htmlFor="valor_pago">Valor pago</Label><Input id="valor_pago" name="valor_pago" type="number" step="0.01" /></div>
              <div className="space-y-2"><Label htmlFor="data_pagamento">Data do pagamento</Label><Input id="data_pagamento" name="data_pagamento" type="date" /></div>
              <div className="space-y-2"><Label htmlFor="forma_pagamento">Forma de pagamento</Label><Input id="forma_pagamento" name="forma_pagamento" maxLength={255} /></div>
              <div className="space-y-2"><Label htmlFor="responsavel">Responsável</Label><Input id="responsavel" name="responsavel" maxLength={255} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="observacao">Observação</Label><Textarea id="observacao" name="observacao" maxLength={1000} /></div>
              <div className="sm:col-span-2"><Button type="submit" disabled={savingPagamento}>{savingPagamento ? "Salvando…" : "Registrar pagamento"}</Button></div>
            </form>
          </CardContent></Card>
          {data.pagamentos.length > 0 && (
            <Card className="rounded-lg"><CardContent className="divide-y p-0">
              {data.pagamentos.map(p => (
                <div key={p.id} className="grid gap-1 p-4 sm:grid-cols-4">
                  <div><p className="text-xs uppercase text-muted-foreground">Valor pago</p><p className="text-sm font-semibold">{formatCurrency(p.valor_pago)}</p></div>
                  <div><p className="text-xs uppercase text-muted-foreground">Desconto</p><p className="text-sm">{formatCurrency(p.desconto)}</p></div>
                  <div><p className="text-xs uppercase text-muted-foreground">Data</p><p className="text-sm">{formatDate(p.data_pagamento)}</p></div>
                  <div><p className="text-xs uppercase text-muted-foreground">Forma</p><p className="text-sm">{p.forma_pagamento || "—"}</p></div>
                </div>
              ))}
            </CardContent></Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="recurso">
        <div className="space-y-4">
          <Card className="rounded-lg"><CardContent className="p-6">
            <form action={registrarRecurso} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="tipo_recurso">Tipo de recurso</Label><Input id="tipo_recurso" name="tipo_recurso" maxLength={255} /></div>
              <div className="space-y-2"><Label htmlFor="orgao">Órgão</Label><Input id="orgao" name="orgao" maxLength={255} /></div>
              <div className="space-y-2"><Label htmlFor="data_protocolo">Data do protocolo</Label><Input id="data_protocolo" name="data_protocolo" type="date" /></div>
              <div className="space-y-2"><Label htmlFor="numero_protocolo">Número do protocolo</Label><Input id="numero_protocolo" name="numero_protocolo" maxLength={255} /></div>
              <div className="space-y-2"><Label htmlFor="prazo">Prazo</Label><Input id="prazo" name="prazo" type="date" /></div>
              <div className="space-y-2"><Label htmlFor="responsavel">Responsável</Label><Input id="responsavel" name="responsavel" maxLength={255} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" name="observacoes" maxLength={1000} /></div>
              <div className="sm:col-span-2"><Button type="submit" disabled={savingRecurso}>{savingRecurso ? "Salvando…" : "Protocolar recurso"}</Button></div>
            </form>
          </CardContent></Card>
          {data.recursos.map(rec => (
            <Card key={rec.id} className="rounded-lg"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">{rec.tipo_recurso || "Recurso"} {rec.numero_protocolo ? `· ${rec.numero_protocolo}` : ""}</p>
                <p className="text-xs text-muted-foreground">{rec.orgao || "—"} · Protocolado em {formatDate(rec.data_protocolo)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={STATUS_MULTA_LABEL[rec.status] ?? rec.status} />
                {rec.status === "EM_ANALISE" && <>
                  <Button size="sm" variant="outline" onClick={() => decidirRecurso(rec.id, "DEFERIDO")}>Deferido</Button>
                  <Button size="sm" variant="outline" onClick={() => decidirRecurso(rec.id, "INDEFERIDO")}>Indeferido</Button>
                </>}
              </div>
            </CardContent></Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="historico">
        <Card className="rounded-lg"><CardContent className="divide-y p-6">
          {data.timeline.length ? data.timeline.map(h => (
            <div key={h.id} className="py-4 first:pt-0">
              <div className="flex justify-between gap-3"><p className="text-sm font-semibold">{h.evento}</p><span className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</span></div>
              {h.detalhe && <p className="mt-1 text-sm text-muted-foreground">{h.detalhe}</p>}
            </div>
          )) : <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>}
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="anexos"><AnexosPanel entidade="multa" entidadeId={multaId} files={data.anexos} queryKey={["multa", multaId]} /></TabsContent>
    </Tabs>
  </>;
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return <Card className="rounded-lg shadow-card"><CardContent className="p-4"><p className="text-xs font-medium uppercase text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></CardContent></Card>;
}
