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

export function SinistroForm({ trigger, vehicles }: { trigger: ReactNode; vehicles: { id: string; placa: string }[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const text = (key: string) => String(fd.get(key) ?? "").trim() || null;
    const num = (key: string) => { const v = text(key); return v ? Number(v.replace(",", ".")) : null; };
    const data = text("data");
    if (!data) { toast.error("Informe a data do sinistro."); return; }
    setSaving(true);
    const payload = {
      veiculo_id: text("veiculo_id"),
      data,
      hora: text("hora"),
      tipo: text("tipo"),
      local: text("local"),
      motorista: text("motorista"),
      boletim_ocorrencia: text("boletim_ocorrencia"),
      seguradora: text("seguradora"),
      apolice: text("apolice"),
      numero_sinistro: text("numero_sinistro"),
      valor_estimado: num("valor_estimado"),
      status: text("status") ?? "EM ANDAMENTO",
      descricao: text("descricao"),
      observacoes: text("observacoes"),
    };
    const { error } = await supabase.from("sinistros").insert(payload);
    setSaving(false);
    if (error) { toast.error("Não foi possível criar o sinistro", { description: error.message }); return; }
    toast.success("Sinistro registrado");
    setOpen(false);
    event.currentTarget.reset();
    await queryClient.invalidateQueries({ queryKey: ["sinistros"] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo sinistro</DialogTitle>
          <DialogDescription>Registro de ocorrência e acompanhamento do seguro.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="veiculo_id">Veículo</Label>
              <Select name="veiculo_id">
                <SelectTrigger id="veiculo_id"><SelectValue placeholder="Selecione a placa" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.placa}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Input id="tipo" name="tipo" placeholder="Ex: Colisão, Furto…" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input id="data" name="data" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora</Label>
              <Input id="hora" name="hora" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motorista">Motorista</Label>
              <Input id="motorista" name="motorista" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="local">Local</Label>
              <Input id="local" name="local" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boletim_ocorrencia">Boletim de ocorrência</Label>
              <Input id="boletim_ocorrencia" name="boletim_ocorrencia" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_sinistro">Número do sinistro</Label>
              <Input id="numero_sinistro" name="numero_sinistro" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seguradora">Seguradora</Label>
              <Input id="seguradora" name="seguradora" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apolice">Apólice</Label>
              <Input id="apolice" name="apolice" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_estimado">Valor estimado</Label>
              <Input id="valor_estimado" name="valor_estimado" type="number" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue="EM ANDAMENTO">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EM ANDAMENTO">Em andamento</SelectItem>
                  <SelectItem value="AGUARDANDO SEGURADORA">Aguardando seguradora</SelectItem>
                  <SelectItem value="EM REPARO">Em reparo</SelectItem>
                  <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" name="descricao" maxLength={2000} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" name="observacoes" maxLength={2000} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Registrar sinistro"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
