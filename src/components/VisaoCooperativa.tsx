import { Building2, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { useData } from "@/contexts/DataContext";
import { ListaGestores } from "./cooperativa/ListaGestores.tsx";
import { CarteirasSobrecarregadas } from "./cooperativa/CarteirasSobrecarregadas.tsx";
import { AnaliseSegmentos } from "./cooperativa/AnaliseSegmentos.tsx";

interface VisaoCooperativaProps {
  onAgenciaSelect?: (agenciaId: string) => void;
}

export const VisaoCooperativa = ({ onAgenciaSelect }: VisaoCooperativaProps) => {
  const { agencias, gestores, associados } = useData();

  const totalAssociados = associados.length;
  const totalGestores = gestores.length;
  const carteirasProblema = gestores.filter(
    (g) => g.associadosAtuais > g.limiteIdeal * 0.9
  ).length;

  return (
    <div className="space-y-6">
      {/* Cards resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Agências</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{agencias.length}</div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Gestores</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalGestores}</div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Associados</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {totalAssociados.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-gradient-to-br from-card to-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Carteiras Atenção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{carteirasProblema}</div>
          </CardContent>
        </Card>
      </div>

      {/* Blocos das agências */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agencias.map((agencia) => (
          <Card 
            key={agencia.id} 
            className="border-primary/20 hover:border-primary/40 transition-all cursor-pointer hover:shadow-sicredi"
            onClick={() => onAgenciaSelect?.(agencia.id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {agencia.nome}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gestores:</span>
                <span className="font-semibold">{agencia.gestores.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Associados:</span>
                <span className="font-semibold">{agencia.totalAssociados.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-border space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Agro:</span>
                  <span>{agencia.segmentos.Agro}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">PF:</span>
                  <span>{agencia.segmentos.PF}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">PJ:</span>
                  <span>{agencia.segmentos.PJ}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Análises detalhadas */}
      <Tabs defaultValue="gestores" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gestores">Gestores e Carteiras</TabsTrigger>
          <TabsTrigger value="sobrecarregadas">Carteiras Sobrecarregadas</TabsTrigger>
          <TabsTrigger value="segmentos">Análise por Segmentos</TabsTrigger>
        </TabsList>

        <TabsContent value="gestores">
          <ListaGestores />
        </TabsContent>

        <TabsContent value="sobrecarregadas">
          <CarteirasSobrecarregadas />
        </TabsContent>

        <TabsContent value="segmentos">
          <AnaliseSegmentos />
        </TabsContent>
      </Tabs>
    </div>
  );
};
