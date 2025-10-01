import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useData } from "@/contexts/DataContext";
import { Segmento } from "@/types";
import { exportToCSV } from "@/lib/exportUtils";

export const AnaliseSegmentos = () => {
  const { gestores, associados } = useData();

  const segmentos: Segmento[] = ["Agro", "PF", "PJ"];

  const analise = segmentos.map((seg) => {
    const gestoresSeg = gestores.filter((g) => g.segmento === seg);
    const associadosSeg = associados.filter((a) => a.segmento === seg);
    const capacidadeTotal = gestoresSeg.reduce((acc, g) => acc + g.limiteIdeal, 0);
    const ocupacaoAtual = gestoresSeg.reduce((acc, g) => acc + g.associadosAtuais, 0);
    const percentual = capacidadeTotal > 0 ? (ocupacaoAtual / capacidadeTotal) * 100 : 0;

    return {
      segmento: seg,
      gestores: gestoresSeg.length,
      associados: associadosSeg.length,
      capacidadeTotal,
      ocupacaoAtual,
      percentual,
      disponivel: capacidadeTotal - ocupacaoAtual,
    };
  });

  const handleExportar = () => {
    const dados = analise.map((a) => ({
      Segmento: a.segmento,
      Gestores: a.gestores,
      Associados: a.associados,
      CapacidadeTotal: a.capacidadeTotal,
      OcupacaoAtual: a.ocupacaoAtual,
      Disponivel: a.disponivel,
      PercentualOcupacao: `${a.percentual.toFixed(1)}%`,
    }));
    exportToCSV(dados, "analise-segmentos");
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Análise por Segmentos</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportar}>
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {analise.map((seg) => (
            <Card key={seg.segmento} className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">{seg.segmento}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gestores:</span>
                  <span className="font-semibold">{seg.gestores}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Associados:</span>
                  <span className="font-semibold">{seg.associados.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capacidade Total:</span>
                  <span className="font-semibold">{seg.capacidadeTotal.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Ocupação</span>
                    <span className="text-lg font-bold text-primary">
                      {seg.percentual.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-sicredi transition-all"
                      style={{ width: `${Math.min(seg.percentual, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Disponível:</span>
                  <div className="flex items-center gap-1">
                    {seg.disponivel > 0 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">
                          {seg.disponivel.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        <span className="font-semibold text-destructive">
                          {Math.abs(seg.disponivel).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
