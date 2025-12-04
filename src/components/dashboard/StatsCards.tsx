import { Projeto } from "@/types/projeto";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  PlayCircle, 
  XCircle,
  Building2
} from "lucide-react";

interface StatsCardsProps {
  projetos: Projeto[];
}

export function StatsCards({ projetos }: StatsCardsProps) {
  const stats = {
    total: projetos.length,
    aprovados: projetos.filter(p => p.situacao === 'APROVADO').length,
    emExecucao: projetos.filter(p => p.situacao === 'EM EXECUÇÃO').length,
    emAndamento: projetos.filter(p => p.situacao === 'CADASTRO EM ANDAMENTO').length,
    reprovados: projetos.filter(p => p.situacao === 'REPROVADO').length,
    departamentos: new Set(projetos.map(p => p.departamento).filter(Boolean)).size,
  };

  const cards = [
    {
      title: "Total de Projetos",
      value: stats.total,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Aprovados",
      value: stats.aprovados,
      icon: CheckCircle,
      color: "text-status-approved",
      bgColor: "bg-status-approved/10",
    },
    {
      title: "Em Execução",
      value: stats.emExecucao,
      icon: PlayCircle,
      color: "text-status-executing",
      bgColor: "bg-status-executing/10",
    },
    {
      title: "Em Andamento",
      value: stats.emAndamento,
      icon: Clock,
      color: "text-status-pending",
      bgColor: "bg-status-pending/10",
    },
    {
      title: "Reprovados",
      value: stats.reprovados,
      icon: XCircle,
      color: "text-status-rejected",
      bgColor: "bg-status-rejected/10",
    },
    {
      title: "Departamentos",
      value: stats.departamentos,
      icon: Building2,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className="bg-card rounded-xl p-4 shadow-card border border-border/50 animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className={`inline-flex p-2 rounded-lg ${card.bgColor} mb-3`}>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <p className="text-2xl font-bold font-display text-foreground">
            {card.value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
        </div>
      ))}
    </div>
  );
}
