import { describe, expect, it } from 'vitest';
import {
  type QueueItem,
  type QueueState,
  createQueue,
  dequeue,
  enqueue,
  toArray,
} from '../data-structures/queue';
import { finalSnapshot } from '../../types/step';
import type { QueueTrace } from '../../types/structures';
import {
  planDequeue,
  planEnqueue,
  planIsEmpty,
  planIsFull,
  planPeek,
} from './queue-steps';

function item(value: string): QueueItem {
  return { id: `no-${value}`, value };
}

function queueOf(values: readonly string[], cap = 8): QueueState {
  return values.reduce<QueueState>((state, value) => {
    const result = enqueue(state, item(value));
    if (!result.ok) throw new Error('falha ao montar fila de teste');
    return result.state;
  }, createQueue(cap));
}

function dequeueTimes(state: QueueState, times: number): QueueState {
  let current = state;
  for (let i = 0; i < times; i += 1) {
    const result = dequeue(current);
    if (!result.ok) throw new Error('dequeue inesperadamente falhou');
    current = result.state;
  }
  return current;
}

function finalState(trace: QueueTrace): QueueState {
  return finalSnapshot(trace).state;
}

describe('planEnqueue', () => {
  it('decompõe a operação em quatro passos', () => {
    const trace = planEnqueue(queueOf(['a'], 4), item('b'));
    expect(trace.steps.map((s) => s.title)).toEqual([
      'Cria o novo elemento',
      'Verifica se há espaço disponível',
      'Grava o elemento na posição do fim',
      'Avança o ponteiro de fim',
    ]);
    expect(trace.outcome).toBe('success');
    expect(trace.complexity.notation).toBe('O(1)');
  });

  it('deixa o elemento no fim da fila ao final da trilha', () => {
    const trace = planEnqueue(queueOf(['a'], 4), item('b'));
    expect(toArray(finalState(trace))).toEqual(['a', 'b']);
  });

  it('explica a volta ao índice 0 quando o fim dá a volta', () => {
    // Capacidade 3, cheia, uma remoção: o fim já está no índice 0.
    const comEspaco = dequeueTimes(queueOf(['a', 'b', 'c'], 3), 1);
    const trace = planEnqueue(comEspaco, item('d'));

    const passoDoFim = trace.steps.at(-1);
    expect(passoDoFim?.title).toBe('Avança o ponteiro de fim');
    expect(toArray(finalState(trace))).toEqual(['b', 'c', 'd']);
  });

  it('explica a volta ao índice 0 quando o fim está na última posição', () => {
    // Capacidade 3 com dois elementos: o fim está no índice 2 (última posição).
    // Este enqueue grava em 2 e leva o fim de 2 para 0.
    const antes = queueOf(['a', 'b'], 3);
    expect(antes.rear).toBe(2);

    const trace = planEnqueue(antes, item('c'));
    expect(finalState(trace).rear).toBe(0);
    expect(trace.steps.at(-1)?.description).toContain('de volta ao índice 0');
  });

  it('descreve o avanço normal do fim com aritmética modular', () => {
    const trace = planEnqueue(queueOf(['a'], 4), item('b'));
    expect(trace.steps.at(-1)?.description).toContain('mod 4');
  });

  // --- Caso de borda ---

  it('produz trilha de erro quando a fila está cheia', () => {
    const trace = planEnqueue(queueOf(['a', 'b'], 2), item('c'));
    expect(trace.outcome).toBe('error');
    expect(trace.steps.at(-1)?.title).toBe('Overflow: a fila está cheia');
    expect(toArray(finalState(trace))).toEqual(['a', 'b']);
  });
});

