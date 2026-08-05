/**
 * Pilha (Stack) baseada em array, com capacidade limitada.
 *
 * Módulo **puro**: sem dependência de React, sem estado global, sem mutação.
 * Toda operação recebe um estado e devolve um estado novo, o que permite testar
 * a estrutura isoladamente e guardar snapshots por passo de animação.
 *
 * Convenção de orientação: `items[0]` é a **base** e `items[length - 1]` é o
 * **topo**. A pilha é LIFO — o último a entrar é o primeiro a sair.
 */

export interface StackItem {
  readonly id: string;
  readonly value: string;
}

export interface StackState {
  /** Do fundo para o topo: `items[0]` = base, `items[size - 1]` = topo. */
  readonly items: readonly StackItem[];
  readonly capacity: number;
}

export const STACK_MIN_CAPACITY = 1;
export const STACK_MAX_CAPACITY = 20;
export const STACK_DEFAULT_CAPACITY = 10;

/** `OVERFLOW`: pilha cheia. `UNDERFLOW`: pilha vazia. */
export type StackError = 'OVERFLOW' | 'UNDERFLOW';

export type StackMutation =
  | { readonly ok: true; readonly state: StackState; readonly item: StackItem }
  | { readonly ok: false; readonly error: StackError };

export type StackPeek =
  | { readonly ok: true; readonly item: StackItem; readonly index: number }
  | { readonly ok: false; readonly error: 'UNDERFLOW' };

/**
 * Cria uma pilha. A capacidade é ajustada ao intervalo suportado e os itens
 * excedentes são descartados, de modo que o estado devolvido é sempre válido.
 */
export function createStack(
  capacity: number = STACK_DEFAULT_CAPACITY,
  items: readonly StackItem[] = [],
): StackState {
  const safeCapacity = clampCapacity(capacity);
  return {
    capacity: safeCapacity,
    items: items.slice(0, safeCapacity),
  };
}

export function clampCapacity(capacity: number): number {
  if (!Number.isFinite(capacity)) return STACK_DEFAULT_CAPACITY;
  const rounded = Math.trunc(capacity);
  return Math.min(STACK_MAX_CAPACITY, Math.max(STACK_MIN_CAPACITY, rounded));
}

export function size(state: StackState): number {
  return state.items.length;
}

export function isEmpty(state: StackState): boolean {
  return state.items.length === 0;
}

export function isFull(state: StackState): boolean {
  return state.items.length >= state.capacity;
}

/** Índice do topo, ou `-1` quando a pilha está vazia. */
export function topIndex(state: StackState): number {
  return state.items.length - 1;
}

/** Espaços ainda livres no array. */
export function freeSlots(state: StackState): number {
  return state.capacity - state.items.length;
}

/**
 * Insere no topo. Falha com `OVERFLOW` quando a pilha está cheia — a capacidade
 * fixa do array é justamente o que torna o transbordamento visível ao aluno.
 */
export function push(state: StackState, item: StackItem): StackMutation {
  if (isFull(state)) {
    return { ok: false, error: 'OVERFLOW' };
  }
  return {
    ok: true,
    item,
    state: { ...state, items: [...state.items, item] },
  };
}

/** Remove e devolve o elemento do topo. Falha com `UNDERFLOW` se estiver vazia. */
export function pop(state: StackState): StackMutation {
  const top = state.items[state.items.length - 1];
  if (top === undefined) {
    return { ok: false, error: 'UNDERFLOW' };
  }
  return {
    ok: true,
    item: top,
    state: { ...state, items: state.items.slice(0, -1) },
  };
}

/** Consulta o elemento do topo **sem removê-lo**. */
export function peek(state: StackState): StackPeek {
  const index = topIndex(state);
  const top = state.items[index];
  if (top === undefined) {
    return { ok: false, error: 'UNDERFLOW' };
  }
  return { ok: true, item: top, index };
}

/** Esvazia a pilha preservando a capacidade. */
export function clear(state: StackState): StackState {
  return { ...state, items: [] };
}

/** Valores do fundo para o topo — atalho para asserções e renderização. */
export function toArray(state: StackState): readonly string[] {
  return state.items.map((item) => item.value);
}
