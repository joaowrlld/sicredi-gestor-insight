export type Segmento = "Agro" | "PF" | "PJ";

export type SubsegmentoAgro = "Ag I" | "Ag II" | "Ag III";
export type SubsegmentoPF = "PF I" | "PF II" | "PF III" | "PF IV" | "PF V" | "PF VI" | "PF Melhor Idade";
export type SubsegmentoPJ = "MEI" | "E1" | "E2" | "E3" | "E4" | "E5";

export type Subsegmento = SubsegmentoAgro | SubsegmentoPF | SubsegmentoPJ;

export interface DimensionamentoConfig {
  segmento: Segmento;
  subsegmento: Subsegmento;
  limiteIdeal: number;
}

export interface Gestor {
  id: string;
  nome: string;
  agencia: string;
  segmento: Segmento;
  subsegmento: Subsegmento;
  associadosAtuais: number;
  limiteIdeal: number;
}

export interface Associado {
  id: string;
  nome: string;
  conta: string;
  segmento: Segmento;
  subsegmento: Subsegmento;
  gestorId: string;
  agencia: string;
  carteira: string;
  renda: number;
  investimentos: number;
  idade: number;
  dataVinculo: string;
}

export interface Agencia {
  id: string;
  nome: string;
  gestores: Gestor[];
  totalAssociados: number;
  segmentos: {
    [key in Segmento]: number;
  };
}

export interface Movimentacao {
  id: string;
  associadoId: string;
  associadoNome: string;
  gestorAntigoId: string;
  gestorAntigoNome: string;
  gestorNovoId: string;
  gestorNovoNome: string;
  agenciaAntiga: string;
  agenciaNova: string;
  data: string;
  motivo?: string;
}

export interface AnaliseGestor {
  gestor: Gestor;
  percentualOcupacao: number;
  status: "normal" | "atencao" | "sobrecarregado";
  ganhosPeriodo: number;
  perdasPeriodo: number;
}
