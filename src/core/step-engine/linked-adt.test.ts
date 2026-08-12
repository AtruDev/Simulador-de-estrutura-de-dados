/**
 * Pilha e fila **encadeadas**, comparadas com as versões em vetor.
 *
 * O que estes testes protegem é a afirmação central da unidade de TAD: as duas
 * implementações cumprem o mesmo contrato, com as mesmas complexidades, e
 * diferem apenas no custo concreto e nos estados que conseguem ter. Se um dia a
 * versão encadeada passar a ter overflow, ou a fila encadeada precisar percorrer
 * a lista para enfileirar, a aula estará errada — e é isso que falha aqui.
 */

import { describe, expect, it } from 'vitest';
import { toArray } from '../data-structures/linked-list';
import {
  createLinkedQueue,
  dequeue,
  enqueue,
  isEmpty as filaVazia,
  toArrayFromFront,
} from '../data-structures/linked-queue';
import {
  createLinkedStack,
  linkedStackFromBase,
  peek as peekPilha,
  pop,
  push,
  toArrayFromTop,
} from '../data-structures/linked-stack';
import { createQueue, enqueue as enqueueVetor } from '../data-structures/queue';
import { createStack, push as pushVetor } from '../data-structures/stack';
import { planEnqueue as planEnqueueVetor } from './queue-steps';
import { planPush as planPushVetor } from './stack-steps';
import {
  planDequeue as planDequeueEnc,
  planEnqueue as planEnqueueEnc,
  planIsEmpty as planFilaVaziaEnc,
} from './linked-queue-steps';
import {
  planIsEmpty as planPilhaVaziaEnc,
  planPeek as planPeekEnc,
  planPop as planPopEnc,
  planPush as planPushEnc,
} from './linked-stack-steps';

const no = (value: string) => ({ id: `no-${value}`, value });

function pilhaEncadeada(valoresDaBase: readonly string[]) {
  return linkedStackFromBase(valoresDaBase.map(no));
}

function filaEncadeada(valores: readonly string[]) {
  return createLinkedQueue(valores.map(no));
}

function pilhaVetor(valores: readonly string[], capacidade = 10) {
  return valores.reduce(
    (estado, value) => {
      const r = pushVetor(estado, { id: `i-${value}`, value });
      return r.ok ? r.state : estado;
    },
    createStack(capacidade),
  );
}

function filaVetor(valores: readonly string[], capacidade = 8) {
  return valores.reduce(
    (estado, value) => {
      const r = enqueueVetor(estado, { id: `i-${value}`, value });
      return r.ok ? r.state : estado;
    },
    createQueue(capacidade),
  );
}

describe('pilha encadeada: o contrato LIFO', () => {
  it('empilha na frente: o último a entrar é o primeiro da lista', () => {
    const pilha = createLinkedStack([no('a'), no('b'), no('c')]);
    expect(toArrayFromTop(pilha)).toEqual(['c', 'b', 'a']);
  });

  it('desempilha na ordem inversa da inserção', () => {
    let pilha = createLinkedStack([no('a'), no('b'), no('c')]);
    const saida: string[] = [];

    for (let i = 0; i < 3; i += 1) {
      const r = pop(pilha);
      if (!r.ok) throw new Error('pop não deveria falhar');
      saida.push(r.node.value);
      pilha = r.state;
    }

    expect(saida).toEqual(['c', 'b', 'a']);
    expect(filaVazia(pilha)).toBe(true);
  });

  it('peek não remove nada', () => {
    const pilha = pilhaEncadeada(['a', 'b']);
    const antes = toArrayFromTop(pilha);
    expect(peekPilha(pilha)).toMatchObject({ ok: true });
    expect(toArrayFromTop(pilha)).toEqual(antes);
  });

  it('pop numa pilha vazia falha em vez de lançar', () => {
    expect(pop(createLinkedStack())).toEqual({ ok: false, error: 'EMPTY' });
  });
});

