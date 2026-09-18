export const DIAS_ALERTA_PADRAO = 30;

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const iso = value.length > 10 ? value.slice(0, 10) : value;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatCurrency(value?: number | string | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNumber(value?: number | string | null, digits = 2): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

export function toISODate(date: Date): string {
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function daysUntil(dateISO?: string | null): number | null {
  if (!dateISO) return null;
  const target = new Date(`${dateISO.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - base.getTime()) / 86400000);
}

export type SituacaoVencimento =
  | "VENCIDO"
  | "PROXIMO DO VENCIMENTO"
  | "DENTRO DA VALIDADE"
  | "EM PROCESSO"
  | "NAO SE APLICA";

const MANUAIS: SituacaoVencimento[] = ["EM PROCESSO", "NAO SE APLICA"];

export function situacaoVencimento(
  dataVencimento?: string | null,
  statusManual?: string | null,
  diasAlerta = DIAS_ALERTA_PADRAO,
): SituacaoVencimento {
  const manual = (statusManual ?? "").toUpperCase().trim();
  if (MANUAIS.includes(manual as SituacaoVencimento)) return manual as SituacaoVencimento;
  if (manual === "NÃO SE APLICA") return "NAO SE APLICA";
  const dias = daysUntil(dataVencimento);
  if (dias === null) return "EM PROCESSO";
  if (dias < 0) return "VENCIDO";
  if (dias <= diasAlerta) return "PROXIMO DO VENCIMENTO";
  return "DENTRO DA VALIDADE";
}

export const SITUACAO_LABEL: Record<SituacaoVencimento, string> = {
  VENCIDO: "Vencido",
  "PROXIMO DO VENCIMENTO": "Próximo do vencimento",
  "DENTRO DA VALIDADE": "Dentro da validade",
  "EM PROCESSO": "Em processo",
  "NAO SE APLICA": "Não se aplica",
};

export function parseNumber(value: string): number | null {
  const clean = value.replace(/\s|R\$/g, "").replace(/\./g, "").replace(",", ".");
  if (!clean) return null;
  const n = Number(clean);
  return Number.isNaN(n) ? null : n;
}

export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const STATUS_MULTA_LABEL: Record<string, string> = {
  NOVA: "Nova",
  EM_ANALISE: "Em análise",
  AGUARDANDO_CONDUTOR: "Aguardando condutor",
  INDICACAO_PENDENTE: "Indicação pendente",
  INDICACAO_REALIZADA: "Indicação realizada",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGA: "Paga",
  EM_RECURSO: "Em recurso",
  RECURSO_DEFERIDO: "Recurso deferido",
  RECURSO_INDEFERIDO: "Recurso indeferido",
  CANCELADA: "Cancelada",
  ENCERRADA: "Encerrada",
};

export const SITUACAO_CONDUTOR_LABEL: Record<string, string> = {
  IDENTIFICADO: "Identificado",
  AGUARDANDO_INDICACAO: "Aguardando indicação",
  NAO_IDENTIFICADO: "Não identificado",
};

export function diasRestantes(data?: string | null): number | null {
  return daysUntil(data);
}
