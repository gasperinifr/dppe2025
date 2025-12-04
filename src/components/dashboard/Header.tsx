import { FileSpreadsheet } from "lucide-react";

export function Header() {
  return (
    <header className="gradient-header text-white shadow-elevated">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">
              DPPE 2025
            </h1>
            <p className="text-white/70 text-sm">
              Sistema de Gestão de Projetos de Pesquisa
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
