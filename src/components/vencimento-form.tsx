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

// Vencimento "livre": qualquer placa cadastrada e qualquer tipo digitado,
// sem depender de um tipo pré-cadastrado em tipos_documento.
export function VencimentoForm({ trigger, vehicles }: { trigger: ReactNode; vehicles: { id: string; placa: string }[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const text = (key: string) => String(fd.get(key) ?? "").trim() || null;
    const tipo = text("tipo");
    const dataVencimento = text("data_vencimento");
    if (!tipo) { toast.error("Informe o tipo do vencimento."); return; }
    if (!dataVencimento) { toast.error("Informe a data de vencimento."); return; }
    setSaving(true);
    const veiculoId = text("veiculo_id");
    const payload = {
      veiculo_id: veiculoId,
      tipo_codigo: tipo,
      descricao: tipo,
      data_vencimento: dataVencimento,
      responsavel: text("responsavel"),
      status: text("status") ?? "PENDENTE",
      empresa: text("empresa"),
      numero_cadastro: text("numero_cadastro"),
      observacoes: text("observacoes"),
    };
    const { error } = await supabase.from("vencimentos").insert(payload);
    setSaving(false);
    if (error) { toast.error("Não foi possível criar o vencimento", { description: error.message }); return; }
    toast.success("Vencimento criado");
    setOpen(false);
    event.currentTarget.reset();
    await queryClient.invalidateQueries({ queryKey: ["vencimentos-agenda"] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo vencimento</DialogTitle>
          <DialogDescription>Qualquer placa e qualquer tipo — não precisa estar pré-cadastrado.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="veiculo_id">Veículo</Label>
              <Select name="veiculo_id">
                <SelectTrigger id="veiculo_id"><SelectValue placeholder="Selecione a placa (opcional)" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.placa}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Input id="tipo" name="tipo" placeholder="Ex: IPVA, Seguro, Licenciamento…" required maxLength={255} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_vencimento">Data de vencimento *</Label>
                <Input id="data_vencimento" name="data_vencimento" type="date" required />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue="PENDENTE">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                    <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input id="responsavel" name="responsavel" maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input id="empresa" name="empresa" maxLength={255} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_cadastro">Número/protocolo</Label>
              <Input id="numero_cadastro" name="numero_cadastro" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" name="observacoes" maxLength={2000} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Criar vencimento"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
