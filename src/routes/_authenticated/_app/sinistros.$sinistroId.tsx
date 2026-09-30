import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";
import { AnexosPanel } from "@/components/anexos-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_app/sinistros/$sinistroId")({ head: () => ({ meta: [{ title: "Sinistro — Controle de Frota" }, { name: "description", content: "Apuração, seguro, terceiro e documentos do sinistro." }] }), component: SinistroDetail });

const EVIDENCIA_OPCOES = [
  ["prints_rastreamento", "Prints de rastreamento"], ["logs_telemetria", "Logs de telemetria"], ["imagens_fotos", "Imagens/fotos"],
  ["videos", "Vídeos"], ["audios", "Áudios"], ["boletim_ocorrencia", "Boletim de ocorrência"], ["relatorio_monitoramento", "Relatório de monitoramento"],
  ["comunicacao", "Comunicação (telefone/WhatsApp/e-mail)"], ["orcamento", "Orçamento"], ["nota_fiscal", "Nota fiscal"], ["laudo_tecnico", "Laudo técnico"], ["comprovante_desembolso", "Comprovante de desembolso"],
] as const;

function SinistroDetail() {
  const { sinistroId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["sinistro", sinistroId], queryFn: async () => {
    const [sinistro, timeline, anexos] = await Promise.all([
      supabase.from("sinistros").select("*, veiculos(placa, marca_modelo)").eq("id", sinistroId).single(),
      supabase.from("sinistro_timeline").select("*").eq("sinistro_id", sinistroId).order("created_at", { ascending: false }),
      supabase.from("anexos").select("*").eq("entidade_id", sinistroId).order("created_at", { ascending: false }),
    ]);
    if (sinistro.error) throw sinistro.error;
    return { s: sinistro.data, timeline: timeline.data ?? [], anexos: anexos.data ?? [] };
  } });

  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: ["sinistro", sinistroId] }); await queryClient.invalidateQueries({ queryKey: ["sinistros"] }); };
  const addTimeline = async (titulo: string, descricao?: string | null) => { await supabase.from("sinistro_timeline").insert({ sinistro_id: sinistroId, titulo, descricao: descricao ?? null }); };

  const [savingStatus, setSavingStatus] = useState(false);
  const changeStatus = async (status: string) => {
    setSavingStatus(true);
    const { error } = await supabase.from("sinistros").update({ status }).eq("id", sinistroId);
    if (!error) await addTimeline(`Status alterado para ${status}`);
    setSavingStatus(false);
    if (error) { toast.error("Não foi possível atualizar o status", { description: error.message }); return; }
    await refresh();
  };

  const saveSection = (label: string) => async (formData: FormData, transform: (fd: FormData) => Record<string, unknown>) => {
    const payload = transform(formData);
    const { error } = await supabase.from("sinistros").update(payload as never).eq("id", sinistroId);
    if (error) { toast.error(`Não foi possível salvar (${label})`, { description: error.message }); return; }
    await addTimeline(`${label} atualizada`);
    toast.success("Salvo");
    await refresh();
  };

  const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim() || null;
  const num = (fd: FormData, key: string) => { const v = text(fd, key); return v ? Number(v.replace(",", ".")) : null; };
  const bool = (fd: FormData, key: string) => fd.get(key) === "on";

  const salvarOcorrencia = async (formData: FormData) => saveSection("Ocorrência")(formData, fd => ({
    numero_roo: text(fd, "numero_roo"), unidade_filial: text(fd, "unidade_filial"), setor_responsavel: text(fd, "setor_responsavel"),
    responsavel_preenchimento: text(fd, "responsavel_preenchimento"), cargo_responsavel: text(fd, "cargo_responsavel"),
    tipo_evento: text(fd, "tipo_evento"), tipo_evento_outro: text(fd, "tipo_evento_outro"), implemento_equipamento: text(fd, "implemento_equipamento"),
    nome_empregado: text(fd, "nome_empregado"), funcao_empregado: text(fd, "funcao_empregado"), matricula_empregado: text(fd, "matricula_empregado"), supervisor: text(fd, "supervisor"),
    data: text(fd, "data"), hora: text(fd, "hora"), local: text(fd, "local"), tipo: text(fd, "tipo"),
    descricao_fatos: text(fd, "descricao_fatos"), versao_empregado: text(fd, "versao_empregado"),
    evidencias: EVIDENCIA_OPCOES.filter(([key]) => bool(fd, `ev_${key}`)).map(([key]) => key),
    descricao_evidencias: text(fd, "descricao_evidencias"),
    dano_material: bool(fd, "dano_material"), dano_terceiro: bool(fd, "dano_terceiro"), dano_carga: bool(fd, "dano_carga"), dano_veiculo: bool(fd, "dano_veiculo"), franquia_seguro: bool(fd, "franquia_seguro"),
    valor_estimado_inicial: num(fd, "valor_estimado_inicial"), valor_comprovado: num(fd, "valor_comprovado"), discriminacao_prejuizo: text(fd, "discriminacao_prejuizo"),
  }));

  const salvarApuracao = async (formData: FormData) => saveSection("Apuração")(formData, fd => ({
    data_notificacao_defesa: text(fd, "data_notificacao_defesa"), prazo_defesa_concedido: bool(fd, "prazo_defesa_concedido"), defesa_apresentada: bool(fd, "defesa_apresentada"), forma_defesa: text(fd, "forma_defesa"),
    houve_violacao_procedimento: bool(fd, "houve_violacao_procedimento"), norma_violada: text(fd, "norma_violada"), nexo_causal: bool(fd, "nexo_causal"), indicio: text(fd, "indicio"),
    medida_adotada: text(fd, "medida_adotada"), medida_adotada_outra: text(fd, "medida_adotada_outra"), valor_ressarcimento: num(fd, "valor_ressarcimento"),
    fundamentacao_objetiva: text(fd, "fundamentacao_objetiva"), responsavel_tecnico: text(fd, "responsavel_tecnico"), cargo_responsavel_tecnico: text(fd, "cargo_responsavel_tecnico"),
  }));

  const salvarSeguro = async (formData: FormData) => saveSection("Seguro/Reparo")(formData, fd => ({
    boletim_ocorrencia: text(fd, "boletim_ocorrencia"), seguradora: text(fd, "seguradora"), apolice: text(fd, "apolice"), numero_sinistro: text(fd, "numero_sinistro"), franquia: num(fd, "franquia"),
    valor_estimado: num(fd, "valor_estimado"), valor_aprovado: num(fd, "valor_aprovado"), valor_final: num(fd, "valor_final"),
    oficina: text(fd, "oficina"), data_entrada: text(fd, "data_entrada"), previsao_saida: text(fd, "previsao_saida"), data_saida: text(fd, "data_saida"),
    orcamento: num(fd, "orcamento"), reparo_valor_aprovado: num(fd, "reparo_valor_aprovado"), reparo_valor_final: num(fd, "reparo_valor_final"), observacoes: text(fd, "observacoes"),
  }));

  const salvarTerceiro = async (formData: FormData) => saveSection("Terceiro/Quitação")(formData, fd => ({
    terceiro_nome: text(fd, "terceiro_nome"), terceiro_rg: text(fd, "terceiro_rg"), terceiro_cpf: text(fd, "terceiro_cpf"), terceiro_cnh: text(fd, "terceiro_cnh"), terceiro_endereco: text(fd, "terceiro_endereco"),
    quitacao_valor: num(fd, "quitacao_valor"), quitacao_forma_pagamento: text(fd, "quitacao_forma_pagamento"), quitacao_banco: text(fd, "quitacao_banco"), quitacao_agencia: text(fd, "quitacao_agencia"),
    quitacao_conta: text(fd, "quitacao_conta"), quitacao_pix: text(fd, "quitacao_pix"), quitacao_data: text(fd, "quitacao_data"), representante_empresa: text(fd, "representante_empresa"),
  }));

  if (isLoading || !data) return <div className="py-20 text-center text-muted-foreground">Carregando sinistro…</div>;
  const s = data.s;
  const evidenciasSet = new Set((s.evidencias as string[] | null) ?? []);

  return <>
    <PageHeader
      title={s.veiculos?.placa || "Sinistro"}
      description={`${formatDate(s.data)} · ${s.tipo || s.numero_roo || "Ocorrência"}`}
      actions={<>
        <Select value={s.status} onValueChange={changeStatus} disabled={savingStatus}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="EM ANDAMENTO">Em andamento</SelectItem>
            <SelectItem value="AGUARDANDO SEGURADORA">Aguardando seguradora</SelectItem>
            <SelectItem value="EM REPARO">Em reparo</SelectItem>
            <SelectItem value="CONCLUIDO">Concluído</SelectItem>
            <SelectItem value="ENCERRADO">Encerrado</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" asChild><Link to="/sinistros"><ArrowLeft />Voltar</Link></Button>
      </>}
    />

    <Tabs defaultValue="ocorrencia">
      <div className="overflow-x-auto"><TabsList className="h-auto w-max min-w-full justify-start">
        <TabsTrigger className="h-10 shrink-0" value="ocorrencia">Ocorrência</TabsTrigger>
        <TabsTrigger className="h-10 shrink-0" value="apuracao">Apuração</TabsTrigger>
        <TabsTrigger className="h-10 shrink-0" value="seguro">Seguro &amp; Reparo</TabsTrigger>
        <TabsTrigger className="h-10 shrink-0" value="terceiro">Terceiro &amp; Quitação</TabsTrigger>
        <TabsTrigger className="h-10 shrink-0" value="documentos">Documentos</TabsTrigger>
        <TabsTrigger className="h-10 shrink-0" value="historico">Histórico</TabsTrigger>
        <TabsTrigger className="h-10 shrink-0" value="anexos">Anexos</TabsTrigger>
      </TabsList></div>

      {/* OCORRÊNCIA */}
      <TabsContent value="ocorrencia">
        <Card className="rounded-lg"><CardContent className="p-6">
          <form action={salvarOcorrencia} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2"><Label htmlFor="numero_roo">Número do ROO</Label><Input id="numero_roo" name="numero_roo" defaultValue={s.numero_roo ?? ""} maxLength={50} /></div>
              <div className="space-y-2"><Label htmlFor="unidade_filial">Unidade/filial</Label><Input id="unidade_filial" name="unidade_filial" defaultValue={s.unidade_filial ?? ""} maxLength={255} /></div>
              <div className="space-y-2"><Label htmlFor="setor_responsavel">Setor responsável</Label><Input id="setor_responsavel" name="setor_responsavel" defaultValue={s.setor_responsavel ?? "Frotas"} maxLength={255} /></div>
              <div className="space-y-2"><Label htmlFor="responsavel_preenchimento">Preenchido por</Label><Input id="responsavel_preenchimento" name="responsavel_preenchimento" defaultValue={s.responsavel_preenchimento ?? ""} maxLength={255} /></div>
              <div className="space-y-2"><Label htmlFor="cargo_responsavel">Cargo</Label><Input id="cargo_responsavel" name="cargo_responsavel" defaultValue={s.cargo_responsavel ?? ""} maxLength={255} /></div>
              <div className="space-y-2">
                <Label htmlFor="tipo_evento">Tipo de evento</Label>
                <Select name="tipo_evento" defaultValue={s.tipo_evento ?? "SINISTRO"}>
                  <SelectTrigger id="tipo_evento"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DESVIO_ROTA">Desvio de rota</SelectItem><SelectItem value="PARADA_NAO_AUTORIZADA">Parada não autorizada</SelectItem>
                    <SelectItem value="SINISTRO">Sinistro</SelectItem><SelectItem value="FURTO">Furto</SelectItem><SelectItem value="ROUBO">Roubo</SelectItem>
                    <SelectItem value="AVARIA">Avaria</SelectItem><SelectItem value="INFRACAO_TRANSITO">Infração de trânsito</SelectItem><SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="tipo_evento_outro">Se "Outro", especifique</Label><Input id="tipo_evento_outro" name="tipo_evento_outro" defaultValue={s.tipo_evento_outro ?? ""} maxLength={255} /></div>
              <div className="space-y-2"><Label htmlFor="implemento_equipamento">Implemento/equipamento</Label><Input id="implemento_equipamento" name="implemento_equipamento" defaultValue={s.implemento_equipamento ?? ""} maxLength={255} /></div>
              <div className="space-y-2"><Label htmlFor="data">Data da ocorrência *</Label><Input id="data" name="data" type="date" required defaultValue={s.data ?? ""} /></div>
              <div className="space-y-2"><Label htmlFor="hora">Hora</Label><Input id="hora" name="hora" type="time" defaultValue={s.hora ?? ""} /></div>
              <div className="space-y-2"><Label htmlFor="tipo">Tipo</Label><Input id="tipo" name="tipo" defaultValue={s.tipo ?? ""} maxLength={255} /></div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-3"><Label htmlFor="local">Local da ocorrência</Label><Input id="local" name="local" defaultValue={s.local ?? ""} maxLength={255} /></div>
              <div className="space-y-2"><Label htmlFor="nome_empregado">Empregado envolvido</Label><Input id="nome_empregado" name="nome_empregado" defaultValue={s.nome_empregado ?? ""} maxLength={255} /></div>
              <div className="space-y-2"><Label htmlFor="funcao_empregado">Função</Label><Input id="funcao_empregado" name="funcao_empregado" defaultValue={s.funcao_empregado ?? "Motorista"} maxLength={255} /></div>
              <div className="space-y-2"><Label htmlFor="matricula_empregado">Matrícula</Label><Input id="matricula_empregado" name="matricula_empregado" defaultValue={s.matricula_empregado ?? ""} maxLength={100} /></div>
              <div className="space-y-2"><Label htmlFor="supervisor">Supervisor imediato</Label><Input id="supervisor" name="supervisor" defaultValue={s.supervisor ?? ""} maxLength={255} /></div>
            </div>

            <div className="space-y-2"><Label htmlFor="descricao_fatos">Descrição objetiva dos fatos</Label><Textarea id="descricao_fatos" name="descricao_fatos" rows={4} defaultValue={s.descricao_fatos ?? s.descricao ?? ""} /></div>
            <div className="space-y-2"><Label htmlFor="versao_empregado">Versão do empregado</Label><Textarea id="versao_empregado" name="versao_empregado" rows={3} defaultValue={s.versao_empregado ?? ""} /></div>

            <div>
              <Label className="mb-2 block">Evidências coletadas</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {EVIDENCIA_OPCOES.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm"><Checkbox name={`ev_${key}`} defaultChecked={evidenciasSet.has(key)} />{label}</label>
                ))}
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="descricao_evidencias">Descrição das evidências</Label><Textarea id="descricao_evidencias" name="descricao_evidencias" rows={2} defaultValue={s.descricao_evidencias ?? ""} /></div>

            <div>
              <Label className="mb-2 block">Danos e prejuízos</Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <label className="flex items-center gap-2 text-sm"><Checkbox name="dano_material" defaultChecked={!!s.dano_material} />Dano material</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox name="dano_terceiro" defaultChecked={!!s.dano_terceiro} />Dano a terceiro</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox name="dano_carga" defaultChecked={!!s.dano_carga} />Dano à carga</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox name="dano_veiculo" defaultChecked={!!s.dano_veiculo} />Dano ao veículo</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox name="franquia_seguro" defaultChecked={!!s.franquia_seguro} />Houve franquia</label>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="valor_estimado_inicial">Valor estimado inicial</Label><Input id="valor_estimado_inicial" name="valor_estimado_inicial" type="number" step="0.01" defaultValue={s.valor_estimado_inicial ?? undefined} /></div>
              <div className="space-y-2"><Label htmlFor="valor_comprovado">Valor comprovado</Label><Input id="valor_comprovado" name="valor_comprovado" type="number" step="0.01" defaultValue={s.valor_comprovado ?? undefined} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="discriminacao_prejuizo">Discriminação individualizada do prejuízo</Label><Textarea id="discriminacao_prejuizo" name="discriminacao_prejuizo" rows={3} defaultValue={s.discriminacao_prejuizo ?? ""} /></div>

            <Button type="submit">Salvar ocorrência</Button>
          </form>
        </CardContent></Card>
      </TabsContent>

      {/* APURAÇÃO */}
      <TabsContent value="apuracao">
        <Card className="rounded-lg"><CardContent className="p-6">
          <form action={salvarApuracao} className="space-y-6">
            <div>
              <Label className="mb-2 block">Manifestação do empregado</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="data_notificacao_defesa">Data da notificação para defesa</Label><Input id="data_notificacao_defesa" name="data_notificacao_defesa" type="date" defaultValue={s.data_notificacao_defesa ?? ""} /></div>
                <div className="space-y-2"><Label htmlFor="forma_defesa">Forma da defesa</Label>
                  <Select name="forma_defesa" defaultValue={s.forma_defesa ?? ""}>
                    <SelectTrigger id="forma_defesa"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent><SelectItem value="ESCRITA">Escrita</SelectItem><SelectItem value="ORAL">Oral reduzida a termo</SelectItem><SelectItem value="ESCRITA_E_ORAL">Escrita e oral</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm"><Checkbox name="prazo_defesa_concedido" defaultChecked={!!s.prazo_defesa_concedido} />Prazo de 48h concedido</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox name="defesa_apresentada" defaultChecked={!!s.defesa_apresentada} />Defesa apresentada</label>
              </div>
            </div>

            <div className="border-t pt-6">
              <Label className="mb-2 block">Conclusão técnica da apuração</Label>
              <div className="flex flex-wrap gap-4 mb-3">
                <label className="flex items-center gap-2 text-sm"><Checkbox name="houve_violacao_procedimento" defaultChecked={!!s.houve_violacao_procedimento} />Houve violação de procedimento</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox name="nexo_causal" defaultChecked={!!s.nexo_causal} />Houve nexo causal com o prejuízo</label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="norma_violada">Norma violada</Label><Input id="norma_violada" name="norma_violada" defaultValue={s.norma_violada ?? ""} maxLength={255} /></div>
                <div className="space-y-2"><Label htmlFor="indicio">Indício</Label>
                  <Select name="indicio" defaultValue={s.indicio ?? ""}>
                    <SelectTrigger id="indicio"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent><SelectItem value="CULPA">Culpa</SelectItem><SelectItem value="DOLO">Dolo</SelectItem><SelectItem value="AUSENCIA_RESPONSABILIDADE">Ausência de responsabilidade</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label htmlFor="medida_adotada">Medida adotada</Label>
                  <Select name="medida_adotada" defaultValue={s.medida_adotada ?? ""}>
                    <SelectTrigger id="medida_adotada"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORIENTACAO">Orientação</SelectItem><SelectItem value="ADVERTENCIA">Advertência</SelectItem><SelectItem value="SUSPENSAO">Suspensão de dias</SelectItem>
                      <SelectItem value="DESLIGAMENTO">Desligamento</SelectItem><SelectItem value="RESSARCIMENTO">Ressarcimento</SelectItem><SelectItem value="ARQUIVAMENTO">Arquivamento</SelectItem><SelectItem value="OUTRA">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label htmlFor="medida_adotada_outra">Se "Outra", especifique</Label><Input id="medida_adotada_outra" name="medida_adotada_outra" defaultValue={s.medida_adotada_outra ?? ""} maxLength={255} /></div>
                <div className="space-y-2"><Label htmlFor="valor_ressarcimento">Valor de ressarcimento (desconto em folha)</Label><Input id="valor_ressarcimento" name="valor_ressarcimento" type="number" step="0.01" defaultValue={s.valor_ressarcimento ?? undefined} /></div>
              </div>
              <div className="mt-4 space-y-2"><Label htmlFor="fundamentacao_objetiva">Fundamentação objetiva</Label><Textarea id="fundamentacao_objetiva" name="fundamentacao_objetiva" rows={3} defaultValue={s.fundamentacao_objetiva ?? ""} /></div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="responsavel_tecnico">Responsável técnico</Label><Input id="responsavel_tecnico" name="responsavel_tecnico" defaultValue={s.responsavel_tecnico ?? ""} maxLength={255} /></div>
                <div className="space-y-2"><Label htmlFor="cargo_responsavel_tecnico">Cargo/função</Label><Input id="cargo_responsavel_tecnico" name="cargo_responsavel_tecnico" defaultValue={s.cargo_responsavel_tecnico ?? ""} maxLength={255} /></div>
              </div>
            </div>
            <Button type="submit">Salvar apuração</Button>
          </form>
        </CardContent></Card>
      </TabsContent>

      {/* SEGURO & REPARO */}
      <TabsContent value="seguro">
        <Card className="rounded-lg"><CardContent className="p-6">
          <form action={salvarSeguro} className="space-y-6">
            <div>
              <Label className="mb-2 block text-sm font-semibold">Seguro</Label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2"><Label htmlFor="boletim_ocorrencia">Boletim de ocorrência</Label><Input id="boletim_ocorrencia" name="boletim_ocorrencia" defaultValue={s.boletim_ocorrencia ?? ""} maxLength={255} /></div>
                <div className="space-y-2"><Label htmlFor="seguradora">Seguradora</Label><Input id="seguradora" name="seguradora" defaultValue={s.seguradora ?? ""} maxLength={255} /></div>
                <div className="space-y-2"><Label htmlFor="apolice">Apólice</Label><Input id="apolice" name="apolice" defaultValue={s.apolice ?? ""} maxLength={255} /></div>
                <div className="space-y-2"><Label htmlFor="numero_sinistro">Número do sinistro (seguradora)</Label><Input id="numero_sinistro" name="numero_sinistro" defaultValue={s.numero_sinistro ?? ""} maxLength={255} /></div>
                <div className="space-y-2"><Label htmlFor="franquia">Franquia</Label><Input id="franquia" name="franquia" type="number" step="0.01" defaultValue={s.franquia ?? undefined} /></div>
                <div className="space-y-2"><Label htmlFor="valor_estimado">Valor estimado</Label><Input id="valor_estimado" name="valor_estimado" type="number" step="0.01" defaultValue={s.valor_estimado ?? undefined} /></div>
                <div className="space-y-2"><Label htmlFor="valor_aprovado">Valor aprovado</Label><Input id="valor_aprovado" name="valor_aprovado" type="number" step="0.01" defaultValue={s.valor_aprovado ?? undefined} /></div>
                <div className="space-y-2"><Label htmlFor="valor_final">Valor final</Label><Input id="valor_final" name="valor_final" type="number" step="0.01" defaultValue={s.valor_final ?? undefined} /></div>
              </div>
            </div>
            <div className="border-t pt-6">
              <Label className="mb-2 block text-sm font-semibold">Reparação</Label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2"><Label htmlFor="oficina">Oficina</Label><Input id="oficina" name="oficina" defaultValue={s.oficina ?? ""} maxLength={255} /></div>
                <div className="space-y-2"><Label htmlFor="data_entrada">Data de entrada</Label><Input id="data_entrada" name="data_entrada" type="date" defaultValue={s.data_entrada ?? ""} /></div>
                <div className="space-y-2"><Label htmlFor="previsao_saida">Previsão de saída</Label><Input id="previsao_saida" name="previsao_saida" type="date" defaultValue={s.previsao_saida ?? ""} /></div>
                <div className="space-y-2"><Label htmlFor="data_saida">Data de saída</Label><Input id="data_saida" name="data_saida" type="date" defaultValue={s.data_saida ?? ""} /></div>
                <div className="space-y-2"><Label htmlFor="orcamento">Orçamento</Label><Input id="orcamento" name="orcamento" type="number" step="0.01" defaultValue={s.orcamento ?? undefined} /></div>
                <div className="space-y-2"><Label htmlFor="reparo_valor_aprovado">Valor aprovado (reparo)</Label><Input id="reparo_valor_aprovado" name="reparo_valor_aprovado" type="number" step="0.01" defaultValue={s.reparo_valor_aprovado ?? undefined} /></div>
                <div className="space-y-2"><Label htmlFor="reparo_valor_final">Valor final (reparo)</Label><Input id="reparo_valor_final" name="reparo_valor_final" type="number" step="0.01" defaultValue={s.reparo_valor_final ?? undefined} /></div>
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" name="observacoes" rows={3} defaultValue={s.observacoes ?? ""} /></div>
            <Button type="submit">Salvar seguro/reparo</Button>
          </form>
        </CardContent></Card>
      </TabsContent>

      {/* TERCEIRO & QUITAÇÃO */}
      <TabsContent value="terceiro">
        <Card className="rounded-lg"><CardContent className="p-6">
          <form action={salvarTerceiro} className="space-y-6">
            <div>
              <Label className="mb-2 block text-sm font-semibold">Dados do terceiro/proprietário</Label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2"><Label htmlFor="terceiro_nome">Nome</Label><Input id="terceiro_nome" name="terceiro_nome" defaultValue={s.terceiro_nome ?? ""} maxLength={255} /></div>
                <div className="space-y-2"><Label htmlFor="terceiro_rg">RG</Label><Input id="terceiro_rg" name="terceiro_rg" defaultValue={s.terceiro_rg ?? ""} maxLength={30} /></div>
                <div className="space-y-2"><Label htmlFor="terceiro_cpf">CPF</Label><Input id="terceiro_cpf" name="terceiro_cpf" defaultValue={s.terceiro_cpf ?? ""} maxLength={20} /></div>
                <div className="space-y-2"><Label htmlFor="terceiro_cnh">CNH</Label><Input id="terceiro_cnh" name="terceiro_cnh" defaultValue={s.terceiro_cnh ?? ""} maxLength={30} /></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="terceiro_endereco">Endereço</Label><Input id="terceiro_endereco" name="terceiro_endereco" defaultValue={s.terceiro_endereco ?? ""} maxLength={500} /></div>
              </div>
            </div>
            <div className="border-t pt-6">
              <Label className="mb-2 block text-sm font-semibold">Termo de quitação</Label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2"><Label htmlFor="quitacao_valor">Valor do acordo</Label><Input id="quitacao_valor" name="quitacao_valor" type="number" step="0.01" defaultValue={s.quitacao_valor ?? undefined} /></div>
                <div className="space-y-2"><Label htmlFor="quitacao_data">Data do acordo</Label><Input id="quitacao_data" name="quitacao_data" type="date" defaultValue={s.quitacao_data ?? ""} /></div>
                <div className="space-y-2"><Label htmlFor="quitacao_forma_pagamento">Forma de pagamento</Label><Input id="quitacao_forma_pagamento" name="quitacao_forma_pagamento" defaultValue={s.quitacao_forma_pagamento ?? "Transferência bancária"} maxLength={255} /></div>
                <div className="space-y-2"><Label htmlFor="quitacao_banco">Banco</Label><Input id="quitacao_banco" name="quitacao_banco" defaultValue={s.quitacao_banco ?? ""} maxLength={255} /></div>
                <div className="space-y-2"><Label htmlFor="quitacao_agencia">Agência</Label><Input id="quitacao_agencia" name="quitacao_agencia" defaultValue={s.quitacao_agencia ?? ""} maxLength={50} /></div>
                <div className="space-y-2"><Label htmlFor="quitacao_conta">Conta corrente</Label><Input id="quitacao_conta" name="quitacao_conta" defaultValue={s.quitacao_conta ?? ""} maxLength={50} /></div>
                <div className="space-y-2"><Label htmlFor="quitacao_pix">Chave PIX</Label><Input id="quitacao_pix" name="quitacao_pix" defaultValue={s.quitacao_pix ?? ""} maxLength={255} /></div>
                <div className="space-y-2"><Label htmlFor="representante_empresa">Representante da empresa</Label><Input id="representante_empresa" name="representante_empresa" defaultValue={s.representante_empresa ?? ""} maxLength={255} /></div>
              </div>
            </div>
            <Button type="submit">Salvar terceiro/quitação</Button>
          </form>
        </CardContent></Card>
      </TabsContent>

      {/* DOCUMENTOS */}
      <TabsContent value="documentos">
        <Tabs defaultValue="roo">
          <TabsList><TabsTrigger value="roo">Relatório de Ocorrência (ROO)</TabsTrigger><TabsTrigger value="quitacao">Termo de Quitação</TabsTrigger></TabsList>
          <TabsContent value="roo"><RooPrintView s={s} /></TabsContent>
          <TabsContent value="quitacao"><QuitacaoPrintView s={s} /></TabsContent>
        </Tabs>
      </TabsContent>

      {/* HISTÓRICO */}
      <TabsContent value="historico">
        <Card className="rounded-lg"><CardContent className="divide-y p-6">
          {data.timeline.length ? data.timeline.map(h => (
            <div key={h.id} className="py-4 first:pt-0">
              <div className="flex justify-between gap-3"><p className="text-sm font-semibold">{h.titulo}</p><span className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</span></div>
              {h.descricao && <p className="mt-1 text-sm text-muted-foreground">{h.descricao}</p>}
            </div>
          )) : <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>}
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="anexos"><AnexosPanel entidade="sinistro" entidadeId={sinistroId} files={data.anexos} queryKey={["sinistro", sinistroId]} /></TabsContent>
    </Tabs>
  </>;
}

