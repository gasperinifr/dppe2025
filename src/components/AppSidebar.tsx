import { LayoutDashboard, Upload, LogOut, Moon, Sun } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
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
import { IFSCLogo } from "@/components/IFSCLogo";
import { useSidebarActions } from "@/contexts/SidebarActionsContext";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { openImport, logout } = useSidebarActions();

  const isActive = (path: string) => location.pathname === path;

  const baseClasses = "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  const activeClasses = "bg-sidebar-accent text-sidebar-accent-foreground font-medium";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
            <IFSCLogo className="w-7 h-7 text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-display font-bold leading-tight truncate">
                DPPE 2025
              </p>
              <p className="text-[10px] text-sidebar-foreground/60 leading-tight truncate">
                IFSC
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Dashboard"
                  onClick={() => navigate("/")}
                  className={`${baseClasses} ${isActive("/") ? activeClasses : ""}`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Importar CSV"
                  onClick={openImport}
                  className={baseClasses}
                >
                  <Upload className="h-4 w-4" />
                  <span>Importar CSV</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={theme === "dark" ? "Tema claro" : "Tema escuro"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={baseClasses}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>{theme === "dark" ? "Tema claro" : "Tema escuro"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sair"
              onClick={logout}
              className={baseClasses}
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
