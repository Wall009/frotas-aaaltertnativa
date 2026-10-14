export const PAGADOR_LABEL: Record<string, string> = {
  EMPRESA: "Empresa",
  MOTORISTA: "Motorista",
};

export const MOTIVO_CUSTO_EMPRESA_LABEL: Record<string, string> = {
  FALTA_MANUTENCAO: "Falta de manutenção",
  EQUIPAMENTO_SEGURANCA: "Equipamento de segurança",
  FALHA_OPERACIONAL: "Falha operacional",
  DOCUMENTACAO_VENCIDA: "Documentação vencida",
};

/** Multas fora do custo: canceladas ou com recurso deferido não entram nos totais. */
export function multaConta(status: string): boolean {
  return !["CANCELADA", "RECURSO_DEFERIDO"].includes(status);
}

export function soma(valores: Array<number | null | undefined>): number {
  return valores.reduce<number>((total, v) => total + (typeof v === "number" ? v : 0), 0);
}
