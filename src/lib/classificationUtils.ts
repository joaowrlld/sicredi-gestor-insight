import { Segmento, Subsegmento } from "@/types";

export interface AssociadoRaw {
  nome: string;
  conta: string;
  agencia: string;
  gestor: string;
  carteira: string;
  segmento?: string;
  subsegmento?: string;
  renda: number;
  investimentos: number;
  idade: number;
}

export const classificarAssociado = (
  associado: AssociadoRaw
): { segmento: Segmento; subsegmento: Subsegmento } => {
  const { renda, investimentos, idade, segmento } = associado;

  // Se o segmento já está definido na planilha
  if (segmento) {
    const seg = segmento.toUpperCase();
    
    if (seg.includes("AGRO") || seg.includes("AG")) {
      return classificarAgro(investimentos);
    } else if (seg.includes("PJ") || seg.includes("E") || seg.includes("MEI")) {
      return classificarPJ(investimentos);
    } else if (seg.includes("PF")) {
      return classificarPF(renda, investimentos, idade);
    }
  }

  // Lógica de classificação automática baseada em renda e investimentos
  // Se for empresa (sem renda individual), classificar como PJ
  if (renda === 0 || !renda) {
    return classificarPJ(investimentos);
  }

  // Se tem idade e renda, provavelmente é PF
  return classificarPF(renda, investimentos, idade);
};

const classificarPF = (
  renda: number,
  investimentos: number,
  idade: number
): { segmento: "PF"; subsegmento: Subsegmento } => {
  // PF Melhor Idade: mais de 64 anos, renda até R$ 3.999,99 ou até R$ 79.999,99 investidos
  if (idade > 64 && ((renda >= 0 && renda <= 3999.99) || (investimentos >= 0 && investimentos <= 79999.99))) {
    return { segmento: "PF", subsegmento: "PF Melhor Idade" };
  }

  // PF VI: renda acima de R$ 30.000,00 ou mais de R$ 3 milhões investidos
  if (renda >= 30000 || investimentos > 3000000) {
    return { segmento: "PF", subsegmento: "PF VI" };
  }

  // PF V: renda entre R$ 15.000,00 e R$ 29.999,99 ou mais de R$ 500 mil investidos
  if ((renda >= 15000 && renda <= 29999.99) || investimentos > 500000) {
    return { segmento: "PF", subsegmento: "PF V" };
  }

  // PF IV: renda entre R$ 10.000,00 e R$ 14.999,99 ou mais de R$ 150 mil investidos
  if ((renda >= 10000 && renda <= 14999.99) || investimentos > 150000) {
    return { segmento: "PF", subsegmento: "PF IV" };
  }

  // PF III: renda entre R$ 4.000,00 e R$ 9.999,99 ou mais de R$ 80 mil investidos
  if ((renda >= 4000 && renda <= 9999.99) || investimentos > 80000) {
    return { segmento: "PF", subsegmento: "PF III" };
  }

  // PF II: renda entre R$ 2.000,00 e R$ 3.999,99 ou até R$ 79.999,99 investidos
  if ((renda >= 2000 && renda <= 3999.99) || (investimentos >= 0 && investimentos <= 79999.99)) {
    return { segmento: "PF", subsegmento: "PF II" };
  }

  // PF I: renda entre R$ 0,00 e R$ 1.999,99 ou até R$ 40 mil investidos
  return { segmento: "PF", subsegmento: "PF I" };
};

const classificarAgro = (
  faturamento: number
): { segmento: "Agro"; subsegmento: Subsegmento } => {
  // Ag III: acima de R$ 2,4 milhões
  if (faturamento > 2400000) {
    return { segmento: "Agro", subsegmento: "Ag III" };
  }

  // Ag II: entre R$ 500 mil e R$ 2,4 milhões
  if (faturamento >= 500000 && faturamento <= 2400000) {
    return { segmento: "Agro", subsegmento: "Ag II" };
  }

  // Ag I: até R$ 500 mil
  return { segmento: "Agro", subsegmento: "Ag I" };
};

const classificarPJ = (
  faturamento: number
): { segmento: "PJ"; subsegmento: Subsegmento } => {
  // E5: acima de R$ 25 milhões
  if (faturamento > 25000000) {
    return { segmento: "PJ", subsegmento: "E5" };
  }

  // E4: entre R$ 10 milhões e R$ 25 milhões
  if (faturamento >= 10000000 && faturamento <= 25000000) {
    return { segmento: "PJ", subsegmento: "E4" };
  }

  // E3: entre R$ 3 milhões e R$ 10 milhões
  if (faturamento >= 3000000 && faturamento < 10000000) {
    return { segmento: "PJ", subsegmento: "E3" };
  }

  // E2: entre R$ 500 mil e R$ 3 milhões
  if (faturamento >= 500000 && faturamento < 3000000) {
    return { segmento: "PJ", subsegmento: "E2" };
  }

  // E1: entre R$ 0,00 e R$ 500 mil
  if (faturamento >= 81000 && faturamento < 500000) {
    return { segmento: "PJ", subsegmento: "E1" };
  }

  // MEI: até R$ 81 mil
  return { segmento: "PJ", subsegmento: "MEI" };
};
