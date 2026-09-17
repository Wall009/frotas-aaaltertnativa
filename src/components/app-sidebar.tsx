import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  CircleDollarSign,
  CarFront,
  ChartNoAxesCombined,
  ClipboardList,
  FileText,
  Gauge,
  Settings,
  ShieldAlert,
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

const mainItems = [
  { label: "Dashboard", to: "/dashboard", icon: Gauge },
  { label: "Veículos", to: "/veiculos", icon: CarFront },
  { label: "Documentação", to: "/documentacao", icon: FileText },
  { label: "Vencimentos e Agenda", to: "/vencimentos", icon: CalendarDays },
  { label: "Sinistros", to: "/sinistros", icon: ShieldAlert },
  { label: "Manutenção", to: "/manutencao", icon: Wrench },
  { label: "Dados complementares", to: "/dados-complementares", icon: CircleDollarSign },
  { label: "Relatórios", to: "/relatorios", icon: ChartNoAxesCombined },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <ClipboardList className="size-5" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <strong className="block truncate text-sm text-sidebar-accent-foreground">Controle de Frota</strong>
              <span className="block truncate text-xs text-sidebar-foreground/60">Gestão operacional</span>
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
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
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/configuracoes"} tooltip="Configurações">
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