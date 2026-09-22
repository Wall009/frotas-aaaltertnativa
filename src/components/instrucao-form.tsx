import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Row } from "@/lib/db";

export function InstrucaoForm({ trigger, editing, tipos }: { trigger: ReactNode; editing?: Row<"instrucoes_documento">; tipos: { codigo: string; nome: string }[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const text = (key: string) => String(fd.get(key) ?? "").trim() || null;
    const tipoCodigo = text("tipo_codigo");
    const titulo = text("titulo");
    if (!tipoCodigo || !titulo) { toast.error("Informe o tipo e o título."); return; }
    setSaving(true);
    const payload = {
      tipo_codigo: tipoCodigo,
      titulo,
      orgao_responsavel: text("orgao_responsavel"),
      link_oficial: text("link_oficial"),
      documentos_necessarios: text("documentos_necessarios"),
      passo_a_passo: text("passo_a_passo"),
      prazo_estimado: text("prazo_estimado"),
      custo_estimado: text("custo_estimado"),
      observacoes: text("observacoes"),
    };
    if (editing) {
      const { error } = await supabase.from("instrucoes_documento").update(payload).eq("id", editing.id);
      setSaving(false);
      if (error) { toast.error("Não foi possível salvar", { description: error.message }); return; }
      toast.success("Instrução atualizada");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["instrucoes_documento"] });
      await queryClient.invalidateQueries({ queryKey: ["instrucao", editing.id] });
      return;
    }
    const { data, error } = await supabase.from("instrucoes_documento").insert(payload).select("id").single();
    setSaving(false);
    if (error || !data) { toast.error("Não foi possível criar a instrução", { description: error?.message }); return; }
    toast.success("Instrução criada");
    setOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["instrucoes_documento"] });
    await navigate({ to: "/documentacao/$instrucaoId", params: { instrucaoId: data.id } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar instrução de renovação" : "Nova instrução de renovação"}</DialogTitle>
          <DialogDescription>Passo a passo pra quem for renovar esse documento sem ter feito antes.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipo_codigo">Tipo de documento *</Label>
              <Input id="tipo_codigo" name="tipo_codigo" list="tipos-documento-list" required maxLength={100} defaultValue={editing?.tipo_codigo} placeholder="Ex: SEGURO, AMLURB, ANTT…" />
              <datalist id="tipos-documento-list">{tipos.map(t => <option key={t.codigo} value={t.codigo}>{t.nome}</option>)}</datalist>
            </div>
            <div className="space-y-2"><Label htmlFor="titulo">Título *</Label><Input id="titulo" name="titulo" required maxLength={255} defaultValue={editing?.titulo} placeholder="Ex: Como renovar o seguro da frota" /></div>
            <div className="space-y-2"><Label htmlFor="orgao_responsavel">Órgão responsável</Label><Input id="orgao_responsavel" name="orgao_responsavel" maxLength={255} defaultValue={editing?.orgao_responsavel ?? undefined} /></div>
            <div className="space-y-2"><Label htmlFor="link_oficial">Link oficial</Label><Input id="link_oficial" name="link_oficial" type="url" maxLength={500} defaultValue={editing?.link_oficial ?? undefined} placeholder="https://…" /></div>
            <div className="space-y-2"><Label htmlFor="prazo_estimado">Prazo estimado</Label><Input id="prazo_estimado" name="prazo_estimado" maxLength={100} defaultValue={editing?.prazo_estimado ?? undefined} placeholder="Ex: 5 dias úteis" /></div>
            <div className="space-y-2"><Label htmlFor="custo_estimado">Custo estimado</Label><Input id="custo_estimado" name="custo_estimado" maxLength={100} defaultValue={editing?.custo_estimado ?? undefined} placeholder="Ex: R$ 150,00 por veículo" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="documentos_necessarios">Documentos/informações necessárias</Label><Textarea id="documentos_necessarios" name="documentos_necessarios" rows={3} defaultValue={editing?.documentos_necessarios ?? undefined} placeholder="Um por linha: CRLV atualizado, RENAVAM, etc." /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="passo_a_passo">Passo a passo *</Label><Textarea id="passo_a_passo" name="passo_a_passo" rows={8} defaultValue={editing?.passo_a_passo ?? undefined} placeholder={"1. Acesse o site do órgão…\n2. Faça login com…\n3. …"} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" name="observacoes" rows={2} defaultValue={editing?.observacoes ?? undefined} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando…" : editing ? "Salvar alterações" : "Criar instrução"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
