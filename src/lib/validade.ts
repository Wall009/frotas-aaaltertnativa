import { supabase } from "@/integrations/supabase/client";
import type { Row } from "@/lib/db";
import { toISODate } from "@/lib/format";

/**
 * Regras de validade: por tipo de documento, define quantos meses o documento vale
 * dependendo da idade do veículo (faixas). Ex.: AMLURB — 0 anos: 12 meses; 10 anos ou mais: 6 meses.
 *
 * Observação: a tabela regras_validade e as colunas data_emissao/validade_meses de vencimentos
 * ainda não constam nos tipos gerados do Supabase, por isso o acesso é tipado manualmente aqui.
 */

export type RegraValidade = {
  id: string;
  tipo_codigo: string;
  a_partir_de_anos: number;
  validade_meses: number;
  observacao: string | null;
};

export type VencimentoRow = Row<"vencimentos"> & { data_emissao?: string | null; validade_meses?: number | null };

export type DadosAnoVeiculo = { anoFabricacao: number | null; anoModelo: number | null };

type LooseResult = { data: unknown[] | null; error: { message: string } | null };
export type LooseQuery = PromiseLike<LooseResult> & {
  select(columns?: string): LooseQuery;
  order(column: string, options?: { ascending?: boolean }): LooseQuery;
  eq(column: string, value: unknown): LooseQuery;
  insert(values: Record<string, unknown>): LooseQuery;
  update(values: Record<string, unknown>): LooseQuery;
  delete(): LooseQuery;
};

const loose = supabase as unknown as { from(table: string): LooseQuery };
export const regrasTable = (): LooseQuery => loose.from("regras_validade");
export const vencimentosTable = (): LooseQuery => loose.from("vencimentos");

export async function fetchRegras(): Promise<RegraValidade[]> {
  const { data, error } = await regrasTable().select("*").order("tipo_codigo").order("a_partir_de_anos");
  if (error) throw new Error(error.message);
  return (data ?? []) as RegraValidade[];
}

/** Idade do veículo em anos, pelo ano de fabricação (ou ano do modelo, se faltar). */
export function idadeVeiculo(anoFabricacao?: number | null, anoModelo?: number | null, hoje: Date = new Date()): number | null {
  const ano = anoFabricacao ?? anoModelo ?? null;
  if (ano === null || ano < 1900) return null;
  return Math.max(0, hoje.getFullYear() - ano);
}

export function regrasDoTipo(regras: RegraValidade[], tipo: string | null | undefined): RegraValidade[] {
  if (!tipo) return [];
  return regras.filter(r => r.tipo_codigo === tipo).sort((a, b) => a.a_partir_de_anos - b.a_partir_de_anos);
}

/** Faixa que vale para a idade informada (a maior faixa cujo "a partir de" não passa da idade). */
export function regraAplicavel(regras: RegraValidade[], tipo: string | null | undefined, idade: number | null): RegraValidade | null {
  const doTipo = regrasDoTipo(regras, tipo);
  if (doTipo.length === 0) return null;
  const referencia = idade ?? 0;
  let escolhida: RegraValidade | null = null;
  for (const r of doTipo) if (r.a_partir_de_anos <= referencia) escolhida = r;
  return escolhida ?? doTipo[0] ?? null;
}

/** Soma meses a uma data ISO (AAAA-MM-DD), respeitando o fim do mês (31/01 + 1 mês = 28/02). */
export function addMonthsISO(iso: string, months: number): string | null {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d || !Number.isFinite(months)) return null;
  const total = y * 12 + (m - 1) + Math.round(months);
  const ano = Math.floor(total / 12);
  const mes = total % 12;
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  return toISODate(new Date(ano, mes, Math.min(d, ultimoDia)));
}

/** Texto da faixa, ex.: "Veículos de 5 a 9 anos". `ordenadas` precisa estar em ordem crescente. */
export function faixaTexto(ordenadas: RegraValidade[], indice: number): string {
  const atual = ordenadas[indice];
  const proxima = ordenadas[indice + 1];
  if (!atual) return "";
  if (ordenadas.length === 1) return "Todos os veículos";
  if (!proxima) return `Veículos com ${atual.a_partir_de_anos} anos ou mais`;
  const ate = proxima.a_partir_de_anos - 1;
  if (atual.a_partir_de_anos === 0) return `Veículos com até ${ate} ${ate === 1 ? "ano" : "anos"}`;
  return `Veículos de ${atual.a_partir_de_anos} a ${ate} anos`;
}

export function mesesTexto(meses: number): string {
  if (meses % 12 === 0) {
    const anos = meses / 12;
    return `${meses} meses (${anos} ${anos === 1 ? "ano" : "anos"})`;
  }
  return `${meses} ${meses === 1 ? "mês" : "meses"}`;
}
