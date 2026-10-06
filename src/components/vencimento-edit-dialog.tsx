import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";
import { addMonthsISO, faixaTexto, idadeVeiculo, mesesTexto, regraAplicavel, regrasDoTipo, vencimentosTable, type DadosAnoVeiculo, type RegraValidade, type VencimentoRow } from "@/lib/validade";

const STATUS_OPCOES: Array<readonly [string, string]> = [
  ["PENDENTE", "Pendente — o sistema calcula pelo prazo"],
  ["EM PROCESSO", "Em processo — renovação em andamento"],
  ["DEFERIDO", "Deferido — renovação concedida"],
  ["NAO SE APLICA", "Não se aplica — não exigido para este veículo"],
];

type Props = { row: VencimentoRow | null; placa: string; veiculo: DadosAnoVeiculo | null; regras: RegraValidade[]; onClose: () => void };

export function VencimentoEditDialog({ row, placa, veiculo, regras, onClose }: Props) {
  return (
    <Dialog open={row !== null} onOpenChange={open => { if (!open) onClose(); }}>
      {row && (
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{row.descricao || row.tipo_codigo || "Documento"}</DialogTitle>
            <DialogDescription>Veículo {placa}. Informe quando o documento foi emitido/renovado e por quanto tempo vale — o vencimento é calculado.</DialogDescription>
          </DialogHeader>
          <FormularioVencimento key={row.id} row={row} veiculo={veiculo} regras={regras} onClose={onClose} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function FormularioVencimento({ row, veiculo, regras, onClose }: { row: VencimentoRow; veiculo: DadosAnoVeiculo | null; regras: RegraValidade[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const idade = idadeVeiculo(veiculo?.anoFabricacao, veiculo?.anoModelo);
  const doTipo = regrasDoTipo(regras, row.tipo_codigo);
  const regra = regraAplicavel(regras, row.tipo_codigo, idade);

  const [emissao, setEmissao] = useState(row.data_emissao ?? "");
  const [validade, setValidade] = useState(row.validade_meses != null ? String(row.validade_meses) : regra ? String(regra.validade_meses) : "");
  const [vencimento, setVencimento] = useState(row.data_vencimento ?? "");

  const recalcular = (novaEmissao: string, novaValidade: string) => {
    const meses = Number(novaValidade);
    if (novaEmissao && Number.isFinite(meses) && meses > 0) {
      const calculado = addMonthsISO(novaEmissao, meses);
      if (calculado) setVencimento(calculado);
    }
  };

  const opcoes = [...STATUS_OPCOES];
  if (!opcoes.some(([valor]) => valor === row.status)) opcoes.push([row.status, row.status]);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const text = (key: string) => String(fd.get(key) ?? "").trim() || null;
    const novoStatus = text("status") ?? row.status;
    const novoResponsavel = text("responsavel");
    const novaObs = text("observacoes");
    const mesesNum = Number(validade);
    const novaValidade = Number.isFinite(mesesNum) && mesesNum > 0 ? Math.round(mesesNum) : null;
    const novaEmissao = emissao || null;
    const novoVencimento = vencimento || null;

    setSaving(true);
    const { error } = await vencimentosTable()
      .update({ data_emissao: novaEmissao, validade_meses: novaValidade, data_vencimento: novoVencimento, status: novoStatus, responsavel: novoResponsavel, observacoes: novaObs })
      .eq("id", row.id);
    if (error) {
      setSaving(false);
      toast.error("Não foi possível salvar", { description: error.message });
      return;
    }

    // Registro de auditoria (melhor esforço — não bloqueia o salvamento)
    const documento = row.descricao || row.tipo_codigo || "Documento";
    const mudancas: Array<{ campo: string; antes: string | null; depois: string | null }> = [];
    const fmt = (v: string | null | undefined) => (v ? formatDate(v) : null);
    if ((row.data_vencimento ?? null) !== novoVencimento) mudancas.push({ campo: "data de vencimento", antes: fmt(row.data_vencimento), depois: fmt(novoVencimento) });
    if ((row.data_emissao ?? null) !== novaEmissao) mudancas.push({ campo: "data de emissão", antes: fmt(row.data_emissao), depois: fmt(novaEmissao) });
    if ((row.validade_meses ?? null) !== novaValidade) mudancas.push({ campo: "validade (meses)", antes: row.validade_meses != null ? String(row.validade_meses) : null, depois: novaValidade != null ? String(novaValidade) : null });
    if (row.status !== novoStatus) mudancas.push({ campo: "status", antes: row.status, depois: novoStatus });
    if ((row.responsavel ?? null) !== novoResponsavel) mudancas.push({ campo: "responsável", antes: row.responsavel ?? null, depois: novoResponsavel });
    if (mudancas.length > 0) {
      await supabase.from("historico").insert(
        mudancas.map(m => ({ entidade: "vencimento", entidade_id: row.id, veiculo_id: row.veiculo_id, acao: "ALTERACAO", campo: `${documento} · ${m.campo}`, valor_anterior: m.antes, valor_novo: m.depois })),
      );
    }

    setSaving(false);
    toast.success("Vencimento atualizado");
    onClose();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["vencimentos-agenda"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ...(row.veiculo_id ? [queryClient.invalidateQueries({ queryKey: ["veiculo", row.veiculo_id] })] : []),
    ]);
  };

  return (
    <form onSubmit={submit}>
      <div className="grid gap-4 py-2">
        {!row.data_vencimento && row.vencimento_texto && (
          <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">Anotação que veio da planilha: <b>{row.vencimento_texto}</b></p>
        )}

        <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          {regra ? (
            <>
              <p><b>{row.tipo_codigo}</b>: {faixaTexto(doTipo, doTipo.findIndex(r => r.id === regra.id))} → <b>{mesesTexto(regra.validade_meses)}</b>.</p>
              <p className="mt-1">{idade !== null ? `Este veículo tem ${idade} ${idade === 1 ? "ano" : "anos"}.` : "O ano do veículo não está informado — vale a faixa base."}</p>
              {validade !== String(regra.validade_meses) && (
                <button type="button" className="mt-1 font-medium text-primary hover:underline" onClick={() => { setValidade(String(regra.validade_meses)); recalcular(emissao, String(regra.validade_meses)); }}>Usar {regra.validade_meses} meses (regra)</button>
              )}
            </>
          ) : (
            <p>Não há regra de validade cadastrada para <b>{row.tipo_codigo || "este tipo"}</b>. Informe a validade manualmente ou cadastre a regra em Documentação → Prazos de validade.</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="data_emissao">Emitido / renovado em</Label>
            <Input id="data_emissao" type="date" value={emissao} onChange={e => { setEmissao(e.target.value); recalcular(e.target.value, validade); }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validade_meses">Validade (meses)</Label>
            <Input id="validade_meses" type="number" min="1" max="240" value={validade} onChange={e => { setValidade(e.target.value); recalcular(emissao, e.target.value); }} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_vencimento">Data de vencimento</Label>
          <Input id="data_vencimento" type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} />
          <p className="text-xs text-muted-foreground">Calculada a partir da emissão + validade, mas pode ser ajustada à mão se o documento trouxer outra data.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={row.status}>
            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
            <SelectContent>{opcoes.map(([valor, rotulo]) => <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsavel">Responsável</Label>
          <Input id="responsavel" name="responsavel" maxLength={255} defaultValue={row.responsavel ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea id="observacoes" name="observacoes" rows={3} maxLength={2000} defaultValue={row.observacoes ?? ""} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
      </DialogFooter>
    </form>
  );
}
