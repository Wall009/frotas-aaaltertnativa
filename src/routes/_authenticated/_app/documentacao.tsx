import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DataPage, type DataColumn } from "@/components/data-page";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/integrations/supabase/client";
import type { Row } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/_app/documentacao")({ head: () => ({ meta: [{ title: "Documentação — Controle de Frota" }, { name: "description", content: "Tipos e controles documentais da frota." }, { property: "og:title", content: "Documentação — Controle de Frota" }, { property: "og:description", content: "Tipos e controles documentais da frota." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: DocumentationPage });
function DocumentationPage() {
  const { data = [] } = useQuery({ queryKey: ["tipos_documento"], queryFn: async () => { const r = await supabase.from("tipos_documento").select("*").order("ordem"); if (r.error) throw r.error; return r.data; } });
  const columns = useMemo<DataColumn<Row<"tipos_documento">>[]>(() => [{ label: "Código", value: r => <span className="font-semibold">{r.codigo}</span> }, { label: "Documento", value: r => r.nome }, { label: "Categoria", value: r => r.categoria }, { label: "Situação", value: r => <StatusBadge value={r.ativo ? "ATIVO" : "INATIVO"} /> }], []);
  return <><PageHeader title="Documentação" description="Catálogo de documentos e obrigações controladas pela frota." /><DataPage rows={data} columns={columns} /></>;
}