import { useState, useRef } from "react";
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = async (file: File | null) => {
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Expected column names (accept multiple variants)
      const headerMapCandidates = {
        cod_agencia: ["cod_agencia", "agencia", "Codigo Agencia", "Agencia", "codigo_agencia", "codAgencia"],
        cod_carteira: ["cod_carteira", "carteira", "Carteira", "codigo_carteira", "codCarteira"],
        cpf_cpnj: ["cpf_cpnj", "cpf_cnpj", "cpf", "cnpj", "Cpf/Cnpj", "CpfCnpj"],
        tipo_pessoa: ["tipo_pessoa", "tipo", "tipoPessoa"],
        contra_principal: ["contra_principal", "contra_principal", "contraprincipal"],
        des_segmento: ["des_segmento", "segmento", "Segmento"],
        nom_gestor_carteira: ["nom_gestor_carteira", "gestor", "nom_gestor", "Nom_Gestor_Carteira", "Gestor"],
        des_subsegmento: ["des_subsegmento", "subsegmento", "Subsegmento"],
      } as Record<string, string[]>;

      // Read header row to map columns
      const range = XLSX.utils.decode_range(sheet['!ref'] || "A1:A1");
      const headerRow = range.s.r; // start row
      const headers: Record<number, string> = {};
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { c: C, r: headerRow };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        const cell = sheet[cellRef];
        if (cell && cell.v) {
          headers[C] = String(cell.v).toString().trim();
        }
      }

      // Create a mapping from expected key -> actual column index
      const headerIndexMap: Record<string, number | undefined> = {};
      Object.entries(headerMapCandidates).forEach(([key, variants]) => {
        for (const [colIndex, headerName] of Object.entries(headers)) {
          const normalized = headerName.toLowerCase().replace(/\s|_|\//g, "");
          if (variants.map(v => v.toLowerCase().replace(/\s|_|\//g, "")).includes(normalized)) {
            headerIndexMap[key] = Number(colIndex);
            break;
          }
        }
      });

      // Fallback: if some required columns are missing, try reading by common names using sheet_to_json
      const totalRows = range.e.r - headerRow; // approximate

      // We'll process rows in chunks to avoid blocking UI
      const CHUNK_SIZE = 5000; // adjustable
      const associadosProcessados: any[] = [];
      const gestoresMap = new Map<string, any>();

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

      const sheetJsonOpts = { header: 1 as const, raw: false };
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, sheetJsonOpts) as any[];

      // Remove header row
      const dataRows = rows.slice(1);

      let processed = 0;

      while (processed < dataRows.length) {
        const chunk = dataRows.slice(processed, processed + CHUNK_SIZE);

        chunk.forEach((row: any) => {
          // row is an array of cell values matching header columns
          const getByKey = (key: string) => {
            const idx = headerIndexMap[key];
            if (typeof idx === 'number') return row[idx];
            return undefined;
          };

          const agencia = getByKey('cod_agencia') || getByKey('agencia') || row[0];
          const carteira = getByKey('cod_carteira') || getByKey('cod_carteira');
          const gestorNome = getByKey('nom_gestor_carteira') || getByKey('nom_gestor') || row[0];

          const classificacao = classificarAssociado({
            nome: getByKey('cpf_cpnj') || row[0],
            conta: String(getByKey('cod_carteira') || ""),
            agencia,
            gestor: gestorNome,
            carteira,
            segmento: getByKey('des_segmento') || undefined,
            subsegmento: getByKey('des_subsegmento') || undefined,
            renda: 0,
            investimentos: 0,
            idade: 0,
          });

          const gestorKey = `${gestorNome}-${agencia}-${carteira}`;
          if (!gestoresMap.has(gestorKey)) {
            gestoresMap.set(gestorKey, {
              id: `gestor-${gestorKey}`,
              nome: gestorNome,
              agencia,
              segmento: classificacao.segmento,
              subsegmento: classificacao.subsegmento,
              associadosAtuais: 0,
              limiteIdeal: limitesPadrao[classificacao.subsegmento] || 100,
            });
          }

          const gestor = gestoresMap.get(gestorKey);
          gestor.associadosAtuais++;

          associadosProcessados.push({
            id: `assoc-${Date.now()}-${Math.random()}`,
            nome: getByKey('cpf_cpnj') || '',
            conta: String(getByKey('cod_carteira') || ''),
            segmento: classificacao.segmento,
            subsegmento: classificacao.subsegmento,
            gestorId: gestor.id,
            agencia,
            carteira,
            renda: 0,
            investimentos: 0,
            idade: 0,
            dataVinculo: new Date().toISOString(),
          });
        });

        processed += chunk.length;

        // allow UI to update
        await new Promise((res) => setTimeout(res, 0));
      }

      const gestores = Array.from(gestoresMap.values()).map((gestor: any) => ({
        ...gestor,
        limiteIdeal: gestor.limiteIdeal || limitesPadrao[gestor.subsegmento] || 100,
      }));

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    await processFile(file);
    // clear input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0] || null;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const openFileDialog = () => {
    if (fileInputRef.current) fileInputRef.current.click();
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
          <div
            className="rounded-lg border-2 border-dashed border-primary/30 p-8 text-center hover:border-primary/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={(e) => e.preventDefault()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <div className="cursor-pointer" onClick={openFileDialog} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') openFileDialog(); }}>
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Clique para selecionar ou arraste o arquivo aqui
              </p>
              <Button type="button" variant="secondary" disabled={importing} onClick={openFileDialog}>
                {importing ? "Importando..." : "Selecionar Arquivo"}
              </Button>
            </div>
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
