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
  StepTone,
} from '../../types/step';

/** Campos de um passo, com valores padrão para o que é opcional. */
export interface StepDraft<TSnapshot, THighlight> {
  readonly title: string;
  readonly description: string;
  readonly snapshot: TSnapshot;
  readonly highlights?: readonly THighlight[];
  readonly codeLine?: number;
  readonly tone?: StepTone;
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

  return {
    add(draft) {
      steps.push({
        id: nextId('passo'),
        title: draft.title,
        description: draft.description,
        snapshot: draft.snapshot,
        highlights: draft.highlights ?? [],
        codeLine: draft.codeLine ?? null,
        tone: draft.tone ?? 'info',
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
      };
    },
  };
}

/** Açúcar sintático para declarar complexidades de forma legível. */
export function complexity(notation: string, rationale: string): Complexity {
  return { notation, rationale };
}

/** Formata um valor para exibição dentro das descrições dos passos. */
export function quote(value: string): string {
  return `«${value}»`;
}
