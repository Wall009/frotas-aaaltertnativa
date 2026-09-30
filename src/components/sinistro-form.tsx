import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export function SinistroForm({ trigger, vehicles }: { trigger: ReactNode; vehicles: { id: string; placa: string }[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const text = (key: string) => String(fd.get(key) ?? "").trim() || null;
    const data = text("data");
    if (!data) { toast.error("Informe a data do sinistro."); return; }
    setSaving(true);
    const payload = {
      veiculo_id: text("veiculo_id"),
      data,
      hora: text("hora"),
      tipo: text("tipo"),
      tipo_evento: "SINISTRO",
      local: text("local"),
      nome_empregado: text("nome_empregado"),
      descricao: text("descricao"),
      status: "EM ANDAMENTO",
    };
    const { data: created, error } = await supabase.from("sinistros").insert(payload).select("id").single();
    if (error || !created) { setSaving(false); toast.error("Não foi possível registrar o sinistro", { description: error?.message }); return; }
    await supabase.from("sinistro_timeline").insert({ sinistro_id: created.id, titulo: "Sinistro registrado" });
    setSaving(false);
    toast.success("Sinistro registrado");
    setOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["sinistros"] });
    await navigate({ to: "/sinistros/$sinistroId", params: { sinistroId: created.id } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo sinistro</DialogTitle>
          <DialogDescription>Registro inicial — os detalhes da apuração, terceiro e documentos são preenchidos na ficha, logo em seguida.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="veiculo_id">Veículo</Label>
              <Select name="veiculo_id">
                <SelectTrigger id="veiculo_id"><SelectValue placeholder="Selecione a placa" /></SelectTrigger>
                <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.placa}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="tipo">Tipo</Label><Input id="tipo" name="tipo" placeholder="Ex: Colisão, Avaria…" maxLength={255} /></div>
            <div className="space-y-2"><Label htmlFor="data">Data *</Label><Input id="data" name="data" type="date" required /></div>
            <div className="space-y-2"><Label htmlFor="hora">Hora</Label><Input id="hora" name="hora" type="time" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="nome_empregado">Motorista envolvido</Label><Input id="nome_empregado" name="nome_empregado" maxLength={255} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="local">Local</Label><Input id="local" name="local" maxLength={255} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="descricao">Descrição inicial</Label><Textarea id="descricao" name="descricao" rows={3} maxLength={2000} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Registrar e continuar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
