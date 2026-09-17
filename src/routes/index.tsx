import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Controle de Frota" },
    { name: "description", content: "Gestão centralizada de veículos, documentos, prazos e ocorrências." },
    { property: "og:title", content: "Controle de Frota" },
    { property: "og:description", content: "Gestão centralizada de veículos, documentos, prazos e ocorrências." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
