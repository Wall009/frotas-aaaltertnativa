import { useMemo, useState, type ReactNode } from "react";
import { CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Row } from "@/lib/db";
import { DIAS_SEMANA, daysUntil, formatDate, todayISO, toISODate, type SituacaoDocumento } from "@/lib/format";
import type { VencimentoRow } from "@/lib/validade";

export type EventoLinha = Row<"agenda_eventos"> & { dias: number | null; pendente: boolean };
export type DocumentoLinha = VencimentoRow & { situacao: SituacaoDocumento; dias: number | null };

type Tom = "evento" | "alerta" | "perigo" | "ok" | "neutro";
type Item = {
  key: string;
  kind: "evento" | "documento";
  data: string;
  hora: string | null;
  titulo: string;
  placa: string;
  responsavel: string | null;
  tom: Tom;
  concluido: boolean;
  categoria: string;
  evento?: EventoLinha;
  documento?: DocumentoLinha;
};

type Props = {
  eventos: EventoLinha[];
  documentos: DocumentoLinha[];
  plates: Map<string, string>;
  novoEvento: ReactNode;
  onEditarEvento: (e: Row<"agenda_eventos">) => void;
  onConcluirEvento: (e: Row<"agenda_eventos">) => void;
  onEditarDocumento: (d: VencimentoRow) => void;
  onAbrirVencimentos: (filtro: SituacaoDocumento) => void;
};

const NOMES_DIA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

const ESTILO_CARTAO: Record<Tom, string> = {
  evento: "border-l-primary bg-primary/5",
  perigo: "border-l-destructive bg-destructive/5",
  alerta: "border-l-warning bg-warning/10",
  ok: "border-l-success bg-success/5",
  neutro: "border-l-muted-foreground bg-muted/40",
};

const COR_PONTO: Record<Tom, string> = { evento: "bg-primary", perigo: "bg-destructive", alerta: "bg-warning", ok: "bg-success", neutro: "bg-muted-foreground" };

function dateFromISO(iso: string): Date { return new Date(`${iso}T00:00:00`); }
function addDaysISO(iso: string, n: number): string { const d = dateFromISO(iso); d.setDate(d.getDate() + n); return toISODate(d); }
function segundaDe(iso: string): string { const d = dateFromISO(iso); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toISODate(d); }
function diasDe(iso: string): number { return daysUntil(iso) ?? 99999; }
function prazoCurto(dias: number): string { return dias === 0 ? "Hoje" : dias > 0 ? `Em ${dias}d` : `Há ${Math.abs(dias)}d`; }
function nomeDoDia(iso: string): string { return NOMES_DIA[dateFromISO(iso).getDay()] ?? ""; }
function siglaDoDia(iso: string): string { return DIAS_SEMANA[dateFromISO(iso).getDay()] ?? ""; }
function numeroDoDia(iso: string): string { return iso.slice(8, 10); }

