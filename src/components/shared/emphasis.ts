/**
 * Tradução dos papéis de destaque (`EmphasisRole`) para estilo visual.
 *
 * Vocabulário único para todas as estruturas: o aluno aprende uma vez que verde
 * significa "entrando/encontrado", vermelho "saindo", âmbar "sendo examinado" —
 * e essa leitura vale na pilha, na fila e na lista ligada.
 */

import type { EmphasisRole, StepTone } from '../../types/step';

export interface EmphasisStyle {
  /** Classes aplicadas à caixa do elemento destacado. */
  readonly box: string;
  /** Descrição do papel, usada por leitores de tela e pela legenda. */
  readonly label: string;
}

export const EMPHASIS: Record<EmphasisRole, EmphasisStyle> = {
  entering: {
    box: 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-4 ring-emerald-200',
    label: 'entrando na estrutura',
  },
  leaving: {
    box: 'border-rose-500 bg-rose-50 text-rose-900 ring-4 ring-rose-200',
    label: 'saindo da estrutura',
  },
  inspected: {
    box: 'border-amber-500 bg-amber-50 text-amber-900 ring-4 ring-amber-200',
    label: 'sendo examinado',
  },
  found: {
    box: 'border-emerald-600 bg-emerald-100 text-emerald-950 ring-4 ring-emerald-300',
    label: 'encontrado',
  },
  target: {
    box: 'border-violet-500 bg-violet-50 text-violet-900 ring-4 ring-violet-200',
    label: 'posição alvo',
  },
  anchor: {
    box: 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-4 ring-indigo-200',
    label: 'em foco',
  },
};

/** Cor das setas de ponteiro (`next`/`prev`) conforme o papel de destaque. */
export const EMPHASIS_ARROW: Record<EmphasisRole, string> = {
  entering: 'text-emerald-600',
  leaving: 'text-rose-600',
  inspected: 'text-amber-600',
  found: 'text-emerald-700',
  target: 'text-violet-600',
  anchor: 'text-indigo-600',
};

/** Estilo neutro de um elemento sem destaque no passo atual. */
export const NEUTRAL_BOX = 'border-slate-300 bg-white text-slate-800';

/** Cor neutra das setas de ponteiro. */
export const NEUTRAL_ARROW = 'text-slate-400';

/** Estilo de uma posição vazia do array. */
export const EMPTY_SLOT_BOX = 'border-dashed border-slate-300 bg-slate-50 text-slate-400';

export const TONE_STYLES: Record<StepTone, { panel: string; dot: string; label: string }> = {
  info: {
    panel: 'border-indigo-200 bg-indigo-50 text-indigo-950',
    dot: 'bg-indigo-500',
    label: 'Passo',
  },
  success: {
    panel: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    dot: 'bg-emerald-500',
    label: 'Concluído',
  },
  error: {
    panel: 'border-rose-300 bg-rose-50 text-rose-950',
    dot: 'bg-rose-500',
    label: 'Atenção',
  },
};

/**
 * Encontra o papel de destaque aplicável a um elemento. Quando um mesmo
 * elemento recebe mais de um destaque no passo, vence o primeiro declarado.
 */
export function findRole<T extends { readonly role: EmphasisRole }>(
  highlights: readonly T[],
  match: (highlight: T) => boolean,
): EmphasisRole | null {
  return highlights.find(match)?.role ?? null;
}
