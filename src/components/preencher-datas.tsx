import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, todayISO } from "@/lib/format";
import { addMonthsISO, idadeVeiculo, regraAplicavel, vencimentosTable, type DadosAnoVeiculo, type RegraValidade } from "@/lib/validade";

export type ItemPreencher = { id: string; veiculo_id: string | null; tipo_codigo: string | null; descricao: string | null; vencimento_texto: string | null };

type Valor = { emissao: string; validade: string; vencimento: string; naoSeAplica: boolean };
const VAZIO: Valor = { emissao: "", validade: "", vencimento: "", naoSeAplica: false };

const campo = "h-8 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40";

type Props = {
  itens: ItemPreencher[];
  plates: Map<string, string>;
  anos: Map<string, DadosAnoVeiculo>;
  regras: RegraValidade[];
  onSaved: () => Promise<void> | void;
};

export function PreencherDatas({ itens, plates, anos, regras, onSaved }: Props) {
  const [valores, setValores] = useState<Record<string, Valor>>({});
  const [tipoSel, setTipoSel] = useState<string>("TODOS");
  const [saving, setSaving] = useState(false);

  const tipos = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of itens) { const k = i.tipo_codigo ?? "OUTROS"; m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [itens]);

  const visiveis = useMemo(() => itens
    .filter(i => tipoSel === "TODOS" || (i.tipo_codigo ?? "OUTROS") === tipoSel)
    .sort((a, b) => (plates.get(a.veiculo_id ?? "") ?? "").localeCompare(plates.get(b.veiculo_id ?? "") ?? "")), [itens, tipoSel, plates]);

  const idadeDe = (item: ItemPreencher): number | null => {
    const a = item.veiculo_id ? anos.get(item.veiculo_id) : undefined;
    return idadeVeiculo(a?.anoFabricacao, a?.anoModelo);
  };
  const validadePadrao = (item: ItemPreencher): number | null => regraAplicavel(regras, item.tipo_codigo, idadeDe(item))?.validade_meses ?? null;
  const valorDe = (id: string): Valor => valores[id] ?? VAZIO;

  const atualizar = (id: string, patch: Partial<Valor>) => setValores(prev => ({ ...prev, [id]: { ...(prev[id] ?? VAZIO), ...patch } }));

  const recalcular = (item: ItemPreencher, emissao: string, validade: string): string | null => {
    const meses = Number(validade || validadePadrao(item) || 0);
    if (!emissao || !Number.isFinite(meses) || meses <= 0) return null;
    return addMonthsISO(emissao, meses);
  };

  const mudarEmissao = (item: ItemPreencher, emissao: string) => {
    const atual = valorDe(item.id);
    const calculado = recalcular(item, emissao, atual.validade);
    atualizar(item.id, { emissao, ...(calculado ? { vencimento: calculado } : {}) });
  };
  const mudarValidade = (item: ItemPreencher, validade: string) => {
    const atual = valorDe(item.id);
    const calculado = recalcular(item, atual.emissao, validade);
    atualizar(item.id, { validade, ...(calculado ? { vencimento: calculado } : {}) });
  };

  const preenchidos = itens.filter(i => { const v = valores[i.id]; return v !== undefined && (v.vencimento !== "" || v.naoSeAplica); });

  const salvar = async () => {
    if (preenchidos.length === 0) return;
    setSaving(true);
    const falhas: string[] = [];
    const salvos: ItemPreencher[] = [];

    for (let i = 0; i < preenchidos.length; i += 15) {
      const lote = preenchidos.slice(i, i + 15);
      const resultados = await Promise.all(lote.map(async item => {
        const v = valorDe(item.id);
        const meses = Number(v.validade || validadePadrao(item) || 0);
        const payload: Record<string, unknown> = v.naoSeAplica
          ? { status: "NAO SE APLICA" }
          : { data_emissao: v.emissao || null, validade_meses: Number.isFinite(meses) && meses > 0 ? Math.round(meses) : null, data_vencimento: v.vencimento || null };
        const { error } = await vencimentosTable().update(payload).eq("id", item.id);
        return { item, erro: error?.message ?? null };
      }));
      for (const r of resultados) { if (r.erro) falhas.push(`${plates.get(r.item.veiculo_id ?? "") ?? "?"} · ${r.item.tipo_codigo ?? ""}: ${r.erro}`); else salvos.push(r.item); }
    }

    if (salvos.length > 0) {
      await supabase.from("historico").insert(salvos.map(item => {
        const v = valorDe(item.id);
        return { entidade: "vencimento", entidade_id: item.id, veiculo_id: item.veiculo_id, acao: "PREENCHIMENTO EM LOTE", campo: `${item.descricao || item.tipo_codigo || "Documento"} · ${v.naoSeAplica ? "status" : "data de vencimento"}`, valor_anterior: null, valor_novo: v.naoSeAplica ? "Não se aplica" : formatDate(v.vencimento) };
      }));
      setValores(prev => { const n = { ...prev }; for (const s of salvos) delete n[s.id]; return n; });
    }
    setSaving(false);
    if (falhas.length > 0) toast.error(`${falhas.length} não puderam ser salvos`, { description: falhas.slice(0, 3).join(" | ") });
    if (salvos.length > 0) toast.success(`${salvos.length} documento${salvos.length === 1 ? "" : "s"} atualizado${salvos.length === 1 ? "" : "s"}`);
    await onSaved();
  };

  if (itens.length === 0) {
    return <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">Nenhum documento sem data. Tudo preenchido. ✅</div>;
  }

  const hoje = todayISO();

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
        Preencha a <b>data de emissão/renovação</b> e o sistema calcula o vencimento pela <b>regra de validade</b> do documento e pela idade do veículo — ou digite o vencimento direto. Marque <b>Não se aplica</b> quando o veículo não precisa daquele documento. Nada é gravado até clicar em <b>Salvar</b>.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={tipoSel === "TODOS" ? "default" : "outline"} onClick={() => setTipoSel("TODOS")}>Todos ({itens.length})</Button>
          {tipos.map(([codigo, qtd]) => (
            <Button key={codigo} size="sm" variant={tipoSel === codigo ? "default" : "outline"} onClick={() => setTipoSel(codigo)}>{codigo} ({qtd})</Button>
          ))}
        </div>
        <Button size="sm" disabled={saving || preenchidos.length === 0} onClick={salvar}>{saving ? "Salvando…" : `Salvar ${preenchidos.length} preenchido${preenchidos.length === 1 ? "" : "s"}`}</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Veículo</th><th className="px-3 py-2">Documento</th><th className="px-3 py-2">Idade</th>
              <th className="px-3 py-2">Emitido em</th><th className="px-3 py-2">Validade (meses)</th><th className="px-3 py-2">Vencimento</th><th className="px-3 py-2">Não se aplica</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map(item => {
              const v = valorDe(item.id);
              const idade = idadeDe(item);
              const padrao = validadePadrao(item);
              const vencido = v.vencimento !== "" && v.vencimento < hoje;
              return (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2 font-semibold">{plates.get(item.veiculo_id ?? "") ?? "—"}</td>
                  <td className="px-3 py-2">
                    {item.descricao || item.tipo_codigo || "—"}
                    {item.vencimento_texto && <p className="text-xs text-muted-foreground">Planilha: {item.vencimento_texto}</p>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{idade === null ? "—" : `${idade} ${idade === 1 ? "ano" : "anos"}`}</td>
                  <td className="px-3 py-2"><input type="date" className={campo} disabled={v.naoSeAplica} value={v.emissao} onChange={e => mudarEmissao(item, e.target.value)} /></td>
                  <td className="px-3 py-2"><input type="number" min="1" max="240" className={`${campo} w-24`} disabled={v.naoSeAplica} placeholder={padrao ? String(padrao) : "—"} value={v.validade} onChange={e => mudarValidade(item, e.target.value)} /></td>
                  <td className="px-3 py-2">
                    <input type="date" className={`${campo} ${vencido ? "border-destructive text-destructive" : ""}`} disabled={v.naoSeAplica} value={v.vencimento} onChange={e => atualizar(item.id, { vencimento: e.target.value })} />
                    {vencido && <p className="mt-0.5 text-[11px] text-destructive">Data já passou</p>}
                  </td>
                  <td className="px-3 py-2 text-center"><input type="checkbox" className="size-4" checked={v.naoSeAplica} onChange={e => atualizar(item.id, { naoSeAplica: e.target.checked })} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
