import { supabase } from "@/integrations/supabase/client";

export async function fetchDashboard() {
  const [veiculos, vencimentos, agenda, sinistros, manutencoes] = await Promise.all([
    supabase.from("veiculos").select("id, placa, marca_modelo, status"),
    supabase.from("vencimentos").select("id, veiculo_id, tipo_codigo, descricao, data_vencimento, status").order("data_vencimento", { ascending: true }),
    supabase.from("agenda_eventos").select("id, veiculo_id, atividade, titulo, data, hora, status").order("data", { ascending: true }).limit(8),
    supabase.from("sinistros").select("id, veiculo_id, data, tipo, status, local").order("data", { ascending: false }).limit(8),
    supabase.from("manutencoes").select("id, veiculo_id, tipo, problema, previsao_saida, status, oficina").order("created_at", { ascending: false }).limit(8),
  ]);
  const error = [veiculos.error, vencimentos.error, agenda.error, sinistros.error, manutencoes.error].find(Boolean); if (error) throw error;
  return { veiculos: veiculos.data ?? [], vencimentos: vencimentos.data ?? [], agenda: agenda.data ?? [], sinistros: sinistros.data ?? [], manutencoes: manutencoes.data ?? [] };
}
export function vehicleMap(rows: Array<{ id: string; placa: string }>) { return new Map(rows.map((row) => [row.id, row.placa])); }