import { IFSCLogo } from "@/components/IFSCLogo";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

interface HeaderProps {
  onLogout?: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="gradient-header text-white shadow-elevated">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm">
              <IFSCLogo className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">
                DPPE 2025
              </h1>
              <p className="text-white/70 text-sm">
                Diretoria de Pós-Graduação, Pesquisa e Extensão
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-white hover:bg-white/10"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