describe('fila encadeada: o contrato FIFO', () => {
  it('sai na mesma ordem em que entrou', () => {
    let fila = filaEncadeada(['a', 'b', 'c']);
    const saida: string[] = [];

    for (let i = 0; i < 3; i += 1) {
      const r = dequeue(fila);
      if (!r.ok) throw new Error('dequeue não deveria falhar');
      saida.push(r.node.value);
      fila = r.state;
    }

    expect(saida).toEqual(['a', 'b', 'c']);
  });

  it('esvaziar e voltar a enfileirar mantém a estrutura consistente', () => {
    let fila = filaEncadeada(['a']);
    const removido = dequeue(fila);
    if (!removido.ok) throw new Error('dequeue não deveria falhar');
    fila = removido.state;

    expect(fila.head).toBeNull();
    // O fim precisa ser zerado junto com o início; se ficasse apontando para o
    // nó liberado, o próximo enqueue corromperia a fila.
    expect(fila.tail).toBeNull();

    const novo = enqueue(fila, no('b'));
    if (!novo.ok) throw new Error('enqueue não deveria falhar');
    expect(toArrayFromFront(novo.state)).toEqual(['b']);
  });
});

describe('alocação dinâmica não tem overflow', () => {
  it('empilhar 100 nós nunca falha — não existe capacidade fixa', () => {
    let pilha = createLinkedStack();
    for (let i = 0; i < 100; i += 1) {
      const r = push(pilha, no(String(i)));
      expect(r.ok).toBe(true);
      if (r.ok) pilha = r.state;
    }
    expect(pilha.size).toBe(100);
  });

  it('a pilha em vetor, na mesma situação, transborda', () => {
    const cheia = pilhaVetor(['1', '2'], 2);
    expect(pushVetor(cheia, { id: 'x', value: '3' })).toEqual({
      ok: false,
      error: 'OVERFLOW',
    });
  });

  it('nenhuma trilha de push encadeado termina em erro', () => {
    const grande = pilhaEncadeada(Array.from({ length: 40 }, (_, i) => String(i)));
    expect(planPushEnc(grande, no('novo')).outcome).toBe('success');
  });

  it('a fila encadeada tampouco fica cheia', () => {
    const grande = filaEncadeada(Array.from({ length: 40 }, (_, i) => String(i)));
    expect(planEnqueueEnc(grande, no('novo')).outcome).toBe('success');
  });
});

describe('mesmo TAD, mesma complexidade', () => {
  it('push custa O(1) nas duas implementações', () => {
    const vetor = planPushVetor(pilhaVetor(['a']), { id: 'x', value: 'z' });
    const encadeada = planPushEnc(pilhaEncadeada(['a']), no('z'));
    expect(encadeada.complexity.notation).toBe(vetor.complexity.notation);
    expect(encadeada.complexity.notation).toBe('O(1)');
  });

  it('enqueue custa O(1) nas duas implementações', () => {
    const vetor = planEnqueueVetor(filaVetor(['a']), { id: 'x', value: 'z' });
    const encadeada = planEnqueueEnc(filaEncadeada(['a']), no('z'));
    expect(encadeada.complexity.notation).toBe(vetor.complexity.notation);
    expect(encadeada.complexity.notation).toBe('O(1)');
  });
});

describe('mesma complexidade, custos concretos diferentes', () => {
  it('push encadeado religa dois ponteiros; em vetor, grava uma posição', () => {
    expect(planPushVetor(pilhaVetor(['a']), { id: 'x', value: 'z' }).totals.moves).toBe(1);
    expect(planPushEnc(pilhaEncadeada(['a']), no('z')).totals.moves).toBe(2);
  });

  it('o custo extra é constante: não cresce com o tamanho da pilha', () => {
    const pequena = planPushEnc(pilhaEncadeada(['a']), no('z')).totals.moves;
    const grande = planPushEnc(
      pilhaEncadeada(Array.from({ length: 30 }, (_, i) => String(i))),
      no('z'),
    ).totals.moves;
    expect(grande).toBe(pequena);
  });
});

