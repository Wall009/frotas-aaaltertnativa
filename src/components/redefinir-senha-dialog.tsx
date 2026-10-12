import { useState, type FormEvent, type ReactNode } from "react";
import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type RpcClient = { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function gerarSenha(tamanho = 12): string {
  const bytes = new Uint32Array(tamanho);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

export function RedefinirSenhaDialog({ usuario, trigger }: { usuario: { id: string; nome?: string | null; email?: string | null }; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [senha, setSenha] = useState("");
  const [saving, setSaving] = useState(false);
  const [feito, setFeito] = useState(false);

  const abrir = (value: boolean) => {
    setOpen(value);
    if (value) { setSenha(gerarSenha()); setFeito(false); }
  };

  const copiar = async () => {
    try { await navigator.clipboard.writeText(senha); toast.success("Senha copiada"); }
    catch { toast.error("Não foi possível copiar. Selecione e copie manualmente."); }
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (senha.length < 8) { toast.error("A senha deve ter pelo menos 8 caracteres."); return; }
    setSaving(true);
    const { error } = await (supabase as unknown as RpcClient).rpc("admin_redefinir_senha", { p_user_id: usuario.id, p_nova_senha: senha });
    setSaving(false);
    if (error) { toast.error("Não foi possível redefinir a senha", { description: error.message }); return; }
    setFeito(true);
    toast.success("Senha redefinida", { description: "O usuário foi desconectado e precisa entrar com a senha nova." });
  };

  return (
    <Dialog open={open} onOpenChange={abrir}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="icon" variant="ghost" title="Redefinir senha" aria-label="Redefinir senha"><KeyRound className="size-4" /></Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
          <DialogDescription>{usuario.nome || usuario.email} · {usuario.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="space-y-2 py-4">
            <Label htmlFor="nova-senha">Nova senha</Label>
            <div className="flex gap-2">
              <Input id="nova-senha" value={senha} onChange={(e) => { setSenha(e.target.value); setFeito(false); }} autoComplete="off" spellCheck={false} className="font-mono" minLength={8} required />
              <Button type="button" variant="outline" size="icon" onClick={() => { setSenha(gerarSenha()); setFeito(false); }} title="Gerar outra" aria-label="Gerar outra senha"><RefreshCw /></Button>
              <Button type="button" variant="outline" size="icon" onClick={copiar} title="Copiar" aria-label="Copiar senha"><Copy /></Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {feito ? "Senha aplicada. Copie e envie ao usuário — ela não fica salva em lugar nenhum." : "Mínimo de 8 caracteres. Ao confirmar, o usuário é desconectado e precisa entrar com esta senha."}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{feito ? "Fechar" : "Cancelar"}</Button>
            {!feito && <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Redefinir senha"}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
