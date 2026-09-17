import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const fields = [["placa", "Placa", true], ["renavam", "RENAVAM"], ["chassi", "Chassi"], ["marca", "Marca"], ["modelo", "Modelo"], ["ano_fabricacao", "Ano fabricação"], ["ano_modelo", "Ano modelo"], ["cor", "Cor"], ["tipo_veiculo", "Tipo"], ["categoria", "Categoria"], ["combustivel", "Combustível"], ["capacidade", "Capacidade"], ["quilometragem", "Quilometragem"], ["proprietario", "Proprietário"], ["unidade", "Unidade"], ["localizacao", "Localização"], ["data_aquisicao", "Data de aquisição"], ["valor_aquisicao", "Valor de aquisição"]] as const;

export function VehicleForm({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false); const [saving, setSaving] = useState(false); const queryClient = useQueryClient();
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault(); setSaving(true); const fd = new FormData(event.currentTarget);
    const text = (key: string) => String(fd.get(key) ?? "").trim() || null; const num = (key: string) => { const v = text(key); return v ? Number(v.replace(",", ".")) : null; };
    const placa = text("placa"); if (!placa) { setSaving(false); toast.error("Informe a placa."); return; }
    const payload = { placa: placa.toUpperCase(), renavam: text("renavam"), chassi: text("chassi"), marca: text("marca"), modelo: text("modelo"), marca_modelo: [text("marca"), text("modelo")].filter(Boolean).join(" ") || null, ano_fabricacao: num("ano_fabricacao"), ano_modelo: num("ano_modelo"), cor: text("cor"), tipo_veiculo: text("tipo_veiculo"), categoria: text("categoria"), combustivel: text("combustivel"), capacidade: text("capacidade"), quilometragem: num("quilometragem"), proprietario: text("proprietario"), unidade: text("unidade"), localizacao: text("localizacao"), status: text("status") ?? "ATIVO", data_aquisicao: text("data_aquisicao"), valor_aquisicao: num("valor_aquisicao"), observacoes: text("observacoes") };
    const { error } = await supabase.from("veiculos").insert(payload); setSaving(false); if (error) { toast.error("Não foi possível cadastrar", { description: error.message }); return; }
    toast.success("Veículo cadastrado"); setOpen(false); await queryClient.invalidateQueries({ queryKey: ["veiculos"] });
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild>{trigger}</DialogTrigger><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>Novo veículo</DialogTitle><DialogDescription>Cadastre os dados disponíveis. Apenas a placa é obrigatória.</DialogDescription></DialogHeader><form onSubmit={submit}><div className="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([name, label, required]) => <div className="space-y-2" key={name}><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={name.startsWith("ano_") || name === "quilometragem" || name === "valor_aquisicao" ? "number" : name.startsWith("data_") ? "date" : "text"} required={required} maxLength={name.startsWith("ano_") ? undefined : 255} /></div>)}<div className="space-y-2"><Label>Status</Label><Select name="status" defaultValue="ATIVO"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ATIVO">Ativo</SelectItem><SelectItem value="MANUTENCAO">Em manutenção</SelectItem><SelectItem value="INATIVO">Inativo</SelectItem><SelectItem value="VENDIDO">Vendido</SelectItem></SelectContent></Select></div><div className="space-y-2 sm:col-span-2 lg:col-span-3"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" name="observacoes" maxLength={2000} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar veículo"}</Button></DialogFooter></form></DialogContent></Dialog>;
}