const EVIDENCIA_LABEL: Record<string, string> = Object.fromEntries(EVIDENCIA_OPCOES);
const TIPO_EVENTO_LABEL: Record<string, string> = { DESVIO_ROTA: "Desvio de rota", PARADA_NAO_AUTORIZADA: "Parada não autorizada", SINISTRO: "Sinistro", FURTO: "Furto", ROUBO: "Roubo", AVARIA: "Avaria", INFRACAO_TRANSITO: "Infração de trânsito", OUTRO: "Outro" };

function RooPrintView({ s }: { s: any }) {
  const evidencias: string[] = s.evidencias ?? [];
  return (
    <div>
      <div className="mb-4 flex justify-end print:hidden"><Button size="sm" onClick={() => window.print()}><Printer className="mr-2 size-4" />Imprimir ROO</Button></div>
      <Card className="rounded-lg"><CardContent className="p-8 text-sm leading-relaxed">
        <h2 className="mb-4 text-center text-base font-bold uppercase">Relatório de Ocorrência Operacional (ROO)</h2>
        <Field label="Número do ROO" value={s.numero_roo} /><Field label="Data de abertura" value={formatDate(s.created_at)} />
        <Field label="Unidade/filial" value={s.unidade_filial} /><Field label="Setor responsável" value={s.setor_responsavel} />
        <Field label="Responsável pelo preenchimento" value={s.responsavel_preenchimento} /><Field label="Cargo/função" value={s.cargo_responsavel} />
        <h3 className="mb-2 mt-6 font-semibold uppercase">Qualificação do evento</h3>
        <Field label="Tipo do evento" value={TIPO_EVENTO_LABEL[s.tipo_evento] ?? s.tipo_evento} />
        <Field label="Data da ocorrência" value={formatDate(s.data)} /><Field label="Hora" value={s.hora} />
        <Field label="Local" value={s.local} /><Field label="Veículo/placa" value={s.veiculos?.placa} />
        <Field label="Implemento/equipamento" value={s.implemento_equipamento} />
        <Field label="Empregado envolvido" value={s.nome_empregado} /><Field label="Função" value={s.funcao_empregado} />
        <Field label="Matrícula" value={s.matricula_empregado} /><Field label="Supervisor imediato" value={s.supervisor} />
        <h3 className="mb-2 mt-6 font-semibold uppercase">Descrição objetiva dos fatos</h3>
        <p className="whitespace-pre-wrap text-muted-foreground">{s.descricao_fatos || s.descricao || "—"}</p>
        <h3 className="mb-2 mt-6 font-semibold uppercase">Versão do empregado</h3>
        <p className="whitespace-pre-wrap text-muted-foreground">{s.versao_empregado || "—"}</p>
        <h3 className="mb-2 mt-6 font-semibold uppercase">Evidências coletadas</h3>
        <p>{evidencias.length ? evidencias.map(e => EVIDENCIA_LABEL[e] ?? e).join(", ") : "—"}</p>
        {s.descricao_evidencias && <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{s.descricao_evidencias}</p>}
        <h3 className="mb-2 mt-6 font-semibold uppercase">Danos e prejuízos</h3>
        <Field label="Dano material" value={s.dano_material ? "Sim" : "Não"} /><Field label="Dano a terceiro" value={s.dano_terceiro ? "Sim" : "Não"} />
        <Field label="Dano à carga" value={s.dano_carga ? "Sim" : "Não"} /><Field label="Dano ao veículo" value={s.dano_veiculo ? "Sim" : "Não"} />
        <Field label="Houve franquia de seguro" value={s.franquia_seguro ? "Sim" : "Não"} />
        <Field label="Valor estimado inicial" value={formatCurrency(s.valor_estimado_inicial)} /><Field label="Valor comprovado" value={formatCurrency(s.valor_comprovado)} />
        {s.discriminacao_prejuizo && <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{s.discriminacao_prejuizo}</p>}
        <h3 className="mb-2 mt-6 font-semibold uppercase">Manifestação do empregado</h3>
        <Field label="Data da notificação" value={formatDate(s.data_notificacao_defesa)} />
        <Field label="Prazo de 48h concedido" value={s.prazo_defesa_concedido ? "Sim" : "Não"} />
        <Field label="Defesa apresentada" value={s.defesa_apresentada ? "Sim" : "Não"} /><Field label="Forma da defesa" value={s.forma_defesa} />
        <h3 className="mb-2 mt-6 font-semibold uppercase">Conclusão técnica</h3>
        <Field label="Houve violação de procedimento" value={s.houve_violacao_procedimento ? "Sim" : "Não"} /><Field label="Norma violada" value={s.norma_violada} />
        <Field label="Nexo causal" value={s.nexo_causal ? "Sim" : "Não"} /><Field label="Indício" value={s.indicio} />
        <Field label="Medida adotada" value={s.medida_adotada_outra || s.medida_adotada} /><Field label="Valor de ressarcimento" value={formatCurrency(s.valor_ressarcimento)} />
        {s.fundamentacao_objetiva && <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{s.fundamentacao_objetiva}</p>}
        <div className="mt-10 grid grid-cols-2 gap-10 text-center text-xs">
          <div><div className="mb-1 border-t border-foreground pt-2">AA Alternativa Transporte LTDA</div></div>
          <div><div className="mb-1 border-t border-foreground pt-2">{s.nome_empregado || "Empregado"}</div></div>
          <div><div className="mb-1 border-t border-foreground pt-2">Gestor da área</div></div>
          <div><div className="mb-1 border-t border-foreground pt-2">{s.responsavel_tecnico || "Responsável técnico"}</div></div>
        </div>
      </CardContent></Card>
    </div>
  );
}

