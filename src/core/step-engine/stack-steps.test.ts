import { describe, expect, it } from 'vitest';
import {
  type StackItem,
  type StackState,
  createStack,
  push,
  toArray,
} from '../data-structures/stack';
import { finalSnapshot } from '../../types/step';
import type { StackTrace } from '../../types/structures';
import { planIsEmpty, planIsFull, planPeek, planPop, planPush } from './stack-steps';

function item(value: string): StackItem {
  return { id: `no-${value}`, value };
}

function stackOf(values: readonly string[], capacity = 10): StackState {
  return values.reduce<StackState>((state, value) => {
    const result = push(state, item(value));
    if (!result.ok) throw new Error('falha ao montar pilha de teste');
    return result.state;
  }, createStack(capacity));
}

/** Estado da pilha ao final da trilha — o que a interface passa a exibir. */
function finalState(trace: StackTrace): StackState {
  return finalSnapshot(trace).state;
}

describe('planPush', () => {
  it('decompõe a operação nos quatro passos didáticos da especificação', () => {
    const trace = planPush(stackOf(['a']), item('b'));
    expect(trace.steps.map((s) => s.title)).toEqual([
      'Cria o novo elemento',
      'Verifica se há espaço disponível',
      'Posiciona o elemento no topo',
      'Atualiza o índice do topo',
    ]);
    expect(trace.outcome).toBe('success');
    expect(trace.complexity.notation).toBe('O(1)');
  });

  it('deixa o novo elemento no topo ao final da trilha', () => {
    const trace = planPush(stackOf(['a']), item('b'));
    expect(toArray(finalState(trace))).toEqual(['a', 'b']);
  });

  it('mostra o elemento fora da estrutura antes de ele entrar', () => {
    const trace = planPush(stackOf([]), item('42'));
    expect(trace.steps[0].snapshot.floating).toEqual({
      item: item('42'),
      phase: 'entering',
    });
    // Depois de posicionado, não há mais elemento em trânsito.
    expect(finalSnapshot(trace).floating).toBeNull();
  });

  // --- Caso de borda: overflow ---

  it('produz uma trilha de erro quando a pilha está cheia, sem lançar exceção', () => {
    const cheia = stackOf(['a', 'b'], 2);
    const trace = planPush(cheia, item('c'));

    expect(trace.outcome).toBe('error');
    expect(trace.steps.at(-1)?.tone).toBe('error');
    expect(trace.steps.at(-1)?.title).toBe('Overflow: a pilha está cheia');
    expect(trace.summary).toContain('Overflow');
  });

  it('mantém a pilha inalterada após um overflow', () => {
    const cheia = stackOf(['a', 'b'], 2);
    const trace = planPush(cheia, item('c'));
    expect(toArray(finalState(trace))).toEqual(['a', 'b']);
  });
});

describe('planPop', () => {
  it('decompõe a operação em quatro passos e remove o topo', () => {
    const trace = planPop(stackOf(['a', 'b']));
    expect(trace.steps).toHaveLength(4);
    expect(trace.outcome).toBe('success');
    expect(toArray(finalState(trace))).toEqual(['a']);
    expect(trace.summary).toContain('b');
  });

  it('mostra o elemento saindo da estrutura', () => {
    const trace = planPop(stackOf(['a', 'b']));
    const saindo = trace.steps.find((s) => s.snapshot.floating?.phase === 'leaving');
    expect(saindo?.snapshot.floating?.item.value).toBe('b');
  });

  // --- Casos de borda ---

  it('produz uma trilha de erro (underflow) quando a pilha está vazia', () => {
    const trace = planPop(createStack());
    expect(trace.outcome).toBe('error');
    expect(trace.steps).toHaveLength(2);
    expect(trace.steps.at(-1)?.title).toBe('Underflow: a pilha está vazia');
    expect(trace.summary).toContain('Underflow');
  });

  it('explica que a pilha ficou vazia ao remover o único elemento', () => {
    const trace = planPop(stackOf(['único']));
    expect(trace.outcome).toBe('success');
    expect(finalState(trace).items).toHaveLength(0);
    expect(trace.steps.at(-1)?.description).toContain('-1');
  });
});

describe('planPeek', () => {
  it('consulta o topo sem alterar a pilha', () => {
    const inicial = stackOf(['a', 'b']);
    const trace = planPeek(inicial);
    expect(trace.outcome).toBe('success');
    expect(toArray(finalState(trace))).toEqual(['a', 'b']);
    expect(trace.summary).toContain('b');
  });

  // --- Caso de borda ---

  it('produz trilha de erro quando a pilha está vazia', () => {
    const trace = planPeek(createStack());
    expect(trace.outcome).toBe('error');
    expect(trace.steps.at(-1)?.tone).toBe('error');
  });
});

describe('planIsEmpty / planIsFull', () => {
  it('relata corretamente uma pilha vazia', () => {
    const trace = planIsEmpty(createStack(3));
    expect(trace.steps.at(-1)?.title).toBe('A pilha está vazia');
    expect(trace.summary).toContain('verdadeiro');
  });

  it('relata corretamente uma pilha não vazia', () => {
    const trace = planIsEmpty(stackOf(['a'], 3));
    expect(trace.steps.at(-1)?.title).toBe('A pilha não está vazia');
    expect(trace.summary).toContain('falso');
  });

  it('relata corretamente uma pilha cheia', () => {
    const trace = planIsFull(stackOf(['a', 'b'], 2));
    expect(trace.steps.at(-1)?.title).toBe('A pilha está cheia');
    expect(trace.summary).toContain('verdadeiro');
  });

  it('nunca falha: consultas de estado são sempre bem-sucedidas', () => {
    expect(planIsFull(createStack(2)).outcome).toBe('success');
    expect(planIsEmpty(createStack(2)).outcome).toBe('success');
  });
});

describe('invariantes do motor de passos', () => {
  const trilhas: readonly StackTrace[] = [
    planPush(stackOf(['a']), item('b')),
    planPush(stackOf(['a', 'b'], 2), item('c')),
    planPop(stackOf(['a'])),
    planPop(createStack()),
    planPeek(stackOf(['a'])),
    planPeek(createStack()),
    planIsEmpty(createStack()),
    planIsFull(stackOf(['a'], 1)),
  ];

  it('toda trilha tem ao menos um passo', () => {
    for (const trace of trilhas) {
      expect(trace.steps.length).toBeGreaterThan(0);
    }
  });

  it('todo passo tem título e descrição não vazios', () => {
    for (const trace of trilhas) {
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
        expect(step.codeLine).toBeGreaterThanOrEqual(0);
        expect(step.codeLine).toBeLessThan(trace.pseudocode.lines.length);
      }
    }
  });

  it('todo passo tem identificador único', () => {
    const ids = trilhas.flatMap((trace) => trace.steps.map((step) => step.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('trilhas com erro terminam num passo de tom "error"', () => {
    for (const trace of trilhas.filter((t) => t.outcome === 'error')) {
      expect(trace.steps.at(-1)?.tone).toBe('error');
    }
  });
});
