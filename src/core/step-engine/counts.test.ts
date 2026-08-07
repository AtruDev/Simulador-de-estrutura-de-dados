/**
 * Contadores de custo — a contrapartida empírica do Big-O anunciado.
 *
 * Estes testes verificam menos a aritmética e mais a **afirmação didática**:
 * que os números medidos contam a mesma história que a notação assintótica.
 * Se um dia `deleteTail()` na lista simplesmente ligada parar de somar n−1
 * visitas, o simulador estará ensinando algo errado, e é isso que falha aqui.
 */

import { describe, expect, it } from 'vitest';
import { createList, emptyList } from '../data-structures/linked-list';
import { createQueue, enqueue } from '../data-structures/queue';
import { createStack, push } from '../data-structures/stack';
import type { OperationTrace } from '../../types/step';
import {
  planDeleteHead,
  planDeleteTail,
  planInsertAt,
  planInsertHead,
  planInsertTail,
  planSearch,
} from './linked-list-steps';
import { planDequeue, planEnqueue, planIsEmpty, planPeek as planQueuePeek } from './queue-steps';
import { planPeek as planStackPeek, planPop, planPush } from './stack-steps';

function listaDe(variant: 'singly' | 'doubly', valores: readonly string[]) {
  return createList(
    variant,
    valores.map((value) => ({ id: `no-${value}`, value })),
  );
}

function pilhaDe(valores: readonly string[], capacidade = 10) {
  return valores.reduce((estado, value) => {
    const r = push(estado, { id: `item-${value}`, value });
    return r.ok ? r.state : estado;
  }, createStack(capacidade));
}

function filaDe(valores: readonly string[], capacidade = 8) {
  return valores.reduce((estado, value) => {
    const r = enqueue(estado, { id: `item-${value}`, value });
    return r.ok ? r.state : estado;
  }, createQueue(capacidade));
}

describe('acumulação dos contadores', () => {
  const trace = planSearch(listaDe('singly', ['a', 'b', 'c']), 'c');

  it('nunca decresce ao longo dos passos', () => {
    for (let i = 1; i < trace.steps.length; i += 1) {
      const anterior = trace.steps[i - 1]!.counts;
      const atual = trace.steps[i]!.counts;
      expect(atual.comparisons).toBeGreaterThanOrEqual(anterior.comparisons);
      expect(atual.moves).toBeGreaterThanOrEqual(anterior.moves);
      expect(atual.visits).toBeGreaterThanOrEqual(anterior.visits);
    }
  });

  it('o total da trilha é o acumulado do último passo', () => {
    expect(trace.totals).toEqual(trace.steps.at(-1)?.counts);
  });

  it('começa do zero', () => {
    const primeiro = planPush(createStack(4), { id: 'i', value: '1' }).steps[0];
    expect(primeiro.counts).toEqual({ comparisons: 0, moves: 0, visits: 0 });
  });
});

describe('operações O(1) não percorrem a estrutura', () => {
  const casos: readonly (readonly [string, OperationTrace<unknown, unknown>])[] = [
    ['push', planPush(pilhaDe(['1']), { id: 'x', value: '9' })],
    ['pop', planPop(pilhaDe(['1', '2']))],
    ['peek (pilha)', planStackPeek(pilhaDe(['1', '2']))],
    ['enqueue', planEnqueue(filaDe(['1']), { id: 'x', value: '9' })],
    ['dequeue', planDequeue(filaDe(['1', '2']))],
    ['peek (fila)', planQueuePeek(filaDe(['1', '2']))],
    ['insertHead', planInsertHead(listaDe('singly', ['a', 'b', 'c']), { id: 'x', value: 'z' })],
    ['insertTail', planInsertTail(listaDe('singly', ['a', 'b', 'c']), { id: 'x', value: 'z' })],
    ['deleteHead', planDeleteHead(listaDe('singly', ['a', 'b', 'c']))],
  ];

  it.each(casos)('%s visita no máximo um elemento', (_nome, trace) => {
    expect(trace.totals.visits).toBeLessThanOrEqual(1);
  });

  it.each(casos)('%s não compara valores', (_nome, trace) => {
    expect(trace.totals.comparisons).toBe(0);
  });
});

