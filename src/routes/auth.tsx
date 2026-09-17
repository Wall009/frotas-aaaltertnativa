import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Acesso — Controle de Frota" }, { name: "description", content: "Acesso seguro ao sistema Controle de Frota." },
    { property: "og:title", content: "Acesso — Controle de Frota" }, { property: "og:description", content: "Acesso seguro ao sistema Controle de Frota." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "cadastro">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState(""); const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault(); setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); setBusy(false);
      if (error) { toast.error("Não foi possível entrar", { description: error.message }); return; }
      await navigate({ to: "/dashboard" }); return;
    }
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { nome: name.trim() }, emailRedirectTo: window.location.origin } }); setBusy(false);
    if (error) { toast.error("Não foi possível criar o acesso", { description: error.message }); return; }
    if (!data.session) { toast.success("Confira seu e-mail", { description: "Use o link de confirmação para liberar o acesso." }); return; }
    await navigate({ to: "/dashboard" });
  };
  const google = async () => {
    setBusy(true); const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Não foi possível entrar com Google", { description: result.error.message }); setBusy(false); return; }
    if (!result.redirected) await navigate({ to: "/dashboard" });
  };
  return <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
    <section className="hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between"><div className="flex items-center gap-3 text-sidebar-accent-foreground"><span className="flex size-11 items-center justify-center rounded-md bg-white p-2 shadow-sm"><img src="/aa-mark.png" alt="AA Alternativa" className="size-full object-contain" /></span><strong>Controle de Frota</strong></div><div className="max-w-xl"><p className="mb-4 text-sm font-semibold uppercase text-sidebar-primary">Gestão operacional centralizada</p><h1 className="text-5xl font-bold leading-tight text-sidebar-accent-foreground">Sua frota, documentos e operação em um só lugar.</h1><p className="mt-5 text-lg leading-relaxed text-sidebar-foreground/70">Acompanhe veículos, vencimentos, agenda, sinistros e manutenção com dados confiáveis.</p></div><p className="text-xs text-sidebar-foreground/50">Acesso restrito a usuários autorizados</p></section>
    <section className="flex items-center justify-center p-5 sm:p-10"><Card className="w-full max-w-md border-0 shadow-panel"><CardHeader><div className="mb-5 flex size-11 items-center justify-center rounded-md bg-white p-2 shadow-sm ring-1 ring-border lg:hidden"><img src="/aa-mark.png" alt="AA Alternativa" className="size-full object-contain" /></div><CardTitle className="text-2xl">{mode === "login" ? "Bem-vindo" : "Criar acesso"}</CardTitle><CardDescription>{mode === "login" ? "Entre para acessar a gestão da frota." : "Cadastre seus dados para começar."}</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4">{mode === "cadastro" && <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required /></div>}<div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required /></div><div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={72} required /></div><Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}{mode === "login" ? "Entrar" : "Criar acesso"}</Button></form><div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">ou</span><div className="h-px flex-1 bg-border" /></div><Button type="button" variant="outline" className="w-full" onClick={google} disabled={busy}>Continuar com Google</Button><Button type="button" variant="link" className="mt-3 w-full" onClick={() => setMode(mode === "login" ? "cadastro" : "login")}>{mode === "login" ? "Ainda não tenho acesso" : "Já tenho acesso"}</Button></CardContent></Card></section>
  </main>;
}