import { describe, expect, it } from 'vitest';
import {
  QUEUE_DEFAULT_CAPACITY,
  QUEUE_MAX_CAPACITY,
  QUEUE_MIN_CAPACITY,
  type QueueItem,
  type QueueState,
  capacity,
  createQueue,
  dequeue,
  enqueue,
  isEmpty,
  isFull,
  lastIndex,
  logicalPosition,
  peek,
  size,
  toArray,
} from './queue';

function item(value: string): QueueItem {
  return { id: `no-${value}`, value };
}

/** Enfileira uma sequência de valores, do primeiro ao último. */
function queueOf(values: readonly string[], cap = QUEUE_DEFAULT_CAPACITY): QueueState {
  return values.reduce<QueueState>((state, value) => {
    const result = enqueue(state, item(value));
    if (!result.ok) throw new Error(`falha ao montar fila de teste: ${result.error}`);
    return result.state;
  }, createQueue(cap));
}

/** Aplica N remoções, falhando o teste se alguma delas não for possível. */
function dequeueTimes(state: QueueState, times: number): QueueState {
  let current = state;
  for (let i = 0; i < times; i += 1) {
    const result = dequeue(current);
    if (!result.ok) throw new Error('dequeue inesperadamente falhou');
    current = result.state;
  }
  return current;
}

describe('createQueue', () => {
  it('cria uma fila vazia com início e fim na posição 0', () => {
    const state = createQueue(5);
    expect(capacity(state)).toBe(5);
    expect(state.front).toBe(0);
    expect(state.rear).toBe(0);
    expect(isEmpty(state)).toBe(true);
    expect(isFull(state)).toBe(false);
  });

  it('limita a capacidade ao intervalo suportado', () => {
    expect(capacity(createQueue(0))).toBe(QUEUE_MIN_CAPACITY);
    expect(capacity(createQueue(999))).toBe(QUEUE_MAX_CAPACITY);
    expect(capacity(createQueue(Number.NaN))).toBe(QUEUE_DEFAULT_CAPACITY);
  });
});

describe('enqueue', () => {
  it('insere no fim e avança o ponteiro de fim', () => {
    const state = queueOf(['a', 'b'], 4);
    expect(toArray(state)).toEqual(['a', 'b']);
    expect(state.front).toBe(0);
    expect(state.rear).toBe(2);
    expect(size(state)).toBe(2);
  });

  it('informa a posição do array em que gravou', () => {
    const result = enqueue(queueOf(['a'], 4), item('b'));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.index).toBe(1);
  });

  it('não modifica o estado original (imutabilidade)', () => {
    const original = queueOf(['a'], 4);
    enqueue(original, item('b'));
    expect(toArray(original)).toEqual(['a']);
    expect(original.rear).toBe(1);
  });

  // --- Caso de borda ---

  it('falha com OVERFLOW quando a fila está cheia', () => {
    const cheia = queueOf(['a', 'b', 'c'], 3);
    expect(isFull(cheia)).toBe(true);
    expect(enqueue(cheia, item('d'))).toEqual({ ok: false, error: 'OVERFLOW' });
  });
});

describe('dequeue', () => {
  it('remove do início respeitando a ordem FIFO', () => {
    const result = dequeue(queueOf(['a', 'b', 'c'], 5));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.item.value).toBe('a');
    expect(toArray(result.state)).toEqual(['b', 'c']);
    expect(result.state.front).toBe(1);
  });

  it('libera a posição do array ao remover', () => {
    const result = dequeue(queueOf(['a', 'b'], 4));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.slots[0]).toBeNull();
  });

  it('não modifica o estado original (imutabilidade)', () => {
    const original = queueOf(['a', 'b'], 4);
    dequeue(original);
    expect(toArray(original)).toEqual(['a', 'b']);
    expect(original.front).toBe(0);
  });

  // --- Casos de borda ---

  it('falha com UNDERFLOW quando a fila está vazia', () => {
    expect(dequeue(createQueue(4))).toEqual({ ok: false, error: 'UNDERFLOW' });
  });

  it('remove o único elemento e deixa a fila vazia', () => {
    const result = dequeue(queueOf(['único'], 4));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(isEmpty(result.state)).toBe(true);
    expect(lastIndex(result.state)).toBe(-1);
    expect(dequeue(result.state).ok).toBe(false);
  });

  it('numa fila esvaziada, início e fim voltam a coincidir', () => {
    const vazia = dequeueTimes(queueOf(['a', 'b', 'c'], 5), 3);
    expect(isEmpty(vazia)).toBe(true);
    expect(vazia.front).toBe(vazia.rear);
    expect(vazia.front).toBe(3);
  });
});

