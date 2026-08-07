/**
 * Pilha com **alocação dinâmica** — o mesmo TAD da pilha em vetor, implementado
 * com nós ligados por ponteiros.
 *
 * Módulo **puro**, como os demais: sem React, sem estado global, sem mutação.
 *
 * A implementação é deliberadamente uma casca fina sobre a lista simplesmente
 * ligada, porque é exatamente isso que uma pilha encadeada é: uma lista em que
 * as operações estão **restritas a uma ponta**. `push` é `insertHead` e `pop` é
 * `deleteHead` — ambos O(1), já que nenhum dos dois precisa percorrer nada.
 *
 * A casca existe para dar nome próprio às operações. Ela é o lado prático da
 * distinção que a disciplina ensina: o **TAD** é o contrato (push, pop, peek),
 * a **estrutura de dados** é a escolha de como cumpri-lo — e a mesma pilha pode
 * ser cumprida por um vetor ou por nós encadeados.
 *
 * Diferença que o aluno precisa enxergar: aqui **não existe `isFull`**. Cada nó
 * é alocado individualmente, então não há capacidade fixa nem overflow — o
 * limite é a memória disponível, não uma constante escolhida na declaração.
 */

import {
  type LinkedListState,
  type ListMutation,
  type ListNode,
  type NewNode,
  createList,
  deleteHead,
  emptyList,
  getNode,
  insertHead,
  toArray,
} from './linked-list';

/**
 * Estado da pilha encadeada. É o estado de uma lista simplesmente ligada: o
 * ponteiro de **topo** é a cabeça da lista.
 */
export type LinkedStackState = LinkedListState;

export type LinkedStackMutation = ListMutation;

export type LinkedStackPeek =
  | { readonly ok: true; readonly node: ListNode }
  | { readonly ok: false; readonly error: 'UNDERFLOW' };

/** Cria uma pilha encadeada vazia. */
export function createLinkedStack(values: readonly NewNode[] = []): LinkedStackState {
  // Os valores são empilhados na ordem recebida: o último vira o topo.
  return values.reduce<LinkedStackState>((state, value) => {
    const result = insertHead(state, value);
    return result.ok ? result.state : state;
  }, emptyList('singly'));
}

/** Pilha encadeada montada da base para o topo, para testes e cenários. */
export function linkedStackFromBase(values: readonly NewNode[]): LinkedStackState {
  // `createList` insere na cauda; invertendo, a cauda da lista vira a base.
  return createList('singly', [...values].reverse());
}

export function size(state: LinkedStackState): number {
  return state.size;
}

export function isEmpty(state: LinkedStackState): boolean {
  return state.size === 0;
}

/** Nó do topo, ou `null` na pilha vazia. */
export function topNode(state: LinkedStackState): ListNode | null {
  return getNode(state, state.head);
}

/**
 * Empilha. Diferente da pilha em vetor, **nunca falha**: sem capacidade fixa
 * não há overflow.
 */
export function push(state: LinkedStackState, novo: NewNode): LinkedStackMutation {
  return insertHead(state, novo);
}

/** Desempilha o topo. Falha com `EMPTY` na pilha vazia (underflow). */
export function pop(state: LinkedStackState): LinkedStackMutation {
  return deleteHead(state);
}

/** Consulta o topo **sem removê-lo**. */
export function peek(state: LinkedStackState): LinkedStackPeek {
  const node = topNode(state);
  if (node === null) return { ok: false, error: 'UNDERFLOW' };
  return { ok: true, node };
}

/** Valores do topo para a base — a ordem em que sairiam da pilha. */
export function toArrayFromTop(state: LinkedStackState): readonly string[] {
  return toArray(state);
}
