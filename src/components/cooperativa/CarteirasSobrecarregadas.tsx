import { AlertTriangle, Building2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useData } from "@/contexts/DataContext";
import { exportToCSV } from "@/lib/exportUtils";

export const CarteirasSobrecarregadas = () => {
  const { gestores } = useData();

  const sobrecarregados = gestores
    .filter((g) => g.associadosAtuais >= g.limiteIdeal * 0.9)
    .sort((a, b) => {
      const percA = (a.associadosAtuais / a.limiteIdeal) * 100;
      const percB = (b.associadosAtuais / b.limiteIdeal) * 100;
      return percB - percA;
    });

  const handleExportar = () => {
    const dados = sobrecarregados.map((g) => {
      const percentual = (g.associadosAtuais / g.limiteIdeal) * 100;
      return {
        Gestor: g.nome,
        Agencia: g.agencia,
        Segmento: g.segmento,
        Subsegmento: g.subsegmento,
        AssociadosAtuais: g.associadosAtuais,
        LimiteIdeal: g.limiteIdeal,
        Excedente: g.associadosAtuais - g.limiteIdeal,
        PercentualOcupacao: `${percentual.toFixed(1)}%`,
      };
    });
    exportToCSV(dados, "carteiras-sobrecarregadas");
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Carteiras Sobrecarregadas ou em Atenção
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportar}>
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sobrecarregados.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma carteira sobrecarregada no momento
            </p>
          ) : (
            sobrecarregados.map((gestor) => {
              const percentual = (gestor.associadosAtuais / gestor.limiteIdeal) * 100;
              const excedente = gestor.associadosAtuais - gestor.limiteIdeal;
              const status = percentual >= 100 ? "sobrecarregado" : "atencao";

              return (
                <div
                  key={gestor.id}
                  className={`p-4 rounded-lg border ${
                    status === "sobrecarregado"
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-yellow-500/30 bg-yellow-500/5"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <p className="font-semibold">{gestor.nome}</p>
                        {status === "sobrecarregado" && (
                          <span className="px-2 py-0.5 bg-destructive/20 text-destructive text-xs rounded-full">
                            Sobrecarregado
                          </span>
                        )}
                        {status === "atencao" && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-600 text-xs rounded-full">
                            Atenção
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span>{gestor.agencia}</span>
                        </div>
                        <span>
                          {gestor.segmento} - {gestor.subsegmento}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {gestor.associadosAtuais} / {gestor.limiteIdeal}
                      </p>
                      <p
                        className={`text-sm font-semibold ${
                          status === "sobrecarregado" ? "text-destructive" : "text-yellow-600"
                        }`}
                      >
                        {percentual.toFixed(1)}%
                      </p>
                      {excedente > 0 && (
                        <p className="text-xs text-muted-foreground">
                          +{excedente} acima do limite
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