describe('planDequeue', () => {
  it('remove o primeiro elemento respeitando FIFO', () => {
    const trace = planDequeue(queueOf(['a', 'b', 'c'], 5));
    expect(trace.steps).toHaveLength(4);
    expect(trace.outcome).toBe('success');
    expect(toArray(finalState(trace))).toEqual(['b', 'c']);
    expect(trace.summary).toContain('a');
  });

  it('mostra o elemento saindo da estrutura', () => {
    const trace = planDequeue(queueOf(['a', 'b'], 5));
    const saindo = trace.steps.find((s) => s.snapshot.floating?.phase === 'leaving');
    expect(saindo?.snapshot.floating?.item.value).toBe('a');
  });

  // --- Casos de borda ---

  it('produz trilha de erro (underflow) quando a fila está vazia', () => {
    const trace = planDequeue(createQueue(4));
    expect(trace.outcome).toBe('error');
    expect(trace.steps).toHaveLength(2);
    expect(trace.steps.at(-1)?.title).toBe('Underflow: a fila está vazia');
  });

  it('avisa que a fila ficou vazia ao remover o único elemento', () => {
    const trace = planDequeue(queueOf(['único'], 4));
    expect(trace.outcome).toBe('success');
    expect(trace.steps.at(-1)?.description).toContain('vazia');
  });
});

describe('planPeek', () => {
  it('consulta o início sem alterar a fila', () => {
    const trace = planPeek(queueOf(['a', 'b'], 5));
    expect(trace.outcome).toBe('success');
    expect(toArray(finalState(trace))).toEqual(['a', 'b']);
    expect(trace.summary).toContain('a');
  });

  // --- Caso de borda ---

  it('produz trilha de erro quando a fila está vazia', () => {
    const trace = planPeek(createQueue(4));
    expect(trace.outcome).toBe('error');
    expect(trace.steps.at(-1)?.tone).toBe('error');
  });
});

describe('planIsEmpty / planIsFull', () => {
  it('explica por que o teste usa o contador, e não os ponteiros', () => {
    const trace = planIsEmpty(createQueue(4));
    expect(trace.steps[0].description).toContain('contador');
    expect(trace.summary).toContain('verdadeiro');
  });

  it('relata corretamente uma fila cheia', () => {
    const trace = planIsFull(queueOf(['a', 'b'], 2));
    expect(trace.steps.at(-1)?.title).toBe('A fila está cheia');
    expect(trace.summary).toContain('verdadeiro');
  });

  it('relata corretamente uma fila com espaço', () => {
    const trace = planIsFull(queueOf(['a'], 3));
    expect(trace.steps.at(-1)?.title).toBe('A fila não está cheia');
    expect(trace.summary).toContain('falso');
  });
});

describe('invariantes do motor de passos', () => {
  const trilhas: readonly QueueTrace[] = [
    planEnqueue(queueOf(['a'], 4), item('b')),
    planEnqueue(queueOf(['a', 'b'], 2), item('c')),
    planDequeue(queueOf(['a'], 4)),
    planDequeue(createQueue(4)),
    planPeek(queueOf(['a'], 4)),
    planPeek(createQueue(4)),
    planIsEmpty(createQueue(4)),
    planIsFull(queueOf(['a'], 1)),
  ];

  it('toda trilha tem ao menos um passo, com título e descrição', () => {
    for (const trace of trilhas) {
      expect(trace.steps.length).toBeGreaterThan(0);
      for (const step of trace.steps) {
        expect(step.title.trim().length).toBeGreaterThan(0);
        expect(step.description.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('toda linha de pseudocódigo referenciada existe', () => {
    for (const trace of trilhas) {
      for (const step of trace.steps) {
        if (step.codeLine === null) continue;
        expect(step.codeLine).toBeLessThan(trace.pseudocode.lines.length);
        expect(step.codeLine).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('trilhas com erro terminam num passo de tom "error"', () => {
    for (const trace of trilhas.filter((t) => t.outcome === 'error')) {
      expect(trace.steps.at(-1)?.tone).toBe('error');
    }
  });

  it('destaques de posição sempre apontam para índices válidos do array', () => {
    for (const trace of trilhas) {
      for (const step of trace.steps) {
        const cap = step.snapshot.state.slots.length;
        for (const highlight of step.highlights) {
          if (highlight.kind !== 'slot') continue;
          expect(highlight.index).toBeGreaterThanOrEqual(0);
          expect(highlight.index).toBeLessThan(cap);
        }
      }
    }
  });
});
