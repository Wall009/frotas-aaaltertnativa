import { Outlet, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { GlobalSearch } from "@/components/global-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

function iniciais(email?: string | null): string {
  const nome = (email ?? "").split("@")[0] ?? "";
  const partes = nome.split(/[._-]+/).filter(Boolean);
  const letras = (partes.length > 1 ? partes[0]!.charAt(0) + partes[1]!.charAt(0) : nome.slice(0, 2)) || "?";
  return letras.toUpperCase();
}

export function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const leave = async () => {
    await signOut();
    await navigate({ to: "/auth" });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-background">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden text-sm font-medium text-muted-foreground lg:inline">Central de gestão da frota</span>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <GlobalSearch />
            <ThemeToggle />
            <div className="hidden min-w-0 items-center gap-2 border-l pl-3 sm:flex">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                aria-hidden
              >
                {iniciais(user?.email)}
              </span>
              <span className="max-w-44 truncate text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={leave} title="Sair" aria-label="Sair">
              <LogOut />
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
