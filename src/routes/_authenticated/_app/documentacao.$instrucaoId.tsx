import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Banknote, BookOpenCheck, CalendarClock, ExternalLink, FileText, Landmark, Pencil } from "lucide-react";
import { AnexosPanel } from "@/components/anexos-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InstrucaoForm } from "@/components/instrucao-form";
import { PageHeader } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_app/documentacao/$instrucaoId")({ head: () => ({ meta: [{ title: "Instrução de renovação — Controle de Frota" }, { name: "description", content: "Passo a passo para renovar um documento da frota." }] }), component: InstrucaoDetail });

function InstrucaoDetail() {
  const { instrucaoId } = Route.useParams();
  const { data, isLoading } = useQuery({ queryKey: ["instrucao", instrucaoId], queryFn: async () => {
    const [instrucao, tipos, anexos] = await Promise.all([
      supabase.from("instrucoes_documento").select("*").eq("id", instrucaoId).single(),
      supabase.from("tipos_documento").select("codigo, nome").order("ordem"),
      supabase.from("anexos").select("*").eq("entidade_id", instrucaoId).order("created_at", { ascending: false }),
    ]);
    if (instrucao.error) throw instrucao.error;
    return { instrucao: instrucao.data, tipos: tipos.data ?? [], anexos: anexos.data ?? [] };
  } });

  if (isLoading || !data) return <div className="py-20 text-center text-muted-foreground">Carregando instrução…</div>;
  const i = data.instrucao;
  const passos = (i.passo_a_passo || "").split("\n").filter(Boolean);
  const documentos = (i.documentos_necessarios || "").split("\n").filter(Boolean);

  return <>
    <PageHeader
      title={i.titulo}
      description={`Tipo: ${i.tipo_codigo}`}
      actions={<>
        <InstrucaoForm editing={i} tipos={data.tipos} trigger={<Button variant="outline"><Pencil className="mr-2 size-4" />Editar</Button>} />
        <Button variant="outline" asChild><Link to="/documentacao"><ArrowLeft />Voltar</Link></Button>
      </>}
    />

    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <InfoCard icon={Landmark} label="Órgão responsável" value={i.orgao_responsavel || "—"} />
      <InfoCard icon={CalendarClock} label="Prazo estimado" value={i.prazo_estimado || "—"} />
      <InfoCard icon={Banknote} label="Custo estimado" value={i.custo_estimado || "—"} />
      <InfoCard
        icon={ExternalLink}
        label="Link oficial"
        value={i.link_oficial ? <a href={i.link_oficial} target="_blank" rel="noreferrer" className="text-primary underline">Abrir site</a> : "—"}
      />
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="rounded-lg shadow-card lg:col-span-2">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><BookOpenCheck className="size-4 text-primary" />Passo a passo</div>
          {passos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum passo a passo cadastrado ainda.</p> : (
            <ol className="space-y-3">
              {passos.map((p, idx) => (
                <li key={idx} className="flex gap-3 rounded-md border p-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{idx + 1}</span>
                  <span className="pt-0.5">{p.replace(/^\s*\d+[.)]\s*/, "")}</span>
                </li>
              ))}
            </ol>
          )}
          {i.observacoes && <div className="mt-6 border-t pt-4"><p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Observações</p><p className="whitespace-pre-wrap text-sm text-muted-foreground">{i.observacoes}</p></div>}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-card">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><FileText className="size-4 text-primary" />Documentos/informações necessárias</div>
          {documentos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum item cadastrado.</p> : (
            <ul className="space-y-2 text-sm">
              {documentos.map((d, idx) => <li key={idx} className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />{d.replace(/^\s*[-•]\s*/, "")}</li>)}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>

    <div className="mt-4">
      <AnexosPanel entidade="instrucao" entidadeId={instrucaoId} files={data.anexos} queryKey={["instrucao", instrucaoId]} />
    </div>
  </>;
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof Landmark; label: string; value: React.ReactNode }) {
  return <Card className="rounded-lg shadow-card"><CardContent className="flex items-center gap-3 p-4"><span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="size-4" /></span><div><p className="text-xs font-medium uppercase text-muted-foreground">{label}</p><p className="text-sm font-semibold">{value}</p></div></CardContent></Card>;
}
