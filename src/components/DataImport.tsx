import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { classificarAssociado } from "@/lib/classificationUtils";

export const DataImport = () => {
  const [importing, setImporting] = useState(false);
  const { importarDados } = useData();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      // Ler primeira planilha (assumindo que os dados estão na primeira aba)
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet);

      // Mapear gestores únicos
      const gestoresMap = new Map();
      const associadosProcessados: any[] = [];

      rawData.forEach((row: any) => {
        const gestorNome = row.gestor || row.Gestor;
        const agencia = row.agencia || row.Agencia;
        const carteira = row.carteira || row.Carteira;

        // Processar classificação do associado
        const classificacao = classificarAssociado({
          nome: row.associado || row.Associado,
          conta: String(row.conta || row.Conta || ""),
          agencia,
          gestor: gestorNome,
          carteira,
          segmento: row.segmento || row.Segmento,
          subsegmento: row.subsegmento || row.Subsegmento,
          renda: parseFloat(row.renda || row.Renda || 0),
          investimentos: parseFloat(row.investimentos || row.Investimentos || 0),
          idade: parseInt(row.idade || row.Idade || 0),
        });

        // Criar ID único para o gestor
        const gestorKey = `${gestorNome}-${agencia}-${carteira}`;
        
        if (!gestoresMap.has(gestorKey)) {
          gestoresMap.set(gestorKey, {
            id: `gestor-${gestorKey}`,
            nome: gestorNome,
            agencia,
            segmento: classificacao.segmento,
            subsegmento: classificacao.subsegmento,
            associadosAtuais: 0,
            limiteIdeal: 0, // Será calculado com base no subsegmento
          });
        }

        // Incrementar contador de associados
        const gestor = gestoresMap.get(gestorKey);
        gestor.associadosAtuais++;

        // Adicionar associado
        associadosProcessados.push({
          id: `assoc-${Date.now()}-${Math.random()}`,
          nome: row.associado || row.Associado,
          conta: String(row.conta || row.Conta || ""),
          segmento: classificacao.segmento,
          subsegmento: classificacao.subsegmento,
          gestorId: gestor.id,
          agencia,
          carteira,
          renda: parseFloat(row.renda || row.Renda || 0),
          investimentos: parseFloat(row.investimentos || row.Investimentos || 0),
          idade: parseInt(row.idade || row.Idade || 0),
          dataVinculo: new Date().toISOString(),
        });
      });

      // Definir limites ideais com base no subsegmento
      const limitesPadrao: Record<string, number> = {
        "Ag I": 250,
        "Ag II": 200,
        "Ag III": 120,
        "PF I": 10000,
        "PF II": 2500,
        "PF III": 450,
        "PF IV": 300,
        "PF V": 150,
        "PF VI": 60,
        "PF Melhor Idade": 2500,
        "MEI": 500,
        "E1": 500,
        "E2": 400,
        "E3": 300,
        "E4": 150,
        "E5": 90,
      };

      const gestores = Array.from(gestoresMap.values()).map((gestor: any) => ({
        ...gestor,
        limiteIdeal: limitesPadrao[gestor.subsegmento] || 100,
      }));

      // Calcular agências
      const agenciasMap = new Map();
      gestores.forEach((gestor: any) => {
        if (!agenciasMap.has(gestor.agencia)) {
          agenciasMap.set(gestor.agencia, {
            id: `agencia-${gestor.agencia}`,
            nome: gestor.agencia,
            gestores: [],
            totalAssociados: 0,
            segmentos: { Agro: 0, PF: 0, PJ: 0 },
          });
        }
        const agencia = agenciasMap.get(gestor.agencia);
        agencia.gestores.push(gestor);
        agencia.totalAssociados += gestor.associadosAtuais;
        agencia.segmentos[gestor.segmento] += gestor.associadosAtuais;
      });

      importarDados({
        gestores,
        associados: associadosProcessados,
        agencias: Array.from(agenciasMap.values()),
      });

      toast({
        title: "Importação concluída!",
        description: `${gestores.length} gestores e ${associadosProcessados.length} associados importados e classificados.`,
      });
    } catch (error) {
      console.error("Erro ao importar:", error);
      toast({
        title: "Erro na importação",
        description: "Verifique o formato do arquivo e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Importar Dados
        </CardTitle>
        <CardDescription>
          Importe dados de gestores e associados via planilha Excel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border-2 border-dashed border-primary/30 p-8 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Clique para selecionar ou arraste o arquivo aqui
              </p>
              <Button type="button" variant="secondary" disabled={importing}>
                {importing ? "Importando..." : "Selecionar Arquivo"}
              </Button>
            </label>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Formato esperado da planilha:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-6">
              <li>• Colunas esperadas: Agencia, Associado, Conta, Gestor, Carteira, Segmento, Subsegmento, Renda, Investimentos, Idade</li>
              <li>• O sistema classificará automaticamente os associados com base na renda, investimentos e idade</li>
              <li>• Se Segmento/Subsegmento não forem informados, serão classificados automaticamente</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
