import { IFSCLogo } from "@/components/IFSCLogo";

export function Header() {
  return (
    <header className="gradient-header text-white shadow-elevated">
      <div className="container mx-auto px-4 py-6">
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
      </div>
    </header>
  );
}
