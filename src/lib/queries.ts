import { supabase } from "@/integrations/supabase/client";
import { DIAS_ALERTA_PADRAO } from "@/lib/format";

export async function fetchDashboard() {
  const [veiculos, vencimentos, agenda, sinistros, manutencoes, agendaCount, sinistrosCount, manutencoesCount, anexosCount, multasPendentes, multasIndicacao, multasPagamento, multasRecurso, multasEncerradas] = await Promise.all([
    supabase.from("veiculos").select("id, placa, marca_modelo, status"),
    supabase.from("vencimentos").select("id, veiculo_id, tipo_codigo, descricao, data_vencimento, status").order("data_vencimento", { ascending: true }),
    supabase.from("agenda_eventos").select("id, veiculo_id, atividade, titulo, data, hora, status").order("data", { ascending: true }).limit(8),
    supabase.from("sinistros").select("id, veiculo_id, data, tipo, status, local").order("data", { ascending: false }).limit(8),
    supabase.from("manutencoes").select("id, veiculo_id, tipo, problema, previsao_saida, status, oficina").order("created_at", { ascending: false }).limit(8),
    supabase.from("agenda_eventos").select("id", { count: "exact", head: true }).eq("status", "AGENDADO"),
    supabase.from("sinistros").select("id", { count: "exact", head: true }).not("status", "ilike", "%conclu%"),
    supabase.from("manutencoes").select("id", { count: "exact", head: true }).not("status", "ilike", "%conclu%"),
    supabase.from("anexos").select("id", { count: "exact", head: true }),
    supabase.from("multas").select("id", { count: "exact", head: true }).not("status", "in", "(PAGA,ENCERRADA,CANCELADA)"),
    supabase.from("multas").select("id", { count: "exact", head: true }).eq("situacao_condutor", "AGUARDANDO_INDICACAO").not("status", "in", "(ENCERRADA,CANCELADA)"),
    supabase.from("multas").select("id", { count: "exact", head: true }).eq("status", "AGUARDANDO_PAGAMENTO"),
    supabase.from("multas").select("id", { count: "exact", head: true }).eq("status", "EM_RECURSO"),
    supabase.from("multas").select("id", { count: "exact", head: true }).eq("status", "ENCERRADA"),
  ]);
  const error = [veiculos.error, vencimentos.error, agenda.error, sinistros.error, manutencoes.error, agendaCount.error, sinistrosCount.error, manutencoesCount.error, anexosCount.error, multasPendentes.error, multasIndicacao.error, multasPagamento.error, multasRecurso.error, multasEncerradas.error].find(Boolean); if (error) throw error;
  return {
    veiculos: veiculos.data ?? [], vencimentos: vencimentos.data ?? [], agenda: agenda.data ?? [], sinistros: sinistros.data ?? [], manutencoes: manutencoes.data ?? [],
    counts: {
      agendaAgendada: agendaCount.count ?? 0,
      sinistrosEmAndamento: sinistrosCount.count ?? 0,
      manutencoesEmAndamento: manutencoesCount.count ?? 0,
      anexos: anexosCount.count ?? 0,
      multasPendentes: multasPendentes.count ?? 0,
      multasIndicacao: multasIndicacao.count ?? 0,
      multasPagamento: multasPagamento.count ?? 0,
      multasRecurso: multasRecurso.count ?? 0,
      multasEncerradas: multasEncerradas.count ?? 0,
    },
  };
}
export function vehicleMap(rows: Array<{ id: string; placa: string }>) { return new Map(rows.map((row) => [row.id, row.placa])); }

export async function fetchDiasAlerta(): Promise<number> {
  const { data, error } = await supabase.from("parametros").select("valor").eq("chave", "dias_alerta_vencimento").maybeSingle();
  if (error || !data) return DIAS_ALERTA_PADRAO;
  const parsed = Number(data.valor);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DIAS_ALERTA_PADRAO;
}