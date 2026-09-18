import { supabase } from "@/integrations/supabase/client";
import { DIAS_ALERTA_PADRAO } from "@/lib/format";

export async function fetchDashboard() {
  const [veiculosAll, vencimentos, agenda, sinistrosList, manutencoesList, multasList, anexosCount] = await Promise.all([
    supabase.from("veiculos").select("id, placa, marca_modelo, status"),
    supabase.from("vencimentos").select("id, veiculo_id, tipo_codigo, descricao, data_vencimento, status").order("data_vencimento", { ascending: true }),
    supabase.from("agenda_eventos").select("id, veiculo_id, atividade, titulo, data, hora, status").eq("status", "AGENDADO").order("data", { ascending: true }),
    supabase.from("sinistros").select("id, veiculo_id, data, tipo, status, local").order("data", { ascending: false }),
    supabase.from("manutencoes").select("id, veiculo_id, tipo, problema, previsao_saida, status, oficina").order("created_at", { ascending: false }),
    supabase.from("multas").select("id, veiculo_id, status, situacao_condutor"),
    supabase.from("anexos").select("id", { count: "exact", head: true }),
  ]);
  const error = [veiculosAll.error, vencimentos.error, agenda.error, sinistrosList.error, manutencoesList.error, multasList.error, anexosCount.error].find(Boolean); if (error) throw error;

  const activeIds = new Set((veiculosAll.data ?? []).filter(v => v.status !== "VENDIDO").map(v => v.id));
  const veiculosAtivos = (veiculosAll.data ?? []).filter(v => v.status !== "VENDIDO");
  const isAtivoOuLivre = (veiculoId: string | null) => veiculoId === null || activeIds.has(veiculoId);

  const vencimentosAtivos = (vencimentos.data ?? []).filter(r => isAtivoOuLivre(r.veiculo_id));
  const sinistrosAtivos = (sinistrosList.data ?? []).filter(r => isAtivoOuLivre(r.veiculo_id));
  const manutencoesAtivas = (manutencoesList.data ?? []).filter(r => isAtivoOuLivre(r.veiculo_id));
  const multasAtivas = (multasList.data ?? []).filter(r => isAtivoOuLivre(r.veiculo_id));
  const agendaAtiva = (agenda.data ?? []).filter(r => isAtivoOuLivre(r.veiculo_id));

  return {
    veiculos: veiculosAtivos,
    vencimentos: vencimentosAtivos,
    agenda: agendaAtiva.slice(0, 8),
    sinistros: sinistrosAtivos.slice(0, 8),
    manutencoes: manutencoesAtivas.slice(0, 8),
    counts: {
      agendaAgendada: agendaAtiva.length,
      sinistrosEmAndamento: sinistrosAtivos.filter(r => !r.status.toUpperCase().includes("CONCLU")).length,
      manutencoesEmAndamento: manutencoesAtivas.filter(r => !r.status.toUpperCase().includes("CONCLU")).length,
      anexos: anexosCount.count ?? 0,
      multasPendentes: multasAtivas.filter(r => !["PAGA", "ENCERRADA", "CANCELADA"].includes(r.status)).length,
      multasIndicacao: multasAtivas.filter(r => r.situacao_condutor === "AGUARDANDO_INDICACAO" && !["ENCERRADA", "CANCELADA"].includes(r.status)).length,
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