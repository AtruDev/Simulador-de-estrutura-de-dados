/**
 * Construtor de trilhas de passos.
 *
 * É a única camada que conhece as duas pontas do sistema: chama a lógica pura
 * das estruturas de dados e **narra** o que aconteceu, produzindo os passos que
 * a interface reproduz. Nenhum componente React chama `push`/`pop`/`insertAt`
 * diretamente — todos pedem uma trilha a um planejador construído aqui.
 */

import { nextId } from '../ids';
import type {
  Complexity,
  OperationOutcome,
  OperationTrace,
  Pseudocode,
  Step,
  StepCounts,
  StepTone,
} from '../../types/step';
import { NO_COUNTS } from '../../types/step';

/** Campos de um passo, com valores padrão para o que é opcional. */
export interface StepDraft<TSnapshot, THighlight> {
  readonly title: string;
  readonly description: string;
  readonly snapshot: TSnapshot;
  readonly highlights?: readonly THighlight[];
  readonly codeLine?: number;
  readonly tone?: StepTone;
  /**
   * Trabalho realizado **neste passo**. O construtor acumula: o planejador
   * declara o custo local, que é a informação que ele de fato tem.
   */
  readonly counts?: Partial<StepCounts>;
}

/** Metadados da operação, informados ao fechar a trilha. */
export interface TraceDraft {
  readonly label: string;
  readonly complexity: Complexity;
  readonly outcome: OperationOutcome;
  readonly summary: string;
  readonly pseudocode: Pseudocode;
}

export interface TraceBuilder<TSnapshot, THighlight> {
  /** Acrescenta um passo ao final da trilha. */
  add: (draft: StepDraft<TSnapshot, THighlight>) => void;
  build: (draft: TraceDraft) => OperationTrace<TSnapshot, THighlight>;
}

export function createTraceBuilder<TSnapshot, THighlight>(): TraceBuilder<
  TSnapshot,
  THighlight
> {
  const steps: Step<TSnapshot, THighlight>[] = [];
  let acumulado: StepCounts = NO_COUNTS;

  return {
    add(draft) {
      const delta = draft.counts;
      if (delta !== undefined) {
        acumulado = {
          comparisons: acumulado.comparisons + (delta.comparisons ?? 0),
          moves: acumulado.moves + (delta.moves ?? 0),
          visits: acumulado.visits + (delta.visits ?? 0),
        };
      }

      steps.push({
        id: nextId('passo'),
        title: draft.title,
        description: draft.description,
        snapshot: draft.snapshot,
        highlights: draft.highlights ?? [],
        codeLine: draft.codeLine ?? null,
        tone: draft.tone ?? 'info',
        counts: acumulado,
      });
    },

    build(draft) {
      const [first, ...rest] = steps;
      if (first === undefined) {
        // Invariante do motor de passos: mesmo os casos de borda produzem passos.
        throw new Error('Uma trilha precisa conter ao menos um passo.');
      }
      return {
        id: nextId('trilha'),
        label: draft.label,
        steps: [first, ...rest],
        complexity: draft.complexity,
        outcome: draft.outcome,
        summary: draft.summary,
        pseudocode: draft.pseudocode,
        totals: acumulado,
      };
    },
  };
}

/** Açúcar sintático para declarar complexidades de forma legível. */
export function complexity(notation: string, rationale: string): Complexity {
  return { notation, rationale };
}

// ---------------------------------------------------------------------------
// Pseudocódigo com linhas rotuladas
// ---------------------------------------------------------------------------

/**
 * Uma linha do pseudocódigo. Quando algum passo precisa apontar para ela, vem
 * como par `[rótulo, texto]`; linhas puramente estruturais (`fim se`, `fim
 * enquanto`) que ninguém referencia vêm como texto solto.
 */
type Linha<R extends string> = string | readonly [R, string];

export interface PseudocodigoRotulado<R extends string> {
  readonly code: Pseudocode;
  /** Índice da linha de cada rótulo, para alimentar `codeLine`. */
  readonly em: Readonly<Record<R, number>>;
}

/**
 * Declara um pseudocódigo cujas linhas são endereçadas por **nome**, não por
 * número.
 *
 * O motivo é a fragilidade do endereçamento por índice: `codeLine: 4` só está
 * certo enquanto ninguém inserir uma linha acima da quarta. Quando alguém
 * insere, todos os índices seguintes passam a apontar para a linha de cima — e
 * nada acusa o erro, porque o índice continua dentro dos limites do array. O
 * sintoma aparece só na tela, com o destaque uma linha fora do lugar, que é
 * justamente o tipo de defeito que um material de estudo não pode ter.
 *
 * Com rótulo, reordenar ou inserir linhas não quebra nada, e um nome errado
 * vira erro de compilação em vez de destaque silenciosamente torto.
 */
export function pseudocodigo<const R extends string>(
  title: string,
  linhas: readonly Linha<R>[],
): PseudocodigoRotulado<R> {
  const textos: string[] = [];
  const em = {} as Record<R, number>;

  for (const linha of linhas) {
    if (typeof linha === 'string') {
      textos.push(linha);
      continue;
    }

    const [rotulo, texto] = linha;
    if (rotulo in em) {
      throw new Error(`Rótulo repetido no pseudocódigo de ${title}: ${rotulo}.`);
    }
    // O índice é a posição que a linha ocupará — por isso antes do push.
    em[rotulo] = textos.length;
    textos.push(texto);
  }

  const [primeira, ...resto] = textos;
  if (primeira === undefined) {
    throw new Error(`O pseudocódigo de ${title} está sem linhas.`);
  }

  return { code: { title, lines: [primeira, ...resto] }, em };
}

/** Formata um valor para exibição dentro das descrições dos passos. */
export function quote(value: string): string {
  return `«${value}»`;
}
