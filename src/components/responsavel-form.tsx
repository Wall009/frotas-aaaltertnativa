import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Row } from "@/lib/db";

export function ResponsavelForm({ trigger, editing }: { trigger: ReactNode; editing?: Row<"responsaveis"> }) {
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
    const payload = { nome, setor: text("setor"), email: text("email"), telefone: text("telefone") };
    const { error } = editing
      ? await supabase.from("responsaveis").update(payload).eq("id", editing.id)
      : await supabase.from("responsaveis").insert(payload);
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar", { description: error.message }); return; }
    toast.success(editing ? "Responsável atualizado" : "Responsável criado");
    setOpen(false);
    event.currentTarget.reset();
    await queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Editar responsável" : "Novo responsável"}</DialogTitle></DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" name="nome" required maxLength={255} defaultValue={editing?.nome} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setor">Setor</Label>
              <Input id="setor" name="setor" maxLength={255} defaultValue={editing?.setor ?? undefined} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" maxLength={255} defaultValue={editing?.email ?? undefined} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" maxLength={30} defaultValue={editing?.telefone ?? undefined} />
            </div>
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
