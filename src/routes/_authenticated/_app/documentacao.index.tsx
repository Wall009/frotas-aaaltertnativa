import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenCheck, ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataPage, type DataColumn } from "@/components/data-page";
import { InstrucaoForm } from "@/components/instrucao-form";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Row } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/_app/documentacao/")({ head: () => ({ meta: [{ title: "Documentação — Controle de Frota" }, { name: "description", content: "Tipos de documento e instruções de renovação." }, { property: "og:title", content: "Documentação — Controle de Frota" }, { property: "og:description", content: "Tipos de documento e instruções de renovação." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: DocumentationPage });

function DocumentationPage() {
  const navigate = useNavigate();
  const { data: tipos = [] } = useQuery({ queryKey: ["tipos_documento"], queryFn: async () => { const r = await supabase.from("tipos_documento").select("*").order("ordem"); if (r.error) throw r.error; return r.data; } });
  const { data: instrucoes = [] } = useQuery({ queryKey: ["instrucoes_documento"], queryFn: async () => { const r = await supabase.from("instrucoes_documento").select("*").order("titulo"); if (r.error) throw r.error; return r.data; } });

  const tiposCols = useMemo<DataColumn<Row<"tipos_documento">>[]>(() => [{ label: "Código", value: r => <span className="font-semibold">{r.codigo}</span> }, { label: "Documento", value: r => r.nome }, { label: "Categoria", value: r => r.categoria }, { label: "Situação", value: r => <StatusBadge value={r.ativo ? "ATIVO" : "INATIVO"} /> }], []);
  const instrucoesCols = useMemo<DataColumn<Row<"instrucoes_documento">>[]>(() => [{ label: "Tipo", value: r => <span className="font-semibold">{r.tipo_codigo}</span> }, { label: "Título", value: r => r.titulo }, { label: "Órgão", value: r => r.orgao_responsavel || "—" }, { label: "Prazo estimado", value: r => r.prazo_estimado || "—" }], []);

  return <>
    <PageHeader title="Documentação" description="Catálogo de documentos e instruções de renovação da frota." actions={<InstrucaoForm tipos={tipos} trigger={<Button size="sm"><Plus className="mr-2 size-4" />Nova instrução</Button>} />} />
    <Tabs defaultValue="instrucoes">
      <TabsList>
        <TabsTrigger value="instrucoes"><BookOpenCheck className="mr-2 size-4" />Instruções de renovação ({instrucoes.length})</TabsTrigger>
        <TabsTrigger value="tipos"><ClipboardList className="mr-2 size-4" />Tipos de documento ({tipos.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="instrucoes">
        <DataPage rows={instrucoes} columns={instrucoesCols} onRowClick={row => navigate({ to: "/documentacao/$instrucaoId", params: { instrucaoId: row.id } })} empty="Nenhuma instrução de renovação cadastrada ainda." />
      </TabsContent>
      <TabsContent value="tipos">
        <DataPage rows={tipos} columns={tiposCols} />
      </TabsContent>
    </Tabs>
  </>;
}
