import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type DataColumn<T> = { label: string; value: (row: T) => ReactNode; search?: (row: T) => string };

export function DataPage<T extends { id: string }>({ rows, columns, empty = "Nenhum registro encontrado.", onRowClick, actions }: { rows: T[]; columns: DataColumn<T>[]; empty?: string; onRowClick?: (row: T) => void; actions?: ReactNode }) {
  const [search, setSearch] = useState("");
  const visible = useMemo(() => { const q = search.trim().toLocaleLowerCase("pt-BR"); if (!q) return rows; return rows.filter(row => columns.some(col => (col.search?.(row) ?? String(col.value(row) ?? "")).toLocaleLowerCase("pt-BR").includes(q))); }, [rows, columns, search]);
  return <Card className="rounded-lg shadow-card"><CardContent className="p-0"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Buscar registros…" /></div>{actions}</div><Table><TableHeader><TableRow>{columns.map(col => <TableHead key={col.label}>{col.label}</TableHead>)}</TableRow></TableHeader><TableBody>{visible.length ? visible.map(row => <TableRow key={row.id} className={onRowClick ? "cursor-pointer" : undefined} onClick={() => onRowClick?.(row)}>{columns.map(col => <TableCell key={col.label}>{col.value(row)}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground">{empty}</TableCell></TableRow>}</TableBody></Table><div className="border-t px-4 py-3 text-xs text-muted-foreground">{visible.length} registro(s)</div></CardContent></Card>;
}