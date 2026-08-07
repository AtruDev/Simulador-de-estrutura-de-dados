/**
 * Modelo de "passo" da animação — o contrato entre a lógica pura das estruturas
 * de dados e a camada de visualização.
 *
 * Princípio de projeto: cada passo carrega um **snapshot completo e imutável** do
 * estado da estrutura naquele instante. Isso torna "voltar um passo" uma simples
 * indexação num array, sem lógica de desfazer (undo) — que seria a principal
 * fonte de bugs sutis. Com estruturas de até ~20 elementos o custo é irrelevante.
 */

/** Array com pelo menos um elemento. Garante `steps[0]` sem verificação. */
export type NonEmptyArray<T> = readonly [T, ...T[]];

/** Complexidade assintótica de uma operação, exibida ao aluno. */
export interface Complexity {
  /** Notação Big-O, ex.: `'O(1)'`. */
  readonly notation: string;
  /** Explicação curta, em português, do porquê dessa complexidade. */
  readonly rationale: string;
}

/** Tom do passo — define a cor e o ícone com que a interface o comunica. */
export type StepTone = 'info' | 'success' | 'error';

/**
 * Papel visual de um elemento destacado num passo. Vocabulário único para todas
 * as estruturas, para que os componentes de visualização compartilhem as cores.
 */
export type EmphasisRole =
  /** Elemento entrando na estrutura. */
  | 'entering'
  /** Elemento saindo da estrutura. */
  | 'leaving'
  /** Elemento sendo examinado (peek, percurso de busca). */
  | 'inspected'
  /** Elemento que satisfez a busca. */
  | 'found'
  /** Posição/ponteiro alvo da operação. */
  | 'target'
  /** Ponteiro ou marcador em foco (topo, início, fim, cabeça, cauda). */
  | 'anchor';

/**
 * Trabalho realizado, na moeda com que a análise de algoritmos mede custo.
 *
 * Decisão didática deliberada: **verificações de controle não são contadas**.
 * Testar `isFull()` antes de um `push` é uma comparação para o processador, mas
 * contá-la ensinaria o aluno a somar a coisa errada — a análise de algoritmos
 * conta as operações *dominantes*, aquelas que crescem com o tamanho da
 * entrada. Por isso `comparisons` registra apenas comparação entre valores
 * (a de uma busca), e não os testes de borda da estrutura.
 *
 * É esse recorte que faz os números contarem a história certa: `push` custa uma
 * movimentação e nenhuma comparação; `deleteTail()` numa lista simplesmente
 * ligada custa n−1 visitas, e é por isso que ele é O(n) enquanto o mesmo
 * `deleteTail()` na lista dupla é O(1).
 */
export interface StepCounts {
  /** Comparações entre valores — o que uma busca faz a cada nó. */
  readonly comparisons: number;
  /** Escritas: gravar um valor numa posição ou religar um ponteiro. */
  readonly moves: number;
  /** Posições ou nós alcançados ao percorrer a estrutura. */
  readonly visits: number;
}

/** Contagem zerada — ponto de partida de toda trilha. */
export const NO_COUNTS: StepCounts = { comparisons: 0, moves: 0, visits: 0 };

/** Pseudocódigo da operação, com linhas indexadas a partir de 0. */
export interface Pseudocode {
  readonly title: string;
  readonly lines: NonEmptyArray<string>;
}

/**
 * Um passo discreto de uma operação.
 *
 * @typeParam TSnapshot  Estado imutável da estrutura APÓS este passo.
 * @typeParam THighlight União discriminada dos destaques visuais da estrutura.
 */
export interface Step<TSnapshot, THighlight> {
  readonly id: string;
  /** Rótulo curto, ex.: `'Verifica espaço disponível'`. */
  readonly title: string;
  /** Frase didática explicando o que acontece e por quê. */
  readonly description: string;
  /** Estado da estrutura ao final deste passo. */
  readonly snapshot: TSnapshot;
  /** O que a visualização deve realçar neste passo. */
  readonly highlights: readonly THighlight[];
  /** Linha do pseudocódigo correspondente, ou `null` se não houver. */
  readonly codeLine: number | null;
  readonly tone: StepTone;
  /**
   * Trabalho **acumulado** do início da operação até o fim deste passo. Igual ao
   * snapshot: cada passo carrega o total daquele instante, para que voltar um
   * passo continue sendo uma indexação, sem recalcular nada.
   */
  readonly counts: StepCounts;
}

/**
 * Resultado global de uma operação.
 *
 * `'error'` significa "a operação não produziu o resultado pretendido" — o que
 * inclui tanto as impossíveis (pop numa pilha vazia) quanto as que se
 * concluíram sem sucesso (uma busca que não encontrou o valor). Serve para a
 * interface destacar esses casos; nenhum deles lança exceção.
 */
export type OperationOutcome = 'success' | 'error';

/**
 * Decomposição completa de uma operação em passos — a unidade que o motor de
 * passos produz e que a interface reproduz.
 *
 * Casos de borda (pilha vazia, fila cheia, busca sem resultado) **não** são
 * exceções: produzem uma trilha normal, com `outcome: 'error'`, cujos passos
 * explicam ao aluno por que a operação não pôde ser concluída.
 */
export interface OperationTrace<TSnapshot, THighlight> {
  readonly id: string;
  /** Assinatura da operação como o aluno a disparou, ex.: `'push(42)'`. */
  readonly label: string;
  readonly steps: NonEmptyArray<Step<TSnapshot, THighlight>>;
  readonly complexity: Complexity;
  readonly outcome: OperationOutcome;
  /** Frase-resumo que vai para o log de operações. */
  readonly summary: string;
  readonly pseudocode: Pseudocode;
  /** Custo total da operação — o acumulado do último passo. */
  readonly totals: StepCounts;
}

/** Entrada do log de operações da sessão. */
export interface LogEntry<TSnapshot, THighlight> {
  readonly trace: OperationTrace<TSnapshot, THighlight>;
  /** Momento em que a operação foi disparada (hora local, formatada). */
  readonly time: string;
  /** Posição na sessão, começando em 1. */
  readonly sequence: number;
}

/** Estado final de uma trilha — atalho tipado para o snapshot do último passo. */
export function finalSnapshot<TSnapshot, THighlight>(
  trace: OperationTrace<TSnapshot, THighlight>,
): TSnapshot {
  const steps = trace.steps;
  // `NonEmptyArray` garante o índice 0; o último índice é sempre válido.
  const last = steps[steps.length - 1] ?? steps[0];
  return last.snapshot;
}
