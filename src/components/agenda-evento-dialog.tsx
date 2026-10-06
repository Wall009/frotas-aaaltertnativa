import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Row } from "@/lib/db";

const SEM_VEICULO = "__sem_veiculo__";
const STATUS_OPCOES: Array<readonly [string, string]> = [
  ["AGENDADO", "Agendado — ainda a fazer"],
  ["CONCLUIDO", "Concluído"],
  ["CANCELADO", "Cancelado"],
];

type Props = { row: Row<"agenda_eventos"> | null; vehicles: { id: string; placa: string }[]; onClose: () => void };

export function AgendaEventoDialog({ row, vehicles, onClose }: Props) {
  return (
    <Dialog open={row !== null} onOpenChange={open => { if (!open) onClose(); }}>
      {row && (
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar compromisso</DialogTitle>
            <DialogDescription>Altere a data, o responsável ou o andamento da atividade.</DialogDescription>
          </DialogHeader>
          <FormularioEvento key={row.id} row={row} vehicles={vehicles} onClose={onClose} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function FormularioEvento({ row, vehicles, onClose }: { row: Row<"agenda_eventos">; vehicles: { id: string; placa: string }[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const opcoes = [...STATUS_OPCOES];
  if (!opcoes.some(([valor]) => valor === row.status)) opcoes.push([row.status, row.status]);

  const refresh = async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["vencimentos-agenda"] }), queryClient.invalidateQueries({ queryKey: ["dashboard"] })]); };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const text = (key: string) => String(fd.get(key) ?? "").trim() || null;
    const atividade = text("atividade");
    const data = text("data");
    if (!atividade || !data) { toast.error("Informe a atividade e a data."); return; }
    const veiculo = text("veiculo_id");
    setSaving(true);
    const { error } = await supabase.from("agenda_eventos").update({
      atividade,
      titulo: text("titulo"),
      data,
      hora: text("hora"),
      veiculo_id: veiculo === SEM_VEICULO ? null : veiculo,
      responsavel: text("responsavel"),
      local: text("local"),
      status: text("status") ?? row.status,
      observacao: text("observacao"),
    }).eq("id", row.id);
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar", { description: error.message }); return; }
    toast.success("Compromisso atualizado");
    onClose();
    await refresh();
  };

  const excluir = async () => {
    if (!window.confirm("Excluir este compromisso? Essa ação não pode ser desfeita.")) return;
    setSaving(true);
    const { error } = await supabase.from("agenda_eventos").delete().eq("id", row.id);
    setSaving(false);
    if (error) { toast.error("Não foi possível excluir", { description: error.message }); return; }
    toast.success("Compromisso excluído");
    onClose();
    await refresh();
  };

  return (
    <form onSubmit={submit}>
      <div className="grid gap-4 py-2 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="atividade">Atividade *</Label><Input id="atividade" name="atividade" required maxLength={255} defaultValue={row.atividade} /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="titulo">Título (opcional)</Label><Input id="titulo" name="titulo" maxLength={255} defaultValue={row.titulo ?? ""} /></div>
        <div className="space-y-2"><Label htmlFor="data">Data *</Label><Input id="data" name="data" type="date" required defaultValue={row.data} /></div>
        <div className="space-y-2"><Label htmlFor="hora">Hora</Label><Input id="hora" name="hora" type="time" defaultValue={row.hora?.slice(0, 5) ?? ""} /></div>
        <div className="space-y-2">
          <Label htmlFor="veiculo_id">Veículo</Label>
          <Select name="veiculo_id" defaultValue={row.veiculo_id ?? SEM_VEICULO}>
            <SelectTrigger id="veiculo_id"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={SEM_VEICULO}>Sem veículo</SelectItem>
              {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.placa}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Andamento</Label>
          <Select name="status" defaultValue={row.status}>
            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
            <SelectContent>{opcoes.map(([valor, rotulo]) => <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label htmlFor="responsavel">Responsável</Label><Input id="responsavel" name="responsavel" maxLength={255} defaultValue={row.responsavel ?? ""} /></div>
        <div className="space-y-2"><Label htmlFor="local">Local</Label><Input id="local" name="local" maxLength={255} defaultValue={row.local ?? ""} /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="observacao">Observações</Label><Textarea id="observacao" name="observacao" rows={3} maxLength={2000} defaultValue={row.observacao ?? ""} /></div>
      </div>
      <DialogFooter className="gap-2 sm:justify-between">
        <Button type="button" variant="outline" disabled={saving} onClick={excluir}>Excluir</Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </div>
      </DialogFooter>
    </form>
  );
}
