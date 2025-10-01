import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Gestor,
  Associado,
  Agencia,
  Movimentacao,
  DimensionamentoConfig,
  Segmento,
  Subsegmento,
} from "@/types";

interface DataContextType {
  gestores: Gestor[];
  associados: Associado[];
  agencias: Agencia[];
  movimentacoes: Movimentacao[];
  dimensionamento: DimensionamentoConfig[];
  setGestores: (gestores: Gestor[]) => void;
  setAssociados: (associados: Associado[]) => void;
  setAgencias: (agencias: Agencia[]) => void;
  addMovimentacao: (movimentacao: Movimentacao) => void;
  updateDimensionamento: (config: DimensionamentoConfig[]) => void;
  realocarAssociados: (associadoIds: string[], gestorNovoId: string, motivo?: string) => void;
  importarDados: (dados: any) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const dimensionamentoPadrao: DimensionamentoConfig[] = [
  // Agro
  { segmento: "Agro", subsegmento: "Ag I", limiteIdeal: 250 },
  { segmento: "Agro", subsegmento: "Ag II", limiteIdeal: 200 },
  { segmento: "Agro", subsegmento: "Ag III", limiteIdeal: 120 },
  // PF
  { segmento: "PF", subsegmento: "PF I", limiteIdeal: 10000 },
  { segmento: "PF", subsegmento: "PF II", limiteIdeal: 2500 },
  { segmento: "PF", subsegmento: "PF III", limiteIdeal: 450 },
  { segmento: "PF", subsegmento: "PF IV", limiteIdeal: 300 },
  { segmento: "PF", subsegmento: "PF V", limiteIdeal: 150 },
  { segmento: "PF", subsegmento: "PF VI", limiteIdeal: 60 },
  { segmento: "PF", subsegmento: "PF Melhor Idade", limiteIdeal: 2500 },
  // PJ
  { segmento: "PJ", subsegmento: "MEI", limiteIdeal: 500 },
  { segmento: "PJ", subsegmento: "E1", limiteIdeal: 500 },
  { segmento: "PJ", subsegmento: "E2", limiteIdeal: 400 },
  { segmento: "PJ", subsegmento: "E3", limiteIdeal: 300 },
  { segmento: "PJ", subsegmento: "E4", limiteIdeal: 150 },
  { segmento: "PJ", subsegmento: "E5", limiteIdeal: 90 },
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gestores, setGestores] = useState<Gestor[]>([]);
  const [associados, setAssociados] = useState<Associado[]>([]);
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [dimensionamento, setDimensionamento] = useState<DimensionamentoConfig[]>(dimensionamentoPadrao);

  // Carregar dados do localStorage
  useEffect(() => {
    const stored = localStorage.getItem("sicredi-data");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.gestores) setGestores(data.gestores);
        if (data.associados) setAssociados(data.associados);
        if (data.agencias) setAgencias(data.agencias);
        if (data.movimentacoes) setMovimentacoes(data.movimentacoes);
        if (data.dimensionamento) setDimensionamento(data.dimensionamento);
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      }
    }
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    const data = { gestores, associados, agencias, movimentacoes, dimensionamento };
    localStorage.setItem("sicredi-data", JSON.stringify(data));
  }, [gestores, associados, agencias, movimentacoes, dimensionamento]);

  const addMovimentacao = (movimentacao: Movimentacao) => {
    setMovimentacoes((prev) => [movimentacao, ...prev]);
  };

  const updateDimensionamento = (config: DimensionamentoConfig[]) => {
    setDimensionamento(config);
  };

  const realocarAssociados = (associadoIds: string[], gestorNovoId: string, motivo?: string) => {
    const gestorNovo = gestores.find((g) => g.id === gestorNovoId);
    if (!gestorNovo) return;

    const novasMovimentacoes: Movimentacao[] = [];
    const associadosAtualizados = associados.map((associado) => {
      if (associadoIds.includes(associado.id)) {
        const gestorAntigo = gestores.find((g) => g.id === associado.gestorId);
        
        novasMovimentacoes.push({
          id: `mov-${Date.now()}-${associado.id}`,
          associadoId: associado.id,
          associadoNome: associado.nome,
          gestorAntigoId: associado.gestorId,
          gestorAntigoNome: gestorAntigo?.nome || "Desconhecido",
          gestorNovoId: gestorNovo.id,
          gestorNovoNome: gestorNovo.nome,
          agenciaAntiga: associado.agencia,
          agenciaNova: gestorNovo.agencia,
          data: new Date().toISOString(),
          motivo,
        });

        return {
          ...associado,
          gestorId: gestorNovoId,
          agencia: gestorNovo.agencia,
        };
      }
      return associado;
    });

    setAssociados(associadosAtualizados);
    setMovimentacoes((prev) => [...novasMovimentacoes, ...prev]);

    // Atualizar contadores dos gestores
    const gestoresAtualizados = gestores.map((gestor) => {
      const count = associadosAtualizados.filter((a) => a.gestorId === gestor.id).length;
      return { ...gestor, associadosAtuais: count };
    });
    setGestores(gestoresAtualizados);
  };

  const importarDados = (dados: any) => {
    if (dados.gestores) setGestores(dados.gestores);
    if (dados.associados) setAssociados(dados.associados);
    if (dados.agencias) setAgencias(dados.agencias);
  };

  return (
    <DataContext.Provider
      value={{
        gestores,
        associados,
        agencias,
        movimentacoes,
        dimensionamento,
        setGestores,
        setAssociados,
        setAgencias,
        addMovimentacao,
        updateDimensionamento,
        realocarAssociados,
        importarDados,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData deve ser usado dentro de DataProvider");
  }
  return context;
};
