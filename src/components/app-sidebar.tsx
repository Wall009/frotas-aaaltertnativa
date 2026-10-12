import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  CircleDollarSign,
  CarFront,
  ChartNoAxesCombined,
  FileText,
  Gauge,
  Settings,
  ShieldAlert,
  TrafficCone,
  Wrench,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const grupos = [
  {
    titulo: "Operação",
    itens: [
      { label: "Dashboard", to: "/dashboard", icon: Gauge },
      { label: "Veículos", to: "/veiculos", icon: CarFront },
      { label: "Documentação", to: "/documentacao", icon: FileText },
      { label: "Vencimentos e Agenda", to: "/vencimentos", icon: CalendarDays },
    ],
  },
  {
    titulo: "Ocorrências",
    itens: [
      { label: "Sinistros", to: "/sinistros", icon: ShieldAlert },
      { label: "Manutenção", to: "/manutencao", icon: Wrench },
      { label: "Multas", to: "/multas", icon: TrafficCone },
    ],
  },
  {
    titulo: "Gestão",
    itens: [
      { label: "Dados complementares", to: "/dados-complementares", icon: CircleDollarSign },
      { label: "Relatórios", to: "/relatorios", icon: ChartNoAxesCombined },
    ],
  },
] as const;

const botao =
  "h-9 data-[active=true]:shadow-[inset_3px_0_0_0_var(--sidebar-primary)] data-[active=true]:bg-sidebar-accent";

export function AppSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-white/10">
            <img src="/aa-mark.png" alt="AA Alternativa" className="size-full object-contain" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <strong className="block truncate text-sm font-semibold text-sidebar-accent-foreground">Controle de Frota</strong>
              <span className="block truncate text-xs text-sidebar-foreground/60">AA Alternativa</span>
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {grupos.map((grupo) => (
          <SidebarGroup key={grupo.titulo}>
            <SidebarGroupLabel className="text-[0.68rem] uppercase tracking-wider text-sidebar-foreground/50">
              {grupo.titulo}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.itens.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label} className={botao}>
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/configuracoes"} tooltip="Configurações" className={botao}>
              <Link to="/configuracoes">
                <Settings />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