describe('testes de borda não contam como trabalho', () => {
  it('isEmpty() não soma nada — verificar um contador não é percorrer', () => {
    expect(planIsEmpty(filaDe(['1', '2'])).totals).toEqual({
      comparisons: 0,
      moves: 0,
      visits: 0,
    });
  });

  it('overflow e underflow não somam trabalho de escrita', () => {
    const cheia = pilhaDe(['1', '2'], 2);
    expect(planPush(cheia, { id: 'x', value: '3' }).totals.moves).toBe(0);
    expect(planPop(createStack(4)).totals.moves).toBe(0);
  });
});

describe('search: as comparações são o n de O(n)', () => {
  it('percorrer até o último nó custa uma comparação por nó', () => {
    const trace = planSearch(listaDe('singly', ['a', 'b', 'c', 'd']), 'd');
    expect(trace.totals.comparisons).toBe(4);
    expect(trace.totals.visits).toBe(4);
  });

  it('parar no primeiro nó custa uma única comparação', () => {
    expect(planSearch(listaDe('singly', ['a', 'b', 'c', 'd']), 'a').totals.comparisons).toBe(1);
  });

  it('valor ausente custa o pior caso: a lista inteira', () => {
    const trace = planSearch(listaDe('singly', ['a', 'b', 'c', 'd']), 'z');
    expect(trace.totals.comparisons).toBe(4);
    expect(trace.outcome).toBe('error');
  });

  it('não compara nada numa lista vazia', () => {
    expect(planSearch(emptyList('singly'), 'a').totals.comparisons).toBe(0);
  });
});

describe('deleteTail: o contador mostra por que a lista dupla é O(1)', () => {
  const valores = ['a', 'b', 'c', 'd', 'e'];

  it('na lista simplesmente ligada, percorre n−1 nós para achar o antecessor', () => {
    expect(planDeleteTail(listaDe('singly', valores)).totals.visits).toBe(valores.length);
  });

  it('na lista duplamente ligada, chega ao antecessor em duas visitas', () => {
    expect(planDeleteTail(listaDe('doubly', valores)).totals.visits).toBe(2);
  });

  it('a diferença cresce com o tamanho da lista — a dupla não muda', () => {
    const grande = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    expect(planDeleteTail(listaDe('singly', grande)).totals.visits).toBe(grande.length);
    expect(planDeleteTail(listaDe('doubly', grande)).totals.visits).toBe(2);
  });
});

describe('insertAt: o custo do percurso cresce com o índice', () => {
  const lista = listaDe('singly', ['a', 'b', 'c', 'd', 'e']);

  it.each([
    [1, 1],
    [3, 3],
    [5, 5],
  ])('inserir na posição %i visita %i nós', (indice, visitas) => {
    expect(planInsertAt(lista, indice, { id: 'x', value: 'z' }).totals.visits).toBe(visitas);
  });

  it('inserir na cabeça não percorre nada', () => {
    expect(planInsertAt(lista, 0, { id: 'x', value: 'z' }).totals.visits).toBe(0);
  });
});

describe('a lista dupla paga mais ponteiros pelo mesmo Big-O', () => {
  it('insertHead religa mais ponteiros na variante dupla', () => {
    const simples = planInsertHead(listaDe('singly', ['a', 'b']), { id: 'x', value: 'z' });
    const dupla = planInsertHead(listaDe('doubly', ['a', 'b']), { id: 'x', value: 'z' });

    expect(dupla.totals.moves).toBeGreaterThan(simples.totals.moves);
    // O custo extra é constante: não depende do tamanho da lista, por isso as
    // duas variantes continuam sendo O(1).
    expect(dupla.complexity.notation).toBe(simples.complexity.notation);
  });
});