describe('array circular', () => {
  it('dá a volta no array ao reaproveitar posições liberadas', () => {
    // Capacidade 3: enfileira a, b, c → cheia; remove a → libera a posição 0.
    const aposRemocao = dequeueTimes(queueOf(['a', 'b', 'c'], 3), 1);
    expect(aposRemocao.rear).toBe(0); // o fim já deu a volta

    const result = enqueue(aposRemocao, item('d'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // 'd' foi gravado na posição 0, fisicamente antes de 'b' e 'c'...
    expect(result.index).toBe(0);
    expect(result.state.slots[0]?.value).toBe('d');
    // ...mas na ordem lógica da fila continua sendo o último.
    expect(toArray(result.state)).toEqual(['b', 'c', 'd']);
    expect(isFull(result.state)).toBe(true);
  });

  it('mantém a ordem FIFO após várias voltas', () => {
    let state = queueOf(['a', 'b', 'c'], 3);
    const saida: string[] = [];

    for (const valor of ['d', 'e', 'f', 'g']) {
      const remocao = dequeue(state);
      expect(remocao.ok).toBe(true);
      if (!remocao.ok) return;
      saida.push(remocao.item.value);

      const insercao = enqueue(remocao.state, item(valor));
      expect(insercao.ok).toBe(true);
      if (!insercao.ok) return;
      state = insercao.state;
    }

    expect(saida).toEqual(['a', 'b', 'c', 'd']);
    expect(toArray(state)).toEqual(['e', 'f', 'g']);
  });

  it('distingue fila vazia de fila cheia mesmo com início = fim', () => {
    const cheia = queueOf(['a', 'b', 'c'], 3);
    expect(cheia.front).toBe(cheia.rear); // ambos valem 0
    expect(isFull(cheia)).toBe(true);
    expect(isEmpty(cheia)).toBe(false);

    const vazia = dequeueTimes(cheia, 3);
    expect(vazia.front).toBe(vazia.rear); // ambos valem 0 de novo
    expect(isEmpty(vazia)).toBe(true);
    expect(isFull(vazia)).toBe(false);
  });

  it('lastIndex acompanha a volta do array', () => {
    const aposVolta = enqueue(dequeueTimes(queueOf(['a', 'b', 'c'], 3), 1), item('d'));
    expect(aposVolta.ok).toBe(true);
    if (!aposVolta.ok) return;
    expect(lastIndex(aposVolta.state)).toBe(0);
  });
});

describe('peek', () => {
  it('devolve o elemento do início sem removê-lo', () => {
    const state = queueOf(['a', 'b'], 4);
    const result = peek(state);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.item.value).toBe('a');
    expect(result.index).toBe(0);
    expect(size(state)).toBe(2);
  });

  // --- Caso de borda ---

  it('falha com UNDERFLOW quando a fila está vazia', () => {
    expect(peek(createQueue(4))).toEqual({ ok: false, error: 'UNDERFLOW' });
  });
});

describe('logicalPosition', () => {
  it('traduz índice físico em posição na fila', () => {
    const aposVolta = enqueue(dequeueTimes(queueOf(['a', 'b', 'c'], 3), 1), item('d'));
    expect(aposVolta.ok).toBe(true);
    if (!aposVolta.ok) return;

    // Fila lógica: b (posição 0), c (1), d (2) — d está no índice físico 0.
    expect(logicalPosition(aposVolta.state, 1)).toBe(0);
    expect(logicalPosition(aposVolta.state, 2)).toBe(1);
    expect(logicalPosition(aposVolta.state, 0)).toBe(2);
  });

  it('devolve -1 para posições livres ou fila vazia', () => {
    expect(logicalPosition(createQueue(3), 0)).toBe(-1);
    expect(logicalPosition(queueOf(['a'], 3), 2)).toBe(-1);
  });
});
