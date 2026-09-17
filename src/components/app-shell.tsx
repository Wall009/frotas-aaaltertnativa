import { Outlet, useNavigate } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="hidden h-6 w-px bg-border sm:block" />
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">Central de gestão da frota</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden min-w-0 items-center gap-2 sm:flex">
              <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><UserRound className="size-4" /></span>
              <span className="max-w-48 truncate text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={leave} title="Sair" aria-label="Sair">
              <LogOut />
            </Button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}