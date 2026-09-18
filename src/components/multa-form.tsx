import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export function MultaForm({ trigger, vehicles }: { trigger: ReactNode; vehicles: { id: string; placa: string }[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const text = (key: string) => String(fd.get(key) ?? "").trim() || null;
    const num = (key: string) => { const v = text(key); return v ? Number(v.replace(",", ".")) : null; };
    const dataInfracao = text("data_infracao");
    if (!dataInfracao) { toast.error("Informe a data da infração."); return; }
    setSaving(true);
    const dataVencimento = text("data_vencimento");
    const prazoIndicacao = text("prazo_indicacao");
    const payload = {
      veiculo_id: text("veiculo_id"),
      numero_auto: text("numero_auto"),
      orgao_autuador: text("orgao_autuador"),
      codigo_infracao: text("codigo_infracao"),
      descricao_infracao: text("descricao_infracao"),
      data_infracao: dataInfracao,
      hora_infracao: text("hora_infracao"),
      local: text("local"),
      municipio: text("municipio"),
      uf: text("uf"),
      rodovia: text("rodovia"),
      km: text("km"),
      sentido: text("sentido"),
      enquadramento: text("enquadramento"),
      gravidade: text("gravidade"),
      pontos: num("pontos"),
      valor_original: num("valor_original"),
      valor_atualizado: num("valor_atualizado"),
      data_vencimento: dataVencimento,
      prazo_indicacao: prazoIndicacao,
      status: "NOVA",
      situacao_condutor: "AGUARDANDO_INDICACAO",
      observacoes: text("observacoes"),
    };
    const { data, error } = await supabase.from("multas").insert(payload).select("id").single();
    if (error || !data) { setSaving(false); toast.error("Não foi possível criar a multa", { description: error?.message }); return; }
    await supabase.from("multa_timeline").insert({ multa_id: data.id, evento: "Multa cadastrada" });
    setSaving(false);
    toast.success("Multa cadastrada");
    setOpen(false);
    await navigate({ to: "/multas/$multaId", params: { multaId: data.id } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>Nova multa</DialogTitle></DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="veiculo_id">Veículo</Label>
              <Select name="veiculo_id">
                <SelectTrigger id="veiculo_id"><SelectValue placeholder="Selecione a placa" /></SelectTrigger>
                <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.placa}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="numero_auto">Número do auto</Label><Input id="numero_auto" name="numero_auto" maxLength={255} /></div>
            <div className="space-y-2"><Label htmlFor="orgao_autuador">Órgão autuador</Label><Input id="orgao_autuador" name="orgao_autuador" maxLength={255} /></div>

            <div className="space-y-2"><Label htmlFor="data_infracao">Data da infração *</Label><Input id="data_infracao" name="data_infracao" type="date" required /></div>
            <div className="space-y-2"><Label htmlFor="hora_infracao">Hora</Label><Input id="hora_infracao" name="hora_infracao" type="time" /></div>
            <div className="space-y-2"><Label htmlFor="codigo_infracao">Código da infração</Label><Input id="codigo_infracao" name="codigo_infracao" maxLength={255} /></div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-3"><Label htmlFor="descricao_infracao">Descrição da infração</Label><Textarea id="descricao_infracao" name="descricao_infracao" maxLength={2000} /></div>

            <div className="space-y-2"><Label htmlFor="local">Local</Label><Input id="local" name="local" maxLength={255} /></div>
            <div className="space-y-2"><Label htmlFor="municipio">Município</Label><Input id="municipio" name="municipio" maxLength={255} /></div>
            <div className="space-y-2"><Label htmlFor="uf">UF</Label><Input id="uf" name="uf" maxLength={2} /></div>
            <div className="space-y-2"><Label htmlFor="rodovia">Rodovia</Label><Input id="rodovia" name="rodovia" maxLength={255} /></div>
            <div className="space-y-2"><Label htmlFor="km">Km</Label><Input id="km" name="km" maxLength={50} /></div>
            <div className="space-y-2"><Label htmlFor="sentido">Sentido</Label><Input id="sentido" name="sentido" maxLength={100} /></div>

            <div className="space-y-2"><Label htmlFor="enquadramento">Enquadramento</Label><Input id="enquadramento" name="enquadramento" maxLength={255} /></div>
            <div className="space-y-2"><Label htmlFor="gravidade">Gravidade</Label>
              <Select name="gravidade"><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent><SelectItem value="LEVE">Leve</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="GRAVE">Grave</SelectItem><SelectItem value="GRAVISSIMA">Gravíssima</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="pontos">Pontos</Label><Input id="pontos" name="pontos" type="number" /></div>

            <div className="space-y-2"><Label htmlFor="valor_original">Valor original</Label><Input id="valor_original" name="valor_original" type="number" step="0.01" /></div>
            <div className="space-y-2"><Label htmlFor="valor_atualizado">Valor atualizado</Label><Input id="valor_atualizado" name="valor_atualizado" type="number" step="0.01" /></div>
            <div className="space-y-2"><Label htmlFor="data_vencimento">Vencimento</Label><Input id="data_vencimento" name="data_vencimento" type="date" /></div>

            <div className="space-y-2"><Label htmlFor="prazo_indicacao">Prazo para indicação do condutor</Label><Input id="prazo_indicacao" name="prazo_indicacao" type="date" /></div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" name="observacoes" maxLength={2000} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Cadastrar multa"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
