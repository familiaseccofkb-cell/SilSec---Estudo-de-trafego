// Planos da anuidade. O preço cobrado vem sempre do servidor (nunca do navegador).
import {PLANS} from '../../public/licensing.js';

const reais = v => { const n = Number(String(v ?? '').replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null; };

export function salePlans(env = process.env) {
  return {
    basic: {
      id: 'basic', module: 'basic', name: 'Básico', annualCents: reais(env.PRECO_BASICO_ANUAL) ?? PLANS.basic.annual,
      summary: 'Cálculo de tráfego pela NBR 5665 em formulário direto, até 20 grupos, relatório e PDF.',
      features: ['Formulário NBR 5665 por coluna de grupos', 'População declarada e cálculo normativo', 'Relatório para imprimir ou salvar em PDF', 'Projetos guardados na sua conta'],
    },
    advanced: {
      id: 'advanced', module: 'advanced', name: 'Completo', annualCents: reais(env.PRECO_COMPLETO_ANUAL) ?? PLANS.advanced.annual,
      summary: 'Tudo do Básico, com NBR e ISO independentes, escadas rolantes, consumo de energia, propostas de fornecedores e PowerPoint.',
      features: ['Motores NBR 5665 e ISO 8100-32 independentes', 'Cálculo populacional por andar e ambiente', 'Escadas e esteiras rolantes', 'Performance, partidas e consumo de energia', 'Comparação de propostas de fornecedores', 'Relatório completo e apresentação em PowerPoint'],
    },
  };
}

export const brl = cents => (cents / 100).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
export const perMonth = cents => brl(Math.round(cents / 12));
