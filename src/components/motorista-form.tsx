import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Row } from "@/lib/db";

export function MotoristaForm({ trigger, editing }: { trigger: ReactNode; editing?: Row<"motoristas"> }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const text = (key: string) => String(fd.get(key) ?? "").trim() || null;
    const nome = text("nome");
    if (!nome) { toast.error("Informe o nome."); return; }
    setSaving(true);
    const payload = { nome, cpf: text("cpf"), cnh: text("cnh"), categoria_cnh: text("categoria_cnh"), validade_cnh: text("validade_cnh") };
    const { error } = editing
      ? await supabase.from("motoristas").update(payload).eq("id", editing.id)
      : await supabase.from("motoristas").insert(payload);
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar", { description: error.message }); return; }
    toast.success(editing ? "Motorista atualizado" : "Motorista cadastrado");
    setOpen(false);
    event.currentTarget.reset();
    await queryClient.invalidateQueries({ queryKey: ["motoristas"] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Editar motorista" : "Novo motorista"}</DialogTitle></DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label htmlFor="nome">Nome *</Label><Input id="nome" name="nome" required maxLength={255} defaultValue={editing?.nome} /></div>
            <div className="space-y-2"><Label htmlFor="cpf">CPF</Label><Input id="cpf" name="cpf" maxLength={20} defaultValue={editing?.cpf ?? undefined} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="cnh">CNH</Label><Input id="cnh" name="cnh" maxLength={30} defaultValue={editing?.cnh ?? undefined} /></div>
              <div className="space-y-2"><Label htmlFor="categoria_cnh">Categoria</Label><Input id="categoria_cnh" name="categoria_cnh" maxLength={10} defaultValue={editing?.categoria_cnh ?? undefined} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="validade_cnh">Validade da CNH</Label><Input id="validade_cnh" name="validade_cnh" type="date" defaultValue={editing?.validade_cnh ?? undefined} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
