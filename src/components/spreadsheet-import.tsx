import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileCheck2, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Candidate = { placa: string; marca_modelo: string | null; status: string; source: Record<string, unknown> };
type Preview = { novos: Candidate[]; alterados: Candidate[]; iguais: Candidate[]; duplicados: Candidate[] };
const key = (value: unknown) => String(value ?? "").trim();
const normalized = (value: unknown) => key(value).toUpperCase().replace(/[^A-Z0-9]/g, "");

export function SpreadsheetImport() {
  const [preview, setPreview] = useState<Preview | null>(null); const [busy, setBusy] = useState(false); const queryClient = useQueryClient();
  const inspect = async (file?: File) => {
    if (!file) return; setBusy(true);
    try {
      const XLSX = await import("xlsx"); const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" }); const sheetName = workbook.SheetNames.find(n => normalized(n) === "CAD") ?? workbook.SheetNames[0]; if (!sheetName) throw new Error("Planilha sem abas legíveis.");
      const sheet = workbook.Sheets[sheetName]; if (!sheet) throw new Error("Aba não encontrada.");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const candidates = rows.map(source => { const get = (...names: string[]) => { const found = Object.keys(source).find(k => names.includes(normalized(k))); return found ? source[found] : ""; }; return { placa: normalized(get("PLACA")), marca_modelo: key(get("MARCAMODELO", "MARCA_MODELO", "MODELO")) || null, status: normalized(get("STATUS")) || "ATIVO", source }; }).filter(r => r.placa);
      const seen = new Set<string>(); const duplicados = candidates.filter(r => seen.has(r.placa) || !seen.add(r.placa)); const unique = candidates.filter((r, index) => candidates.findIndex(x => x.placa === r.placa) === index);
      const db = await supabase.from("veiculos").select("placa, marca_modelo, status"); if (db.error) throw db.error; const existing = new Map((db.data ?? []).map(r => [normalized(r.placa), r]));
      const novos: Candidate[] = [], alterados: Candidate[] = [], iguais: Candidate[] = [];
      unique.forEach(row => { const old = existing.get(row.placa); if (!old) novos.push(row); else if (key(old.marca_modelo) !== key(row.marca_modelo) || normalized(old.status) !== row.status) alterados.push(row); else iguais.push(row); });
      setPreview({ novos, alterados, iguais, duplicados });
    } catch (error) { toast.error("Não foi possível ler a planilha", { description: error instanceof Error ? error.message : "Arquivo inválido" }); } finally { setBusy(false); }
  };
  const confirm = async (): Promise<void> => {
    if (!preview) return; setBusy(true);
    const inserts = preview.novos.map(r => ({ placa: r.placa, marca_modelo: r.marca_modelo, status: r.status }));
    if (inserts.length) { const { error } = await supabase.from("veiculos").insert(inserts); if (error) { setBusy(false); toast.error("Falha ao importar novos veículos", { description: error.message }); return; } }
    for (const row of preview.alterados) { const { error } = await supabase.from("veiculos").update({ marca_modelo: row.marca_modelo, status: row.status }).eq("placa", row.placa); if (error) { setBusy(false); toast.error(`Falha ao atualizar ${row.placa}`, { description: error.message }); return; } }
    setBusy(false); toast.success("Importação concluída", { description: `${inserts.length} novos e ${preview.alterados.length} atualizados.` }); setPreview(null); await queryClient.invalidateQueries({ queryKey: ["veiculos"] });
  };
  return <div className="space-y-4"><label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-6 text-center"><Upload className="mb-2 size-6 text-primary" /><span className="text-sm font-medium">Selecionar planilha XLSX</span><span className="mt-1 text-xs text-muted-foreground">A aba CAD será comparada pela placa.</span><Input className="sr-only" type="file" accept=".xlsx,.xls" onChange={(e) => inspect(e.target.files?.[0])} /></label>{busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Processando…</p>}{preview && <><div className="grid grid-cols-2 gap-2 text-center"><Count label="Novos" value={preview.novos.length} /><Count label="Alterações" value={preview.alterados.length} /><Count label="Sem alteração" value={preview.iguais.length} /><Count label="Duplicidades" value={preview.duplicados.length} /></div><p className="text-xs text-muted-foreground">Nenhum registro será excluído. Somente os novos e alterados serão gravados após sua confirmação.</p><Button className="w-full" onClick={confirm} disabled={busy}><FileCheck2 />Confirmar importação</Button></>}</div>;
}
function Count({ label, value }: { label: string; value: number }) { return <div className="rounded-md bg-secondary p-3"><p className="text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>; }