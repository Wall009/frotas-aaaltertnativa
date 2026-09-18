import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export function MarcarVendidoForm({ veiculoId, placa, trigger }: { veiculoId: string; placa: string; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const text = (key: string) => String(fd.get(key) ?? "").trim() || null;
    const dataVenda = text("data_venda");
    if (!dataVenda) { toast.error("Informe a data da venda."); return; }
    setSaving(true);
    const valorRaw = text("valor_venda");
    const payload = {
      status: "VENDIDO",
      data_venda: dataVenda,
      comprador: text("comprador"),
      valor_venda: valorRaw ? Number(valorRaw.replace(",", ".")) : null,
      motivo_venda: text("motivo_venda"),
    };
    const { error } = await supabase.from("veiculos").update(payload).eq("id", veiculoId);
    setSaving(false);
    if (error) { toast.error("Não foi possível registrar a venda", { description: error.message }); return; }
    toast.success(`${placa} marcado como vendido`);
    setOpen(false);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["veiculo", veiculoId] }),
      queryClient.invalidateQueries({ queryKey: ["veiculos"] }),
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar {placa} como vendido</DialogTitle>
          <DialogDescription>O veículo não é excluído — fica preservado no histórico de vendidos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="data_venda">Data da venda *</Label>
              <Input id="data_venda" name="data_venda" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comprador">Comprador</Label>
              <Input id="comprador" name="comprador" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_venda">Valor</Label>
              <Input id="valor_venda" name="valor_venda" type="number" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo_venda">Motivo</Label>
              <Textarea id="motivo_venda" name="motivo_venda" maxLength={1000} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="destructive" disabled={saving}>{saving ? "Salvando…" : "Confirmar venda"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
