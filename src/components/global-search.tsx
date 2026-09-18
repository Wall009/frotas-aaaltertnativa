import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, CarFront, FileClock, ShieldAlert, TrafficCone, Wrench } from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

type Resultado = { id: string; label: string; sub: string | undefined; to: string };

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Record<string, Resultado[]>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((v) => !v); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) { setResults({}); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      const like = `%${term}%`;
      const [veiculos, vencimentos, sinistros, manutencoes, agenda, multas] = await Promise.all([
        supabase.from("veiculos").select("id, placa, marca_modelo, renavam").or(`placa.ilike.${like},marca_modelo.ilike.${like},renavam.ilike.${like}`).limit(5),
        supabase.from("vencimentos").select("id, descricao, tipo_codigo, veiculo_id, veiculos(placa)").or(`descricao.ilike.${like},tipo_codigo.ilike.${like}`).limit(5),
        supabase.from("sinistros").select("id, tipo, local, numero_sinistro, veiculo_id, veiculos(placa)").or(`tipo.ilike.${like},local.ilike.${like},numero_sinistro.ilike.${like}`).limit(5),
        supabase.from("manutencoes").select("id, tipo, problema, oficina, veiculo_id, veiculos(placa)").or(`tipo.ilike.${like},problema.ilike.${like},oficina.ilike.${like}`).limit(5),
        supabase.from("agenda_eventos").select("id, titulo, atividade, veiculo_id, veiculos(placa)").or(`titulo.ilike.${like},atividade.ilike.${like}`).limit(5),
        supabase.from("multas").select("id, numero_auto, descricao_infracao, veiculo_id, veiculos(placa)").or(`numero_auto.ilike.${like},descricao_infracao.ilike.${like}`).limit(5),
      ]);
      setLoading(false);
      setResults({
        "Veículos": (veiculos.data ?? []).map(v => ({ id: v.id, label: v.placa, sub: v.marca_modelo || v.renavam || undefined, to: `/veiculos/${v.id}` })),
        "Vencimentos": (vencimentos.data ?? []).map((v: any) => ({ id: v.id, label: v.descricao || v.tipo_codigo || "Vencimento", sub: v.veiculos?.placa, to: "/vencimentos" })),
        "Sinistros": (sinistros.data ?? []).map((s: any) => ({ id: s.id, label: s.tipo || s.numero_sinistro || "Sinistro", sub: s.veiculos?.placa || s.local, to: "/sinistros" })),
        "Manutenções": (manutencoes.data ?? []).map((m: any) => ({ id: m.id, label: m.tipo || m.problema || "Manutenção", sub: m.veiculos?.placa || m.oficina, to: "/manutencao" })),
        "Agenda": (agenda.data ?? []).map((a: any) => ({ id: a.id, label: a.titulo || a.atividade, sub: a.veiculos?.placa, to: "/vencimentos" })),
        "Multas": (multas.data ?? []).map((m: any) => ({ id: m.id, label: m.numero_auto || m.descricao_infracao || "Multa", sub: m.veiculos?.placa, to: `/multas/${m.id}` })),
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const icons: Record<string, typeof CarFront> = { "Veículos": CarFront, "Vencimentos": FileClock, "Sinistros": ShieldAlert, "Manutenções": Wrench, "Agenda": CalendarDays, "Multas": TrafficCone };
  const hasResults = Object.values(results).some(list => list.length > 0);

  const go = (to: string): void => { setOpen(false); setQuery(""); void navigate({ to: to as never }); };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-xs items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:w-64"
      >
        <span className="flex-1 text-left">Pesquisar placa, documento, sinistro…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">Ctrl K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Pesquisar placa, veículo, documento, sinistro…" value={query} onValueChange={setQuery} />
        <CommandList>
          {query.trim().length < 2 ? (
            <CommandEmpty>Digite ao menos 2 caracteres.</CommandEmpty>
          ) : loading ? (
            <CommandEmpty>Buscando…</CommandEmpty>
          ) : !hasResults ? (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          ) : (
            Object.entries(results).filter(([, list]) => list.length > 0).map(([group, list]) => {
              const Icon = icons[group] ?? CarFront;
              return (
                <CommandGroup key={group} heading={group}>
                  {list.map(item => (
                    <CommandItem key={item.id} value={`${group}-${item.id}-${item.label}`} onSelect={() => go(item.to)}>
                      <Icon className="mr-2 size-4" />
                      <span>{item.label}</span>
                      {item.sub && <span className="ml-2 text-xs text-muted-foreground">{item.sub}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
