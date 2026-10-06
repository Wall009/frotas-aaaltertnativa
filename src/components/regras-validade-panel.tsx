import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchRegras, faixaTexto, idadeVeiculo, mesesTexto, regraAplicavel, regrasDoTipo, regrasTable, type RegraValidade } from "@/lib/validade";

type Tipo = { codigo: string; nome: string };
type Dialogo = { tipo: string; regra: RegraValidade | null };

export function RegrasValidadePanel({ tipos }: { tipos: Tipo[] }) {
  const queryClient = useQueryClient();
  const { data: regras = [] } = useQuery({ queryKey: ["regras_validade"], queryFn: fetchRegras });
  const { data: veiculos = [] } = useQuery({ queryKey: ["veiculos-anos"], queryFn: async () => { const r = await supabase.from("veiculos").select("id, status, ano_fabricacao, ano_modelo"); if (r.error) throw r.error; return r.data; } });
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);

  const ativos = useMemo(() => veiculos.filter(v => v.status !== "VENDIDO"), [veiculos]);

  const atualizar = async () => { await queryClient.invalidateQueries({ queryKey: ["regras_validade"] }); };

  const excluir = async (regra: RegraValidade) => {
    if (!window.confirm(`Excluir a faixa de ${regra.a_partir_de_anos} anos do ${regra.tipo_codigo}?`)) return;
    const { error } = await regrasTable().delete().eq("id", regra.id);
    if (error) { toast.error("Não foi possível excluir", { description: error.message }); return; }
    toast.success("Faixa excluída");
    await atualizar();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p><b>Como funciona:</b> para cada documento, defina por quantos meses ele vale. Quando o prazo muda conforme a <b>idade do caminhão</b>, crie faixas — por exemplo, <i>AMLURB: de 0 anos → 12 meses; a partir de 10 anos → 6 meses</i>.</p>
        <p className="mt-1">A idade é calculada pelo <b>ano de fabricação</b> do veículo (ou o ano do modelo, se faltar). Ao informar a data de emissão de um documento, o vencimento é calculado com a faixa que vale para aquele veículo — e ainda dá pra ajustar à mão.</p>
      </div>

      {tipos.map(tipo => {
        const doTipo = regrasDoTipo(regras, tipo.codigo);
        const porRegra = new Map<string, number>();
        let semAno = 0;
        for (const v of ativos) {
          const idade = idadeVeiculo(v.ano_fabricacao, v.ano_modelo);
          if (idade === null) semAno += 1;
          const r = regraAplicavel(regras, tipo.codigo, idade);
          if (r) porRegra.set(r.id, (porRegra.get(r.id) ?? 0) + 1);
        }
        const semBase = doTipo.length > 0 && !doTipo.some(r => r.a_partir_de_anos === 0);
        return (
          <div key={tipo.codigo} className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{tipo.codigo}</p>
                <p className="text-xs text-muted-foreground">{tipo.nome}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setDialogo({ tipo: tipo.codigo, regra: null })}><Plus className="mr-2 size-4" />Adicionar faixa</Button>
            </div>

            {doTipo.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Sem regra definida — as datas deste documento são informadas à mão.</p>
            ) : (
              <ul className="mt-3 divide-y rounded-md border">
                {doTipo.map((r, i) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{faixaTexto(doTipo, i)} → {mesesTexto(r.validade_meses)}</p>
                      <p className="text-xs text-muted-foreground">{porRegra.get(r.id) ?? 0} veículo(s) ativo(s) nesta faixa{r.observacao ? ` · ${r.observacao}` : ""}</p>
                    </div>
                    <Button size="icon" variant="ghost" title="Editar" onClick={() => setDialogo({ tipo: tipo.codigo, regra: r })}><Pencil className="size-4" /></Button>
                    <Button size="icon" variant="ghost" title="Excluir" onClick={() => excluir(r)}><Trash2 className="size-4 text-destructive" /></Button>
                  </li>
                ))}
              </ul>
            )}
            {semBase && <p className="mt-2 text-xs text-warning-foreground">Atenção: não há faixa começando em 0 anos — os veículos mais novos usam a primeira faixa cadastrada.</p>}
            {doTipo.length > 0 && semAno > 0 && <p className="mt-2 text-xs text-muted-foreground">{semAno} veículo(s) sem ano informado usam a faixa base.</p>}
          </div>
        );
      })}

      <RegraDialog dialogo={dialogo} onClose={() => setDialogo(null)} onSaved={atualizar} />
    </div>
  );
}

function RegraDialog({ dialogo, onClose, onSaved }: { dialogo: Dialogo | null; onClose: () => void; onSaved: () => Promise<void> }) {
  return (
    <Dialog open={dialogo !== null} onOpenChange={open => { if (!open) onClose(); }}>
      {dialogo && (
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogo.regra ? "Editar faixa" : "Nova faixa"} — {dialogo.tipo}</DialogTitle>
            <DialogDescription>Defina a partir de quantos anos de idade do veículo esta validade passa a valer.</DialogDescription>
          </DialogHeader>
          <FormularioRegra key={dialogo.regra?.id ?? "nova"} dialogo={dialogo} onClose={onClose} onSaved={onSaved} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function FormularioRegra({ dialogo, onClose, onSaved }: { dialogo: Dialogo; onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const anos = Number(fd.get("a_partir_de_anos"));
    const meses = Number(fd.get("validade_meses"));
    const observacao = String(fd.get("observacao") ?? "").trim() || null;
    if (!Number.isInteger(anos) || anos < 0) { toast.error("Informe a idade mínima em anos (0 ou mais)."); return; }
    if (!Number.isInteger(meses) || meses <= 0) { toast.error("Informe a validade em meses (1 ou mais)."); return; }
    setSaving(true);
    const valores = { tipo_codigo: dialogo.tipo, a_partir_de_anos: anos, validade_meses: meses, observacao };
    const { error } = dialogo.regra ? await regrasTable().update(valores).eq("id", dialogo.regra.id) : await regrasTable().insert(valores);
    setSaving(false);
    if (error) {
      toast.error(error.message.toLowerCase().includes("duplicate") ? `Já existe uma faixa começando em ${anos} anos para ${dialogo.tipo}.` : "Não foi possível salvar", error.message.toLowerCase().includes("duplicate") ? {} : { description: error.message });
      return;
    }
    toast.success("Faixa salva");
    onClose();
    await onSaved();
  };

  return (
    <form onSubmit={submit}>
      <div className="grid gap-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="a_partir_de_anos">Veículos com idade a partir de (anos)</Label>
          <Input id="a_partir_de_anos" name="a_partir_de_anos" type="number" min="0" max="60" required defaultValue={String(dialogo.regra?.a_partir_de_anos ?? 0)} />
          <p className="text-xs text-muted-foreground">Use 0 para a faixa base (vale para todos os veículos até a próxima faixa).</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="validade_meses">Validade (meses)</Label>
          <Input id="validade_meses" name="validade_meses" type="number" min="1" max="240" required defaultValue={dialogo.regra ? String(dialogo.regra.validade_meses) : ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="observacao">Observação</Label>
          <Input id="observacao" name="observacao" maxLength={255} defaultValue={dialogo.regra?.observacao ?? ""} placeholder="Ex.: exigência do órgão para veículos antigos" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
      </DialogFooter>
    </form>
  );
}