function QuitacaoPrintView({ s }: { s: any }) {
  return (
    <div>
      <div className="mb-4 flex justify-end print:hidden"><Button size="sm" onClick={() => window.print()}><Printer className="mr-2 size-4" />Imprimir Termo</Button></div>
      <Card className="rounded-lg"><CardContent className="p-8 text-sm leading-relaxed">
        <h2 className="mb-4 text-center text-base font-bold uppercase">Termo de Quitação de Sinistro</h2>
        <p className="mb-4">Pelo presente instrumento particular, de um lado <b>AA Alternativa Transportes LTDA</b>, doravante denominada simplesmente <b>AA Alternativa</b>, representada por <b>{s.representante_empresa || "____________________"}</b>; e, de outro lado, <b>{s.terceiro_nome || "____________________"}</b>, portador do RG n.º {s.terceiro_rg || "____________"}, CNH n.º {s.terceiro_cnh || "____________"}, inscrito no CPF sob o n.º {s.terceiro_cpf || "____________"}, residente em {s.terceiro_endereco || "____________________"}, doravante denominado simplesmente <b>Proprietário</b>.</p>
        <p className="mb-2">Têm entre si justo e acertado o seguinte:</p>
        <p className="mb-2"><b>1.</b> Em razão do acidente ocorrido em {formatDate(s.data)}{s.hora ? `, por volta das ${s.hora}` : ""}, em {s.local || "____________________"}, envolvendo o veículo da empresa AA Alternativa, placa {s.veiculos?.placa || "____________"}, as partes celebram o presente acordo para plena, total e irrestrita quitação das obrigações decorrentes do mencionado evento.</p>
        <p className="mb-2"><b>2.</b> AA Alternativa pagará ao Proprietário o valor de {formatCurrency(s.quitacao_valor)}, em parcela única, a título de indenização pelo sinistro ocorrido, sem que isso implique em qualquer assunção de culpa ou responsabilidade por parte da AA Alternativa, consistindo em mera liberalidade.</p>
        <p className="mb-2"><b>3.</b> O pagamento será efetuado por meio de {s.quitacao_forma_pagamento || "transferência bancária"} para a conta indicada pelo Proprietário: Banco {s.quitacao_banco || "____"}, Agência {s.quitacao_agencia || "____"}, Conta {s.quitacao_conta || "____"}{s.quitacao_pix ? `, Chave PIX ${s.quitacao_pix}` : ""}.</p>
        <p className="mb-2"><b>4.</b> O presente acordo é celebrado em caráter estritamente negocial, com o objetivo de prevenir litígios, não implicando reconhecimento de culpa ou responsabilidade civil ou criminal por qualquer das partes.</p>
        <p className="mb-2"><b>5.</b> O Proprietário, ao receber a quantia mencionada, declara plena, geral, irrevogável e irretratável quitação à AA Alternativa, seus sócios, representantes legais, empregados e prepostos, nada mais tendo a reclamar a qualquer título relacionado ao evento.</p>
        <p className="mb-2"><b>6.</b> Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes deste Termo.</p>
        <p className="mt-6">São Paulo, {formatDate(s.quitacao_data) !== "—" ? formatDate(s.quitacao_data) : "____ de ____________ de 2026"}.</p>
        <div className="mt-10 grid grid-cols-2 gap-10 text-center text-xs">
          <div><div className="mb-1 border-t border-foreground pt-2">AA Alternativa Transportes LTDA<br />por: {s.representante_empresa || "____________________"}</div></div>
          <div><div className="mb-1 border-t border-foreground pt-2">{s.terceiro_nome || "Proprietário"}</div></div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-10 text-center text-xs">
          <div><div className="mb-1 border-t border-foreground pt-2">Testemunha 1 — Nome/CPF</div></div>
          <div><div className="mb-1 border-t border-foreground pt-2">Testemunha 2 — Nome/CPF</div></div>
        </div>
      </CardContent></Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <p><span className="font-semibold">{label}:</span> {value || "—"}</p>;
}
