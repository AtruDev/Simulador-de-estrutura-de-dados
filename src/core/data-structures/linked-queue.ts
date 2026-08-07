/**
 * Fila com **alocação dinâmica** — o mesmo TAD da fila em vetor circular,
 * implementado com nós ligados por ponteiros.
 *
 * Módulo **puro**, como os demais.
 *
 * Assim como a pilha encadeada, é uma casca fina sobre a lista simplesmente
 * ligada, com as operações restritas às duas pontas: `enqueue` é `insertTail`
 * e `dequeue` é `deleteHead`. O **início** da fila é a cabeça da lista e o
 * **fim** é a cauda.
 *
 * Por que as duas operações são O(1): a lista mantém um ponteiro de cauda, e é
 * ele que permite inserir no fim sem percorrer nada. Sem esse ponteiro,
 * `enqueue` custaria O(n) — é a mesma razão pela qual `insertTail` é barato na
 * lista ligada, e vale a pena dizer isso em voz alta em aula.
 *
 * Diferenças em relação à fila em vetor circular, que é o que se quer comparar:
 * não há capacidade fixa nem `isFull`, e não há aritmética modular — nada "dá a
 * volta", porque não existe array a reaproveitar. Em compensação, cada nó custa
 * o espaço extra do ponteiro.
 */

import {
  type LinkedListState,
  type ListMutation,
  type ListNode,
  type NewNode,
  createList,
  deleteHead,
  getNode,
  insertTail,
  toArray,
} from './linked-list';

/**
 * Estado da fila encadeada. É o estado de uma lista simplesmente ligada: a
 * cabeça é o **início** e a cauda é o **fim**.
 */
export type LinkedQueueState = LinkedListState;

export type LinkedQueueMutation = ListMutation;

export type LinkedQueuePeek =
  | { readonly ok: true; readonly node: ListNode }
  | { readonly ok: false; readonly error: 'UNDERFLOW' };

/** Cria uma fila encadeada, enfileirando os valores na ordem recebida. */
export function createLinkedQueue(values: readonly NewNode[] = []): LinkedQueueState {
  return createList('singly', values);
}

export function size(state: LinkedQueueState): number {
  return state.size;
}

export function isEmpty(state: LinkedQueueState): boolean {
  return state.size === 0;
}

/** Nó do início — o próximo a ser atendido —, ou `null` na fila vazia. */
export function frontNode(state: LinkedQueueState): ListNode | null {
  return getNode(state, state.head);
}

/** Nó do fim, ou `null` na fila vazia. */
export function rearNode(state: LinkedQueueState): ListNode | null {
  return getNode(state, state.tail);
}

/**
 * Enfileira no fim. **Nunca falha**: sem capacidade fixa não há overflow.
 * Custa O(1) porque o ponteiro de fim evita o percurso até a cauda.
 */
export function enqueue(state: LinkedQueueState, novo: NewNode): LinkedQueueMutation {
  return insertTail(state, novo);
}

/** Remove do início (FIFO). Falha com `EMPTY` na fila vazia (underflow). */
export function dequeue(state: LinkedQueueState): LinkedQueueMutation {
  return deleteHead(state);
}

/** Consulta o início **sem removê-lo**. */
export function peek(state: LinkedQueueState): LinkedQueuePeek {
  const node = frontNode(state);
  if (node === null) return { ok: false, error: 'UNDERFLOW' };
  return { ok: true, node };
}

/** Valores na ordem de saída, do início para o fim. */
export function toArrayFromFront(state: LinkedQueueState): readonly string[] {
  return toArray(state);
}