describe('o ponteiro de fim é o que mantém enqueue em O(1)', () => {
  it.each([1, 5, 20])('enfileirar numa fila de %i nós visita no máximo um nó', (tamanho) => {
    const fila = filaEncadeada(Array.from({ length: tamanho }, (_, i) => String(i)));
    expect(planEnqueueEnc(fila, no('novo')).totals.visits).toBeLessThanOrEqual(1);
  });

  it('dequeue também não percorre nada', () => {
    const fila = filaEncadeada(Array.from({ length: 20 }, (_, i) => String(i)));
    expect(planDequeueEnc(fila).totals.visits).toBe(1);
  });
});

describe('as trilhas encadeadas se comportam como as demais', () => {
  const trilhas = [
    planPushEnc(pilhaEncadeada(['a', 'b']), no('z')),
    planPopEnc(pilhaEncadeada(['a', 'b'])),
    planPopEnc(createLinkedStack()),
    planPeekEnc(pilhaEncadeada(['a'])),
    planPilhaVaziaEnc(createLinkedStack()),
    planEnqueueEnc(filaEncadeada(['a']), no('z')),
    planEnqueueEnc(createLinkedQueue(), no('z')),
    planDequeueEnc(filaEncadeada(['a', 'b'])),
    planDequeueEnc(createLinkedQueue()),
    planFilaVaziaEnc(filaEncadeada(['a'])),
  ];

  it('toda trilha tem ao menos um passo', () => {
    for (const trace of trilhas) expect(trace.steps.length).toBeGreaterThan(0);
  });

  /**
   * As linhas do pseudocódigo são endereçadas por rótulo. Um rótulo inexistente
   * não quebra a compilação: resolve para `undefined`, que vira `null` e deixa
   * o passo sem linha destacada. Exigir uma linha em todo passo é o que
   * transforma esse engano silencioso em teste vermelho.
   */
  it('todo passo aponta para uma linha existente do pseudocódigo', () => {
    for (const trace of trilhas) {
      for (const step of trace.steps) {
        expect(
          step.codeLine,
          `passo "${step.title}" de ${trace.label} ficou sem linha`,
        ).not.toBeNull();
        expect(step.codeLine).toBeGreaterThanOrEqual(0);
        expect(step.codeLine).toBeLessThan(trace.pseudocode.lines.length);
      }
    }
  });

  it('trilhas com erro terminam num passo de tom "error"', () => {
    for (const trace of trilhas.filter((t) => t.outcome === 'error')) {
      expect(trace.steps.at(-1)?.tone).toBe('error');
    }
  });

  it('nenhum destaque aponta para nó inexistente', () => {
    for (const trace of trilhas) {
      for (const step of trace.steps) {
        for (const destaque of step.highlights) {
          if (destaque.kind === 'node' && destaque.id !== '') {
            const noFlutuante = step.snapshot.floating?.item.id === destaque.id;
            const existe = Object.keys(step.snapshot.state.nodes).includes(destaque.id);
            expect(existe || noFlutuante).toBe(true);
          }
        }
      }
    }
  });

  it('nunca narram ponteiro prev — as duas usam lista simplesmente ligada', () => {
    for (const trace of trilhas) {
      for (const step of trace.steps) {
        expect(step.snapshot.state.variant).toBe('singly');
        expect(step.highlights.some((h) => h.kind === 'link' && h.direction === 'prev')).toBe(
          false,
        );
      }
    }
  });

  it('o último passo reflete o estado final da estrutura', () => {
    const trace = planPushEnc(pilhaEncadeada(['a', 'b']), no('z'));
    expect(toArray(trace.steps.at(-1)!.snapshot.state)).toEqual(['z', 'b', 'a']);
  });
});
