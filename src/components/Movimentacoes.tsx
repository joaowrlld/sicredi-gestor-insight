import { History, ArrowRight, Building2, User, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { exportToCSV } from "@/lib/exportUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Movimentacoes = () => {
  const { movimentacoes } = useData();

  const handleExportar = () => {
    const dados = movimentacoes.map((m) => ({
      Data: format(new Date(m.data), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      Associado: m.associadoNome,
      GestorAntigo: m.gestorAntigoNome,
      GestorNovo: m.gestorNovoNome,
      AgenciaAntiga: m.agenciaAntiga,
      AgenciaNova: m.agenciaNova,
      Motivo: m.motivo || "-",
    }));
    exportToCSV(dados, "movimentacoes");
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Movimentações
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportar}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {movimentacoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma movimentação registrada ainda
            </p>
          ) : (
            movimentacoes.map((mov) => (
              <div
                key={mov.id}
                className="p-4 rounded-lg border border-border hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-lg">{mov.associadoNome}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(mov.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Gestor Anterior</p>
                        <p className="font-medium">{mov.gestorAntigoNome}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Agência</p>
                        <p className="font-medium">{mov.agenciaAntiga}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <ArrowRight className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Novo Gestor</p>
                          <p className="font-medium text-primary">{mov.gestorNovoNome}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Agência</p>
                          <p className="font-medium text-primary">{mov.agenciaNova}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {mov.motivo && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">Motivo:</p>
                    <p className="text-sm">{mov.motivo}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
