import { useState } from "react";
import { User, Building2, AlertCircle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useData } from "@/contexts/DataContext";
import { exportToCSV } from "@/lib/exportUtils";
import { AssociadosGestor } from "../AssociadosGestor";

interface ListaGestoresProps {
  onGestorSelect?: (gestorId: string) => void;
}

export const ListaGestores = ({ onGestorSelect }: ListaGestoresProps) => {
  const { gestores } = useData();
  const [gestorSelecionado, setGestorSelecionado] = useState<string | null>(null);

  const handleExportar = () => {
    const dados = gestores.map((g) => {
      const percentual = (g.associadosAtuais / g.limiteIdeal) * 100;
      return {
        Nome: g.nome,
        Agencia: g.agencia,
        Segmento: g.segmento,
        Subsegmento: g.subsegmento,
        AssociadosAtuais: g.associadosAtuais,
        LimiteIdeal: g.limiteIdeal,
        PercentualOcupacao: `${percentual.toFixed(1)}%`,
      };
    });
    exportToCSV(dados, "gestores");
  };

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Lista de Gestores
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportar}>
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {gestores.map((gestor) => {
              const percentual = (gestor.associadosAtuais / gestor.limiteIdeal) * 100;
              const status =
                percentual >= 100 ? "sobrecarregado" : percentual >= 90 ? "atencao" : "normal";

              return (
                <div
                  key={gestor.id}
                  onClick={() => setGestorSelecionado(gestor.id)}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer hover:shadow-sicredi"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">{gestor.nome}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span>{gestor.agencia}</span>
                          <span>•</span>
                          <span>
                            {gestor.segmento} - {gestor.subsegmento}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">
                        {gestor.associadosAtuais} / {gestor.limiteIdeal}
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <p
                          className={`text-sm ${
                            status === "sobrecarregado"
                              ? "text-destructive"
                              : status === "atencao"
                              ? "text-yellow-500"
                              : "text-primary"
                          }`}
                        >
                          {percentual.toFixed(1)}%
                        </p>
                        {status !== "normal" && (
                          <AlertCircle
                            className={`h-4 w-4 ${
                              status === "sobrecarregado" ? "text-destructive" : "text-yellow-500"
                            }`}
                          />
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {gestorSelecionado && (
        <AssociadosGestor
          gestorId={gestorSelecionado}
          onClose={() => setGestorSelecionado(null)}
        />
      )}
    </>
  );
};
