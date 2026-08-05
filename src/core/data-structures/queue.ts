/**
 * Fila (Queue) implementada como **array circular** de capacidade fixa.
 *
 * Módulo **puro**: sem dependência de React, sem estado global, sem mutação.
 *
 * Convenção dos ponteiros — a mesma normalmente adotada em AED:
 * - `front` (**início**) aponta para o primeiro elemento da fila;
 * - `rear` (**fim**) aponta para a **próxima posição livre**, onde o próximo
 *   `enqueue` vai gravar.
 *
 * Ambos avançam com aritmética modular (`(i + 1) % capacidade`), dando a volta
 * no array. É isso que evita o deslocamento de todos os elementos a cada
 * remoção e mantém `dequeue` em O(1). Como `front` e `rear` coincidem tanto na
 * fila vazia quanto na cheia, o contador `count` é o que distingue os dois
 * casos.
 */

export interface QueueItem {
  readonly id: string;
  readonly value: string;
}

export interface QueueState {
  /** Array circular; `null` marca posição livre. O tamanho é a capacidade. */
  readonly slots: readonly (QueueItem | null)[];
  /** Índice do primeiro elemento (início). */
  readonly front: number;
  /** Índice da próxima posição livre (fim). */
  readonly rear: number;
  /** Quantidade de elementos — desempata fila vazia de fila cheia. */
  readonly count: number;
}

export const QUEUE_MIN_CAPACITY = 1;
export const QUEUE_MAX_CAPACITY = 20;
export const QUEUE_DEFAULT_CAPACITY = 8;

export type QueueError = 'OVERFLOW' | 'UNDERFLOW';

export type QueueMutation =
  | {
      readonly ok: true;
      readonly state: QueueState;
      readonly item: QueueItem;
      /** Posição do array efetivamente escrita (enqueue) ou liberada (dequeue). */
      readonly index: number;
    }
  | { readonly ok: false; readonly error: QueueError };

export type QueuePeek =
  | { readonly ok: true; readonly item: QueueItem; readonly index: number }
  | { readonly ok: false; readonly error: 'UNDERFLOW' };

export function clampCapacity(capacity: number): number {
  if (!Number.isFinite(capacity)) return QUEUE_DEFAULT_CAPACITY;
  const rounded = Math.trunc(capacity);
  return Math.min(QUEUE_MAX_CAPACITY, Math.max(QUEUE_MIN_CAPACITY, rounded));
}

/** Cria uma fila vazia com a capacidade indicada. */
export function createQueue(capacity: number = QUEUE_DEFAULT_CAPACITY): QueueState {
  const safeCapacity = clampCapacity(capacity);
  return {
    slots: Array.from({ length: safeCapacity }, () => null),
    front: 0,
    rear: 0,
    count: 0,
  };
}

export function capacity(state: QueueState): number {
  return state.slots.length;
}

export function size(state: QueueState): number {
  return state.count;
}

export function isEmpty(state: QueueState): boolean {
  return state.count === 0;
}

export function isFull(state: QueueState): boolean {
  return state.count >= state.slots.length;
}

/** Índice do último elemento ocupado, ou `-1` na fila vazia. */
export function lastIndex(state: QueueState): number {
  if (isEmpty(state)) return -1;
  return (state.rear - 1 + state.slots.length) % state.slots.length;
}

/** Próximo índice no array circular. */
export function nextIndex(state: QueueState, index: number): number {
  return (index + 1) % state.slots.length;
}

/**
 * Insere no fim da fila. Falha com `OVERFLOW` quando não há posição livre.
 */
export function enqueue(state: QueueState, item: QueueItem): QueueMutation {
  if (isFull(state)) {
    return { ok: false, error: 'OVERFLOW' };
  }
  const index = state.rear;
  const slots = [...state.slots];
  slots[index] = item;
  return {
    ok: true,
    item,
    index,
    state: {
      slots,
      front: state.front,
      rear: nextIndex(state, index),
      count: state.count + 1,
    },
  };
}

/**
 * Remove do início da fila (FIFO). Falha com `UNDERFLOW` na fila vazia.
 */
export function dequeue(state: QueueState): QueueMutation {
  const index = state.front;
  const item = state.slots[index];
  if (isEmpty(state) || item === undefined || item === null) {
    return { ok: false, error: 'UNDERFLOW' };
  }
  const slots = [...state.slots];
  slots[index] = null;
  return {
    ok: true,
    item,
    index,
    state: {
      slots,
      front: nextIndex(state, index),
      rear: state.rear,
      count: state.count - 1,
    },
  };
}

/** Consulta o elemento do início **sem removê-lo**. */
export function peek(state: QueueState): QueuePeek {
  const index = state.front;
  const item = state.slots[index];
  if (isEmpty(state) || item === undefined || item === null) {
    return { ok: false, error: 'UNDERFLOW' };
  }
  return { ok: true, item, index };
}

/**
 * Elementos na ordem lógica da fila, do início ao fim — que não coincide com a
 * ordem física do array quando a fila deu a volta.
 */
export function toArray(state: QueueState): readonly string[] {
  const values: string[] = [];
  for (let offset = 0; offset < state.count; offset += 1) {
    const item = state.slots[(state.front + offset) % state.slots.length];
    if (item !== undefined && item !== null) values.push(item.value);
  }
  return values;
}

/** Posição lógica (0 = início) de um índice físico ocupado, ou `-1`. */
export function logicalPosition(state: QueueState, index: number): number {
  if (isEmpty(state)) return -1;
  const offset = (index - state.front + state.slots.length) % state.slots.length;
  return offset < state.count ? offset : -1;
}