function contar(itens: Item[], chave: (i: Item) => string): Array<[string, number]> {
  const m = new Map<string, number>();
  for (const i of itens) { const k = chave(i); m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
}

function ordenar(a: Item, b: Item): number {
  return (a.hora ?? "99:99").localeCompare(b.hora ?? "99:99") || (a.kind === b.kind ? 0 : a.kind === "evento" ? -1 : 1);
}

export function AgendaPainel({ eventos, documentos, plates, novoEvento, onEditarEvento, onConcluirEvento, onEditarDocumento, onAbrirVencimentos }: Props) {
  const hojeISO = todayISO();
  const [selecionado, setSelecionado] = useState(hojeISO);
  const [semanaInicio, setSemanaInicio] = useState(() => segundaDe(hojeISO));

  const itens = useMemo<Item[]>(() => {
    const lista: Item[] = [];
    for (const e of eventos) {
      const status = (e.status ?? "").toUpperCase();
      if (status.startsWith("CANCEL")) continue;
      lista.push({
        key: `e-${e.id}`, kind: "evento", data: e.data, hora: e.hora, titulo: e.titulo || e.atividade,
        placa: e.veiculo_id ? plates.get(e.veiculo_id) ?? "" : "", responsavel: e.responsavel,
        tom: e.pendente && e.dias !== null && e.dias < 0 ? "perigo" : "evento", concluido: status.startsWith("CONCLU"), categoria: e.atividade, evento: e,
      });
    }
    for (const d of documentos) {
      if (!d.data_vencimento || d.situacao === "NAO SE APLICA" || d.situacao === "SEM DATA") continue;
      lista.push({
        key: `d-${d.id}`, kind: "documento", data: d.data_vencimento.slice(0, 10), hora: null, titulo: d.descricao || d.tipo_codigo || "Documento",
        placa: d.veiculo_id ? plates.get(d.veiculo_id) ?? "" : "", responsavel: d.responsavel ?? null,
        tom: d.situacao === "VENCIDO" ? "perigo" : d.situacao === "PROXIMO DO VENCIMENTO" ? "alerta" : d.situacao === "EM PROCESSO" ? "neutro" : "ok",
        concluido: false, categoria: d.tipo_codigo || "Documento", documento: d,
      });
    }
    return lista;
  }, [eventos, documentos, plates]);

  const porDia = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of itens) { const arr = m.get(i.data); if (arr) arr.push(i); else m.set(i.data, [i]); }
    for (const arr of m.values()) arr.sort(ordenar);
    return m;
  }, [itens]);

  const abertos = itens.filter(i => !i.concluido);
  const kpiHoje = abertos.filter(i => i.data === hojeISO).length;
  const kpiSemana = abertos.filter(i => { const d = diasDe(i.data); return d >= 1 && d <= 7; }).length;
  const kpiAtrasadas = abertos.filter(i => i.kind === "evento" && diasDe(i.data) < 0).length;
  const kpiVenc30 = itens.filter(i => i.kind === "documento" && diasDe(i.data) >= 0 && diasDe(i.data) <= 30).length;
  const kpiVencidos = documentos.filter(d => d.situacao === "VENCIDO").length;

  const proximos30 = abertos.filter(i => { const d = diasDe(i.data); return d >= 0 && d <= 30; });
  const porResponsavel = contar(proximos30, i => i.responsavel?.trim() || "Sem responsável");
  const porCategoria = contar(proximos30, i => i.categoria || "Outros");

  const dias14 = Array.from({ length: 14 }, (_, i) => addDaysISO(hojeISO, i));
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDaysISO(semanaInicio, i));
  const itensDoDia = porDia.get(selecionado) ?? [];
  const semanaAtual = semanaInicio === segundaDe(hojeISO);

  const abrir = (i: Item) => { if (i.evento) onEditarEvento(i.evento); else if (i.documento) onEditarDocumento(i.documento); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Compromissos <b>e</b> vencimentos de documentos juntos, na mesma linha do tempo.</p>
        {novoEvento}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi titulo="Hoje" valor={kpiHoje} detalhe="Compromissos e vencimentos de hoje" cor="text-primary" />
        <Kpi titulo="Próximos 7 dias" valor={kpiSemana} detalhe="A partir de amanhã" cor="text-info" />
        <Kpi titulo="Atividades atrasadas" valor={kpiAtrasadas} detalhe="Compromissos que passaram do dia" cor={kpiAtrasadas > 0 ? "text-destructive" : "text-success"} />
        <Kpi titulo="Vencimentos em 30 dias" valor={kpiVenc30} detalhe="Documentos a vencer, incluindo hoje" cor="text-warning-foreground" />
        <Kpi titulo="Documentos vencidos" valor={kpiVencidos} detalhe="Clique para ver a lista" cor={kpiVencidos > 0 ? "text-destructive" : "text-success"} onClick={() => onAbrirVencimentos("VENCIDO")} />
      </div>

      {/* Faixa dos próximos 14 dias */}
      <div className="rounded-lg border bg-card p-3">
        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Próximos 14 dias — clique num dia para ver os detalhes</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dias14.map(dia => {
            const doDia = (porDia.get(dia) ?? []).filter(i => !i.concluido);
            const eventosDia = doDia.filter(i => i.kind === "evento").length;
            const docsDia = doDia.filter(i => i.kind === "documento").length;
            const ativo = dia === selecionado;
            return (
              <button key={dia} type="button" onClick={() => setSelecionado(dia)} className={`min-w-[64px] flex-1 rounded-md border p-2 text-center transition hover:border-primary/50 ${ativo ? "border-primary bg-primary/10" : "bg-background"} ${dia === hojeISO ? "ring-1 ring-primary/40" : ""}`}>
                <p className="text-[10px] font-medium uppercase text-muted-foreground">{siglaDoDia(dia)}</p>
                <p className="text-lg font-bold leading-tight">{numeroDoDia(dia)}</p>
                <div className="mt-1 flex min-h-[16px] items-center justify-center gap-1 text-[10px] font-semibold">
                  {eventosDia > 0 && <span className="rounded-full bg-primary/15 px-1.5 text-primary">{eventosDia}</span>}
                  {docsDia > 0 && <span className="rounded-full bg-warning/25 px-1.5 text-warning-foreground">{docsDia}</span>}
                  {eventosDia === 0 && docsDia === 0 && <span className="text-muted-foreground/50">·</span>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" />Compromissos</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-warning" />Vencimentos de documentos</span>
        </div>
      </div>

      {/* Detalhe do dia + distribuições */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <p className="font-semibold">{nomeDoDia(selecionado)} · {formatDate(selecionado)}{selecionado === hojeISO ? " (hoje)" : ""}</p>
            <p className="text-xs text-muted-foreground">{itensDoDia.length} item(ns)</p>
          </div>
          {itensDoDia.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nada programado para este dia.</p>
          ) : (
            <ul className="space-y-2">
              {itensDoDia.map(i => (
                <li key={i.key} className={`flex flex-wrap items-center gap-3 rounded-md border border-l-4 p-3 ${ESTILO_CARTAO[i.tom]}`}>
                  <span className="text-muted-foreground">{i.kind === "evento" ? (i.concluido ? <CheckCircle2 className="size-4 text-success" /> : <CalendarClock className="size-4" />) : <FileText className="size-4" />}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${i.concluido ? "line-through opacity-60" : ""}`}>{i.hora ? `${i.hora.slice(0, 5)} · ` : ""}{i.titulo}</p>
                    <p className="text-xs text-muted-foreground">{[i.kind === "documento" ? "Vencimento de documento" : "Compromisso", i.placa, i.responsavel].filter(Boolean).join(" · ")}</p>
                  </div>
                  {!i.concluido && <span className={`text-xs font-medium ${i.tom === "perigo" ? "text-destructive" : "text-muted-foreground"}`}>{prazoCurto(diasDe(i.data))}</span>}
                  {i.evento && !i.concluido && i.evento.pendente && <Button size="sm" variant="outline" onClick={() => { if (i.evento) onConcluirEvento(i.evento); }}>Concluir</Button>}
                  <Button size="sm" variant="outline" onClick={() => abrir(i)}>{i.kind === "documento" ? "Editar documento" : "Editar"}</Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <Distribuicao titulo="Carga por responsável" subtitulo="Próximos 30 dias" dados={porResponsavel} cor="bg-primary" />
          <Distribuicao titulo="O que mais pesa" subtitulo="Por tipo, próximos 30 dias" dados={porCategoria} cor="bg-warning" />
        </div>
      </div>

      {/* Semana */}
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">Semana de {formatDate(semanaInicio)} a {formatDate(addDaysISO(semanaInicio, 6))}</p>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" title="Semana anterior" onClick={() => setSemanaInicio(addDaysISO(semanaInicio, -7))}><ChevronLeft className="size-4" /></Button>
            <Button size="sm" variant="outline" disabled={semanaAtual} onClick={() => setSemanaInicio(segundaDe(hojeISO))}>Hoje</Button>
            <Button size="icon" variant="outline" title="Próxima semana" onClick={() => setSemanaInicio(addDaysISO(semanaInicio, 7))}><ChevronRight className="size-4" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
          {diasSemana.map(dia => {
            const doDia = porDia.get(dia) ?? [];
            const visiveis = doDia.slice(0, 4);
            const resto = doDia.length - visiveis.length;
            return (
              <div key={dia} className={`min-w-0 rounded-md border p-2 ${dia === hojeISO ? "border-primary/60 bg-primary/5" : "bg-background"}`}>
                <button type="button" className="mb-2 w-full text-left" onClick={() => setSelecionado(dia)}>
                  <p className="text-[10px] font-medium uppercase text-muted-foreground">{siglaDoDia(dia)}</p>
                  <p className="text-sm font-bold">{numeroDoDia(dia)}/{dia.slice(5, 7)}</p>
                </button>
                <div className="space-y-1.5">
                  {visiveis.map(i => (
                    <button key={i.key} type="button" onClick={() => abrir(i)} className={`w-full rounded-md border border-l-4 p-1.5 text-left text-xs transition hover:shadow-sm ${ESTILO_CARTAO[i.tom]} ${i.concluido ? "opacity-60" : ""}`}>
                      <p className={`line-clamp-2 font-medium ${i.concluido ? "line-through" : ""}`}>{i.hora ? `${i.hora.slice(0, 5)} ` : ""}{i.titulo}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{i.placa || (i.kind === "documento" ? "Documento" : "Compromisso")}</p>
                    </button>
                  ))}
                  {resto > 0 && <button type="button" className="w-full text-left text-[11px] font-medium text-primary hover:underline" onClick={() => setSelecionado(dia)}>+{resto} mais</button>}
                  {doDia.length === 0 && <p className="text-[11px] text-muted-foreground/60">—</p>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          {(["evento", "alerta", "perigo", "ok", "neutro"] as const).map(t => (
            <span key={t} className="flex items-center gap-1"><span className={`size-2 rounded-full ${COR_PONTO[t]}`} />{t === "evento" ? "Compromisso" : t === "alerta" ? "Documento a vencer" : t === "perigo" ? "Vencido / atrasado" : t === "ok" ? "Documento em dia" : "Em processo"}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({ titulo, valor, detalhe, cor, onClick }: { titulo: string; valor: number; detalhe: string; cor: string; onClick?: () => void }) {
  const conteudo = (
    <>
      <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
      <p className={`mt-1 text-2xl font-bold ${cor}`}>{valor}</p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{detalhe}</p>
    </>
  );
  if (onClick) return <button type="button" onClick={onClick} className="flex flex-col items-start justify-start rounded-lg border bg-card p-4 text-left shadow-card transition hover:ring-1 hover:ring-primary/30">{conteudo}</button>;
  return <div className="rounded-lg border bg-card p-4 shadow-card">{conteudo}</div>;
}

function Distribuicao({ titulo, subtitulo, dados, cor }: { titulo: string; subtitulo: string; dados: Array<[string, number]>; cor: string }) {
  const maximo = Math.max(1, ...dados.map(d => d[1]));
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-semibold">{titulo}</p>
      <p className="mb-3 text-xs text-muted-foreground">{subtitulo}</p>
      {dados.length === 0 ? <p className="text-sm text-muted-foreground">Sem itens no período.</p> : (
        <ul className="space-y-2">
          {dados.map(([nome, qtd]) => (
            <li key={nome}>
              <div className="flex justify-between gap-2 text-xs"><span className="truncate">{nome}</span><span className="font-semibold">{qtd}</span></div>
              <div className="mt-1 h-2 rounded-full bg-muted"><div className={`h-2 rounded-full ${cor}`} style={{ width: `${Math.round((qtd / maximo) * 100)}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
