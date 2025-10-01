import { useState } from "react";
import { Settings, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Configuracoes = () => {
  const { dimensionamento, updateDimensionamento } = useData();
  const [config, setConfig] = useState(dimensionamento);

  const handleSalvar = () => {
    updateDimensionamento(config);
    toast({
      title: "Configurações salvas!",
      description: "O dimensionamento das carteiras foi atualizado com sucesso",
    });
  };

  const updateLimite = (segmento: string, subsegmento: string, valor: number) => {
    setConfig((prev) =>
      prev.map((c) =>
        c.segmento === segmento && c.subsegmento === subsegmento
          ? { ...c, limiteIdeal: valor }
          : c
      )
    );
  };

  const segmentoAgro = config.filter((c) => c.segmento === "Agro");
  const segmentoPF = config.filter((c) => c.segmento === "PF");
  const segmentoPJ = config.filter((c) => c.segmento === "PJ");

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Configurações de Dimensionamento
        </CardTitle>
        <CardDescription>
          Ajuste os limites ideais de associados por subsegmento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="agro">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agro">Agro</TabsTrigger>
            <TabsTrigger value="pf">PF</TabsTrigger>
            <TabsTrigger value="pj">PJ</TabsTrigger>
          </TabsList>

          <TabsContent value="agro" className="space-y-4 mt-4">
            {segmentoAgro.map((item) => (
              <div key={item.subsegmento} className="grid grid-cols-2 gap-4 items-center">
                <Label>{item.subsegmento}</Label>
                <Input
                  type="number"
                  value={item.limiteIdeal}
                  onChange={(e) =>
                    updateLimite("Agro", item.subsegmento, parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="pf" className="space-y-4 mt-4">
            {segmentoPF.map((item) => (
              <div key={item.subsegmento} className="grid grid-cols-2 gap-4 items-center">
                <Label>{item.subsegmento}</Label>
                <Input
                  type="number"
                  value={item.limiteIdeal}
                  onChange={(e) =>
                    updateLimite("PF", item.subsegmento, parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="pj" className="space-y-4 mt-4">
            {segmentoPJ.map((item) => (
              <div key={item.subsegmento} className="grid grid-cols-2 gap-4 items-center">
                <Label>{item.subsegmento}</Label>
                <Input
                  type="number"
                  value={item.limiteIdeal}
                  onChange={(e) =>
                    updateLimite("PJ", item.subsegmento, parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <Button onClick={handleSalvar} className="w-full bg-gradient-sicredi hover:opacity-90">
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
};
