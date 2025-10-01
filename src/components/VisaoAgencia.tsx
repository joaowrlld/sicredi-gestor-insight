import { useState } from "react";
import { Building2, Users, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";

interface VisaoAgenciaProps {
  selectedAgenciaId?: string;
}

export const VisaoAgencia = ({ selectedAgenciaId }: VisaoAgenciaProps) => {
  const { agencias, gestores, associados } = useData();
  const [agenciaSelecionada, setAgenciaSelecionada] = useState<string>(selectedAgenciaId || "");

  const agencia = agencias.find((a) => a.id === agenciaSelecionada);
  const gestoresAgencia = gestores.filter((g) => g.agencia === agencia?.nome);
  const associadosAgencia = associados.filter((a) => a.agencia === agencia?.nome);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Selecionar Agência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={agenciaSelecionada} onValueChange={setAgenciaSelecionada}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma agência" />
            </SelectTrigger>
            <SelectContent>
              {agencias.map((ag) => (
                <SelectItem key={ag.id} value={ag.id}>
                  {ag.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {agencia && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gestores</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{gestoresAgencia.length}</div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Associados</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {associadosAgencia.length.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Agro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{agencia.segmentos.Agro}</div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">PF + PJ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {agencia.segmentos.PF + agencia.segmentos.PJ}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Gestores da Agência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {gestoresAgencia.map((gestor) => {
                  const percentual = (gestor.associadosAtuais / gestor.limiteIdeal) * 100;
                  const status =
                    percentual >= 100
                      ? "sobrecarregado"
                      : percentual >= 90
                      ? "atencao"
                      : "normal";

                  return (
                    <div
                      key={gestor.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/40 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{gestor.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {gestor.segmento} - {gestor.subsegmento}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {gestor.associadosAtuais} / {gestor.limiteIdeal}
                        </p>
                        <div className="flex items-center gap-2">
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
                                status === "sobrecarregado"
                                  ? "text-destructive"
                                  : "text-yellow-500"
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
