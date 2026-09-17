import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export function AgendaForm({ trigger, vehicles }: { trigger: ReactNode; vehicles: { id: string; placa: string }[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const text = (key: string) => String(fd.get(key) ?? "").trim() || null;
    const atividade = text("atividade");
    const data = text("data");
    if (!atividade) { toast.error("Informe a atividade/lembrete."); return; }
    if (!data) { toast.error("Informe a data."); return; }
    setSaving(true);
    const payload = {
      veiculo_id: text("veiculo_id"),
      atividade,
      titulo: text("titulo") ?? atividade,
      data,
      hora: text("hora"),
      responsavel: text("responsavel"),
      local: text("local"),
      empresa: text("empresa"),
      status: text("status") ?? "AGENDADO",
      observacao: text("observacao"),
    };
    const { error } = await supabase.from("agenda_eventos").insert(payload);
    setSaving(false);
    if (error) { toast.error("Não foi possível criar o evento", { description: error.message }); return; }
    toast.success("Evento criado na agenda");
    setOpen(false);
    event.currentTarget.reset();
    await queryClient.invalidateQueries({ queryKey: ["vencimentos-agenda"] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo evento na agenda</DialogTitle>
          <DialogDescription>Lembretes e compromissos operacionais, com ou sem veículo vinculado.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="atividade">Atividade / lembrete *</Label>
              <Input id="atividade" name="atividade" required maxLength={255} placeholder="Ex: Revisão de freios" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="titulo">Título (opcional)</Label>
              <Input id="titulo" name="titulo" maxLength={255} placeholder="Se vazio, usa a atividade" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input id="data" name="data" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora">Hora</Label>
                <Input id="hora" name="hora" type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="veiculo_id">Veículo</Label>
              <Select name="veiculo_id">
                <SelectTrigger id="veiculo_id"><SelectValue placeholder="Selecione a placa (opcional)" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.placa}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input id="responsavel" name="responsavel" maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="local">Local</Label>
                <Input id="local" name="local" maxLength={255} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input id="empresa" name="empresa" maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue="AGENDADO">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGENDADO">Agendado</SelectItem>
                    <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea id="observacao" name="observacao" maxLength={2000} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Criar evento"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
