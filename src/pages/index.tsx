import { useState } from "react";
import { Building2, Users, ArrowRightLeft, History, Settings, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataProvider } from "@/contexts/DataContext";
import { VisaoCooperativa } from "@/components/VisaoCooperativa";
import { VisaoAgencia } from "@/components/VisaoAgencia";
import { RealocacaoAssociados } from "@/components/RealocacaoAssociados";
import { Movimentacoes } from "@/components/Movimentacoes";
import { Configuracoes } from "@/components/Configuracoes";
import { DataImport } from "@/components/DataImport";

const Index = () => {
  const [activeTab, setActiveTab] = useState("cooperativa");
  const [selectedAgencia, setSelectedAgencia] = useState<string>("");

  const handleAgenciaSelect = (agenciaId: string) => {
    setSelectedAgencia(agenciaId);
    setActiveTab("agencia");
  };

  return (
    <DataProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-sicredi flex items-center justify-center shadow-glow">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-sicredi bg-clip-text text-transparent">
                  Sistema de Monitoramento Sicredi
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestão Inteligente de Carteiras e Associados
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-card border border-border">
              <TabsTrigger value="cooperativa" className="data-[state=active]:bg-gradient-sicredi data-[state=active]:text-white">
                <Building2 className="h-4 w-4 mr-2" />
                Cooperativa
              </TabsTrigger>
              <TabsTrigger value="agencia" className="data-[state=active]:bg-gradient-sicredi data-[state=active]:text-white">
                <Users className="h-4 w-4 mr-2" />
                Agência
              </TabsTrigger>
              <TabsTrigger value="realocacao" className="data-[state=active]:bg-gradient-sicredi data-[state=active]:text-white">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Realocação
              </TabsTrigger>
              <TabsTrigger value="movimentacoes" className="data-[state=active]:bg-gradient-sicredi data-[state=active]:text-white">
                <History className="h-4 w-4 mr-2" />
                Movimentações
              </TabsTrigger>
              <TabsTrigger value="importar" className="data-[state=active]:bg-gradient-sicredi data-[state=active]:text-white">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </TabsTrigger>
              <TabsTrigger value="config" className="data-[state=active]:bg-gradient-sicredi data-[state=active]:text-white">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cooperativa">
              <VisaoCooperativa onAgenciaSelect={handleAgenciaSelect} />
            </TabsContent>

            <TabsContent value="agencia">
              <VisaoAgencia selectedAgenciaId={selectedAgencia} />
            </TabsContent>

            <TabsContent value="realocacao">
              <RealocacaoAssociados />
            </TabsContent>

            <TabsContent value="movimentacoes">
              <Movimentacoes />
            </TabsContent>

            <TabsContent value="importar">
              <DataImport />
            </TabsContent>

            <TabsContent value="config">
              <Configuracoes />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </DataProvider>
  );
};

export default Index;
