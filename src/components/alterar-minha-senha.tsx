import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export function AlterarMinhaSenha() {
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (senha.length < 8) { toast.error("A senha deve ter pelo menos 8 caracteres."); return; }
    if (senha !== confirma) { toast.error("As senhas não conferem."); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSaving(false);
    if (error) { toast.error("Não foi possível alterar a senha", { description: error.message }); return; }
    setSenha(""); setConfirma("");
    toast.success("Senha alterada", { description: "Use-a nos próximos acessos com e-mail e senha." });
  };

  return (
    <Card className="mb-6 rounded-lg">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary"><KeyRound className="size-5" /></span>
          <div>
            <CardTitle className="text-base">Minha senha</CardTitle>
            <CardDescription>Defina ou troque a senha da sua conta. Quem entra com Google também pode criar uma senha aqui.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="minha-senha">Nova senha</Label>
            <Input id="minha-senha" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={8} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minha-senha-confirma">Confirmar nova senha</Label>
            <Input id="minha-senha-confirma" type="password" autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)} minLength={8} required />
          </div>
          <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar senha"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
