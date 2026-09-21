import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Database, FileSpreadsheet, IdCard, Pencil, Plus, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MotoristaForm } from "@/components/motorista-form";
import { PageHeader } from "@/components/page-header";
import { ResponsavelForm } from "@/components/responsavel-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Switch } from "@/components/ui/switch";
import { SpreadsheetImport } from "@/components/spreadsheet-import";
import { useCurrentProfile } from "@/hooks/use-current-profile";
import { supabase } from "@/integrations/supabase/client";
import { daysUntil, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_app/configuracoes")({ head: () => ({ meta: [{ title: "Configurações — Controle de Frota" }, { name: "description", content: "Parâmetros e cadastros auxiliares da gestão de frota." }, { property: "og:title", content: "Configurações — Controle de Frota" }, { property: "og:description", content: "Parâmetros e cadastros auxiliares da gestão de frota." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: SettingsPage });
function SettingsPage() {
  const queryClient = useQueryClient();
  const { profile: myProfile, isAdmin } = useCurrentProfile();
  const { data } = useQuery({ queryKey: ["configuracoes"], queryFn: async () => { const [cfg, params] = await Promise.all([supabase.from("configuracoes").select("*").order("grupo").order("ordem"), supabase.from("parametros").select("*").order("chave")]); if (cfg.error || params.error) throw cfg.error || params.error; return { cfg: cfg.data ?? [], params: params.data ?? [] }; } });
  const { data: responsaveis } = useQuery({ queryKey: ["responsaveis"], queryFn: async () => { const { data, error } = await supabase.from("responsaveis").select("*").order("nome"); if (error) throw error; return data ?? []; } });
  const { data: motoristas } = useQuery({ queryKey: ["motoristas"], queryFn: async () => { const { data, error } = await supabase.from("motoristas").select("*").order("nome"); if (error) throw error; return data ?? []; } });
  const { data: usuarios } = useQuery({ queryKey: ["usuarios"], queryFn: async () => { const { data, error } = await supabase.from("profiles").select("*").order("nome"); if (error) throw error; return data ?? []; }, enabled: isAdmin });
  const diasAlertaAtual = data?.params.find(p => p.chave === "dias_alerta_vencimento")?.valor ?? "30";
  const salvarDiasAlerta = async (valor: string): Promise<void> => {
    const { error } = await supabase.from("parametros").update({ valor }).eq("chave", "dias_alerta_vencimento");
    if (error) { toast.error("Não foi possível salvar", { description: error.message }); return; }
    toast.success(`Prazo de alerta atualizado para ${valor} dias`);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["configuracoes"] }),
      queryClient.invalidateQueries({ queryKey: ["dias-alerta"] }),
    ]);
  };
  const toggleAtivo = async (id: string, ativo: boolean): Promise<void> => {
    const { error } = await supabase.from("responsaveis").update({ ativo }).eq("id", id);
    if (error) { toast.error("Não foi possível atualizar", { description: error.message }); return; }
    await queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
  };
  const toggleMotoristaAtivo = async (id: string, ativo: boolean): Promise<void> => {
    const { error } = await supabase.from("motoristas").update({ ativo }).eq("id", id);
    if (error) { toast.error("Não foi possível atualizar", { description: error.message }); return; }
    await queryClient.invalidateQueries({ queryKey: ["motoristas"] });
  };
  const alterarPapel = async (id: string, role: string): Promise<void> => {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) { toast.error("Não foi possível atualizar o papel", { description: error.message }); return; }
    toast.success("Papel atualizado");
    await queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  };
  return <>
    <PageHeader title="Configurações" description="Cadastros auxiliares e regras usadas pelo sistema." />
    <div className="grid gap-6 lg:grid-cols-3">
      <SettingsCard icon={Database} title="Tipos e opções" description="Documentos, manutenção, sinistros e status." count={data?.cfg.length ?? 0}>{data?.cfg.slice(0,6).map(c => <div key={c.id} className="flex justify-between border-b py-2 last:border-0"><span className="text-sm">{c.valor}</span><StatusBadge value={c.ativo ? "ATIVO" : "INATIVO"} /></div>)}</SettingsCard>
      <SettingsCard icon={SlidersHorizontal} title="Parâmetros" description="Regras gerais e períodos de alerta." count={data?.params.length ?? 0}><div className="space-y-2 border-b py-2"><p className="text-sm font-medium">Prazo de alerta de vencimento</p><p className="mb-2 text-xs text-muted-foreground">Documentos são marcados como "próximo do vencimento" dentro desse prazo.</p><Select value={diasAlertaAtual} onValueChange={salvarDiasAlerta}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="15">15 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="45">45 dias</SelectItem><SelectItem value="60">60 dias</SelectItem></SelectContent></Select></div>{data?.params.filter(p => p.chave !== "dias_alerta_vencimento").map(p => <div key={p.chave} className="border-b py-2 last:border-0"><p className="text-sm font-medium">{p.chave}</p><p className="text-xs text-muted-foreground">{p.valor}</p></div>)}</SettingsCard>
      <SettingsCard icon={FileSpreadsheet} title="Importação XLSX" description="Compare uma nova planilha antes de atualizar os registros." count={0}><SpreadsheetImport /></SettingsCard>
    </div>
    <Card className="mt-6 rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Users className="size-5" /></span>
          <div><CardTitle className="text-base">Responsáveis</CardTitle><CardDescription>Pessoas que podem ser vinculadas a vencimentos, manutenções, sinistros e agenda.</CardDescription></div>
        </div>
        <ResponsavelForm trigger={<Button size="sm"><Plus className="mr-2 size-4" />Novo responsável</Button>} />
      </CardHeader>
      <CardContent className="p-0">
        {!responsaveis?.length ? <p className="p-6 text-sm text-muted-foreground">Nenhum responsável cadastrado.</p> : (
          <ul className="divide-y">
            {responsaveis.map(r => (
              <li key={r.id} className="flex items-center gap-4 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{r.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">{[r.setor, r.email, r.telefone].filter(Boolean).join(" · ") || "—"}</p>
                </div>
                <ResponsavelForm editing={r} trigger={<Button size="icon" variant="ghost"><Pencil className="size-4" /></Button>} />
                <Switch checked={r.ativo} onCheckedChange={(checked) => toggleAtivo(r.id, checked)} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
    <Card className="mt-6 rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary"><IdCard className="size-5" /></span>
          <div><CardTitle className="text-base">Motoristas</CardTitle><CardDescription>Condutores que podem ser indicados em multas.</CardDescription></div>
        </div>
        <MotoristaForm trigger={<Button size="sm"><Plus className="mr-2 size-4" />Novo motorista</Button>} />
      </CardHeader>
      <CardContent className="p-0">
        {!motoristas?.length ? <p className="p-6 text-sm text-muted-foreground">Nenhum motorista cadastrado.</p> : (
          <ul className="divide-y">
            {motoristas.map(m => { const cnhDias = daysUntil(m.validade_cnh); return (
              <li key={m.id} className="flex items-center gap-4 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{m.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">{[m.cpf, m.cnh ? `CNH ${m.cnh}${m.categoria_cnh ? ` (${m.categoria_cnh})` : ""}` : null, m.validade_cnh ? `válida até ${formatDate(m.validade_cnh)}` : null].filter(Boolean).join(" · ") || "—"}</p>
                </div>
                {cnhDias !== null && cnhDias <= 30 && <StatusBadge value={cnhDias < 0 ? "CNH vencida" : "CNH vencendo"} />}
                <MotoristaForm editing={m} trigger={<Button size="icon" variant="ghost"><Pencil className="size-4" /></Button>} />
                <Switch checked={m.ativo} onCheckedChange={(checked) => toggleMotoristaAtivo(m.id, checked)} />
              </li>
            ); })}
          </ul>
        )}
      </CardContent>
    </Card>
    {isAdmin && (
      <Card className="mt-6 rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary"><ShieldCheck className="size-5" /></span>
            <div><CardTitle className="text-base">Usuários</CardTitle><CardDescription>Quem tem acesso ao sistema e o papel de cada um.</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!usuarios?.length ? <p className="p-6 text-sm text-muted-foreground">Nenhum usuário encontrado.</p> : (
            <ul className="divide-y">
              {usuarios.map(u => (
                <li key={u.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{u.nome || u.email || "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Select value={u.role} onValueChange={(role) => alterarPapel(u.id, role)} disabled={u.id === myProfile?.id}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="admin">Administrador</SelectItem><SelectItem value="operador">Operador</SelectItem></SelectContent>
                  </Select>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <p className="px-6 pb-4 text-xs text-muted-foreground">Administradores podem marcar veículos como vendidos e excluir anexos. Você não pode alterar seu próprio papel.</p>
      </Card>
    )}
  </>;
}
function SettingsCard({ icon: Icon, title, description, count, children }: { icon: typeof Database; title: string; description: string; count: number; children: React.ReactNode }) { return <Card className="rounded-lg"><CardHeader><div className="flex items-start justify-between"><span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="size-5" /></span><span className="text-xs text-muted-foreground">{count} item(ns)</span></div><CardTitle className="pt-3 text-base">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent>{children}</CardContent></Card>; }