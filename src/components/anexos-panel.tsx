import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";
import type { Row } from "@/lib/db";

const BUCKET = "anexos";

export function AnexosPanel({ entidade, entidadeId, files, queryKey }: {
  entidade: string; entidadeId: string; files: Row<"anexos">[]; queryKey: unknown[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const refresh = async (): Promise<void> => { await queryClient.invalidateQueries({ queryKey }); };

  const onPick = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const list = event.target.files;
    if (!list || list.length === 0) return;
    setUploading(true);
    for (const file of Array.from(list)) {
      const path = `${entidade}/${entidadeId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (uploadError) { toast.error(`Falha ao enviar ${file.name}`, { description: uploadError.message }); continue; }
      const { data: userData } = await supabase.auth.getUser();
      const { error: dbError } = await supabase.from("anexos").insert({
        entidade, entidade_id: entidadeId, nome: file.name, caminho: path,
        tipo: file.type || null, tamanho: file.size, usuario: userData.user?.email ?? null,
      });
      if (dbError) { toast.error(`Falha ao registrar ${file.name}`, { description: dbError.message }); continue; }
      toast.success(`${file.name} enviado`);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    await refresh();
  };

  const download = async (file: Row<"anexos">): Promise<void> => {
    setBusyId(file.id);
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file.caminho, 60);
    setBusyId(null);
    if (error || !data) { toast.error("Não foi possível gerar o link de download", { description: error?.message }); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const remove = async (file: Row<"anexos">): Promise<void> => {
    setBusyId(file.id);
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([file.caminho]);
    if (storageError) { toast.error("Não foi possível excluir o arquivo", { description: storageError.message }); setBusyId(null); return; }
    const { error: dbError } = await supabase.from("anexos").delete().eq("id", file.id);
    setBusyId(null);
    if (dbError) { toast.error("Arquivo removido do storage, mas não do registro", { description: dbError.message }); return; }
    toast.success("Anexo excluído");
    await refresh();
  };

  const formatSize = (bytes: number | null): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="rounded-lg">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{files.length} anexo{files.length === 1 ? "" : "s"}</p>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={onPick} />
          <Button size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
            {uploading ? "Enviando…" : "Enviar arquivo"}
          </Button>
        </div>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum anexo vinculado.</p>
        ) : (
          <ul className="divide-y">
            {files.map(f => (
              <li key={f.id} className="flex items-center gap-3 py-3">
                <Paperclip className="size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.nome}</p>
                  <p className="text-xs text-muted-foreground">{f.tipo || "Arquivo"}{f.tamanho ? ` · ${formatSize(f.tamanho)}` : ""} · {formatDateTime(f.created_at)}</p>
                </div>
                <Button size="icon" variant="ghost" disabled={busyId === f.id} onClick={() => download(f)} title="Baixar">
                  <Download className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" disabled={busyId === f.id} title="Excluir">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir anexo?</AlertDialogTitle>
                      <AlertDialogDescription>"{f.nome}" será removido definitivamente. Essa ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(f)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
