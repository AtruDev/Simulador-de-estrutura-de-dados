import { describe, expect, it } from 'vitest';
import {
  STACK_DEFAULT_CAPACITY,
  STACK_MAX_CAPACITY,
  STACK_MIN_CAPACITY,
  type StackItem,
  type StackState,
  clear,
  createStack,
  freeSlots,
  isEmpty,
  isFull,
  peek,
  pop,
  push,
  size,
  toArray,
  topIndex,
} from './stack';

/** Itens com id determinístico, para que as asserções não dependam de sorteio. */
function item(value: string): StackItem {
  return { id: `no-${value}`, value };
}

/** Empilha uma sequência de valores, do primeiro ao último. */
function stackOf(values: readonly string[], capacity = STACK_DEFAULT_CAPACITY): StackState {
  return values.reduce<StackState>((state, value) => {
    const result = push(state, item(value));
    if (!result.ok) throw new Error(`falha ao montar pilha de teste: ${result.error}`);
    return result.state;
  }, createStack(capacity));
}

describe('createStack', () => {
  it('cria uma pilha vazia com a capacidade padrão', () => {
    const state = createStack();
    expect(state.capacity).toBe(STACK_DEFAULT_CAPACITY);
    expect(isEmpty(state)).toBe(true);
    expect(size(state)).toBe(0);
  });

  it('limita a capacidade ao intervalo suportado', () => {
    expect(createStack(0).capacity).toBe(STACK_MIN_CAPACITY);
    expect(createStack(-5).capacity).toBe(STACK_MIN_CAPACITY);
    expect(createStack(999).capacity).toBe(STACK_MAX_CAPACITY);
    expect(createStack(Number.NaN).capacity).toBe(STACK_DEFAULT_CAPACITY);
    expect(createStack(4.7).capacity).toBe(4);
  });

  it('descarta itens iniciais que excedem a capacidade', () => {
    const state = createStack(2, [item('a'), item('b'), item('c')]);
    expect(toArray(state)).toEqual(['a', 'b']);
  });
});

describe('push', () => {
  it('insere no topo mantendo a ordem base → topo', () => {
    const state = stackOf(['a', 'b', 'c']);
    expect(toArray(state)).toEqual(['a', 'b', 'c']);
    expect(topIndex(state)).toBe(2);
  });

  it('devolve o item inserido', () => {
    const result = push(createStack(), item('42'));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.item.value).toBe('42');
  });

  it('não modifica o estado original (imutabilidade)', () => {
    const original = stackOf(['a']);
    const result = push(original, item('b'));
    expect(result.ok).toBe(true);
    expect(toArray(original)).toEqual(['a']);
  });

  // --- Casos de borda ---

  it('falha com OVERFLOW quando a pilha está cheia', () => {
    const cheia = stackOf(['a', 'b'], 2);
    expect(isFull(cheia)).toBe(true);
    const result = push(cheia, item('c'));
    expect(result).toEqual({ ok: false, error: 'OVERFLOW' });
  });

  it('permite empilhar exatamente até a capacidade', () => {
    const cheia = stackOf(['a', 'b', 'c'], 3);
    expect(size(cheia)).toBe(3);
    expect(freeSlots(cheia)).toBe(0);
    expect(isFull(cheia)).toBe(true);
  });

  it('preenche uma pilha de capacidade 1 com um único push', () => {
    const state = stackOf(['único'], 1);
    expect(isFull(state)).toBe(true);
    expect(push(state, item('outro')).ok).toBe(false);
  });
});

describe('pop', () => {
  it('remove do topo respeitando a ordem LIFO', () => {
    let state = stackOf(['a', 'b', 'c']);
    const primeiro = pop(state);
    expect(primeiro.ok).toBe(true);
    if (!primeiro.ok) return;
    expect(primeiro.item.value).toBe('c');

    state = primeiro.state;
    const segundo = pop(state);
    expect(segundo.ok).toBe(true);
    if (!segundo.ok) return;
    expect(segundo.item.value).toBe('b');
    expect(toArray(segundo.state)).toEqual(['a']);
  });

  it('não modifica o estado original (imutabilidade)', () => {
    const original = stackOf(['a', 'b']);
    pop(original);
    expect(toArray(original)).toEqual(['a', 'b']);
  });

  // --- Casos de borda ---

  it('falha com UNDERFLOW quando a pilha está vazia', () => {
    expect(pop(createStack())).toEqual({ ok: false, error: 'UNDERFLOW' });
  });

  it('remove o único elemento e deixa a pilha vazia', () => {
    const state = stackOf(['único']);
    const result = pop(state);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.item.value).toBe('único');
    expect(isEmpty(result.state)).toBe(true);
    expect(topIndex(result.state)).toBe(-1);
  });

  it('libera espaço numa pilha que estava cheia', () => {
    const cheia = stackOf(['a', 'b'], 2);
    const result = pop(cheia);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(isFull(result.state)).toBe(false);
    expect(push(result.state, item('c')).ok).toBe(true);
  });

  it('esvazia completamente uma pilha após N pops', () => {
    let state = stackOf(['a', 'b', 'c']);
    for (let i = 0; i < 3; i += 1) {
      const result = pop(state);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.state;
    }
    expect(isEmpty(state)).toBe(true);
    expect(pop(state).ok).toBe(false);
  });
});

describe('peek', () => {
  it('devolve o elemento do topo sem removê-lo', () => {
    const state = stackOf(['a', 'b']);
    const result = peek(state);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.item.value).toBe('b');
    expect(result.index).toBe(1);
    expect(size(state)).toBe(2);
  });

  // --- Caso de borda ---

  it('falha com UNDERFLOW quando a pilha está vazia', () => {
    expect(peek(createStack())).toEqual({ ok: false, error: 'UNDERFLOW' });
  });
});

describe('consultas auxiliares', () => {
  it('isEmpty e isFull são complementares apenas nos extremos', () => {
    const vazia = createStack(3);
    const parcial = stackOf(['a'], 3);
    const cheia = stackOf(['a', 'b', 'c'], 3);

    expect([isEmpty(vazia), isFull(vazia)]).toEqual([true, false]);
    expect([isEmpty(parcial), isFull(parcial)]).toEqual([false, false]);
    expect([isEmpty(cheia), isFull(cheia)]).toEqual([false, true]);
  });

  it('freeSlots reflete o espaço restante', () => {
    expect(freeSlots(createStack(5))).toBe(5);
    expect(freeSlots(stackOf(['a', 'b'], 5))).toBe(3);
  });

  it('clear esvazia preservando a capacidade', () => {
    const limpa = clear(stackOf(['a', 'b'], 7));
    expect(isEmpty(limpa)).toBe(true);
    expect(limpa.capacity).toBe(7);
  });
});
