type Valor = number | null | undefined;

export type SinistroValores = {
  franquia?: Valor;
  orcamento?: Valor;
  reparo_valor_aprovado?: Valor;
  reparo_valor_final?: Valor;
  quitacao_valor?: Valor;
  valor_dano_carga?: Valor;
  valor_pago_seguradora?: Valor;
  valor_ressarcimento?: Valor;
};

const tem = (v: Valor): v is number => typeof v === "number";

/** Reparo na oficina: usa o valor final, senão o aprovado, senão o orçamento. */
export function valorReparo(s: SinistroValores): number | null {
  const v = s.reparo_valor_final ?? s.reparo_valor_aprovado ?? s.orcamento;
  return tem(v) ? v : null;
}

/** Total do prejuízo = reparo + indenização a terceiros (acordo) + danos à carga. Null se nada foi informado. */
export function totalPrejuizo(s: SinistroValores): number | null {
  const partes = [valorReparo(s), s.quitacao_valor, s.valor_dano_carga].filter(tem);
  return partes.length ? partes.reduce((a, b) => a + b, 0) : null;
}
