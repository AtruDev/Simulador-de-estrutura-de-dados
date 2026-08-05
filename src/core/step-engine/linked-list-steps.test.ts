import { describe, expect, it } from 'vitest';
import {
  type LinkedListState,
  type ListVariant,
  createList,
  emptyList,
  toArray,
} from '../data-structures/linked-list';
import { finalSnapshot } from '../../types/step';
import type { ListTrace } from '../../types/structures';
import {
  planDeleteAt,
  planDeleteHead,
  planDeleteTail,
  planInsertAt,
  planInsertHead,
  planInsertTail,
  planSearch,
} from './linked-list-steps';

const VARIANTES: readonly ListVariant[] = ['singly', 'doubly'];

function novo(value: string) {
  return { id: `no-${value}`, value };
}

function listOf(values: readonly string[], variant: ListVariant): LinkedListState {
  return createList(variant, values.map(novo));
}

function finalState(trace: ListTrace): LinkedListState {
  return finalSnapshot(trace).state;
}

describe.each(VARIANTES)('lista %s — inserções', (variant) => {
  it('planInsertHead deixa o novo nó como cabeça', () => {
    const trace = planInsertHead(listOf(['b'], variant), novo('a'));
    expect(trace.outcome).toBe('success');
    expect(toArray(finalState(trace))).toEqual(['a', 'b']);
    expect(trace.complexity.notation).toBe('O(1)');
  });

  it('planInsertHead mostra o nó fora da lista antes de ligá-lo', () => {
    const trace = planInsertHead(listOf(['b'], variant), novo('a'));
    expect(trace.steps[0].snapshot.floating?.phase).toBe('entering');
    expect(finalSnapshot(trace).floating).toBeNull();
  });

  it('planInsertTail deixa o novo nó como cauda', () => {
    const trace = planInsertTail(listOf(['a'], variant), novo('b'));
    expect(toArray(finalState(trace))).toEqual(['a', 'b']);
    expect(finalState(trace).tail).toBe('no-b');
    expect(trace.complexity.notation).toBe('O(1)');
  });

  it('planInsertTail numa lista vazia explica que o nó vira cabeça e cauda', () => {
    const trace = planInsertTail(emptyList(variant), novo('a'));
    expect(trace.steps.at(-1)?.title).toContain('cabeça e cauda');
    expect(toArray(finalState(trace))).toEqual(['a']);
  });

  it('planInsertAt insere na posição pedida e é O(n)', () => {
    const trace = planInsertAt(listOf(['a', 'c'], variant), 1, novo('b'));
    expect(trace.outcome).toBe('success');
    expect(toArray(finalState(trace))).toEqual(['a', 'b', 'c']);
    expect(trace.complexity.notation).toBe('O(n)');
  });

  it('planInsertAt gera um passo de percurso por nó visitado', () => {
    const trace = planInsertAt(listOf(['a', 'b', 'c'], variant), 3, novo('d'));
    const passosDePercurso = trace.steps.filter((s) => s.title.startsWith('Percorre até'));
    expect(passosDePercurso).toHaveLength(3);
    expect(toArray(finalState(trace))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('planInsertAt(0) delega para a inserção na cabeça, mantendo o rótulo', () => {
    const trace = planInsertAt(listOf(['b'], variant), 0, novo('a'));
    expect(trace.label).toBe('insertAt(0, a)');
    expect(trace.complexity.notation).toBe('O(n)');
    expect(toArray(finalState(trace))).toEqual(['a', 'b']);
  });

  // --- Caso de borda ---

  it('planInsertAt produz trilha de erro para índice fora do intervalo', () => {
    const trace = planInsertAt(listOf(['a'], variant), 5, novo('x'));
    expect(trace.outcome).toBe('error');
    expect(trace.steps.at(-1)?.title).toBe('Índice fora do intervalo');
    expect(toArray(finalState(trace))).toEqual(['a']);
  });
});

describe.each(VARIANTES)('lista %s — remoções', (variant) => {
  it('planDeleteHead remove o primeiro nó', () => {
    const trace = planDeleteHead(listOf(['a', 'b'], variant));
    expect(trace.outcome).toBe('success');
    expect(toArray(finalState(trace))).toEqual(['b']);
    expect(trace.summary).toContain('a');
  });

  it('planDeleteHead mostra o nó saindo da estrutura', () => {
    const trace = planDeleteHead(listOf(['a', 'b'], variant));
    const saindo = trace.steps.find((s) => s.snapshot.floating?.phase === 'leaving');
    expect(saindo?.snapshot.floating?.item.value).toBe('a');
  });

  it('planDeleteTail remove o último nó', () => {
    const trace = planDeleteTail(listOf(['a', 'b', 'c'], variant));
    expect(toArray(finalState(trace))).toEqual(['a', 'b']);
    expect(finalState(trace).tail).toBe('no-b');
  });

  it('planDeleteAt remove o nó da posição pedida', () => {
    const trace = planDeleteAt(listOf(['a', 'b', 'c'], variant), 1);
    expect(toArray(finalState(trace))).toEqual(['a', 'c']);
    expect(trace.complexity.notation).toBe('O(n)');
  });

  it('planDeleteAt(0) delega para a remoção da cabeça, mantendo o rótulo', () => {
    const trace = planDeleteAt(listOf(['a', 'b'], variant), 0);
    expect(trace.label).toBe('deleteAt(0)');
    expect(toArray(finalState(trace))).toEqual(['b']);
  });

  // --- Casos de borda ---

  it('remover o único nó deixa a lista vazia', () => {
    for (const trace of [
      planDeleteHead(listOf(['único'], variant)),
      planDeleteTail(listOf(['único'], variant)),
      planDeleteAt(listOf(['único'], variant), 0),
    ]) {
      expect(trace.outcome).toBe('success');
      expect(finalState(trace).size).toBe(0);
      expect(finalState(trace).head).toBeNull();
      expect(finalState(trace).tail).toBeNull();
    }
  });

  it('produz trilha de erro em qualquer remoção sobre lista vazia', () => {
    for (const trace of [
      planDeleteHead(emptyList(variant)),
      planDeleteTail(emptyList(variant)),
      planDeleteAt(emptyList(variant), 0),
    ]) {
      expect(trace.outcome).toBe('error');
      expect(trace.steps.at(-1)?.tone).toBe('error');
    }
  });

  it('planDeleteAt produz trilha de erro para índice fora do intervalo', () => {
    const trace = planDeleteAt(listOf(['a', 'b'], variant), 7);
    expect(trace.outcome).toBe('error');
    expect(trace.steps.at(-1)?.title).toBe('Índice fora do intervalo');
    expect(toArray(finalState(trace))).toEqual(['a', 'b']);
  });
});

describe('deleteTail evidencia a diferença entre as variantes', () => {
  it('é O(1) na lista dupla, alcançando o antecessor pelo prev', () => {
    const trace = planDeleteTail(listOf(['a', 'b', 'c'], 'doubly'));
    expect(trace.complexity.notation).toBe('O(1)');
    expect(trace.steps.some((s) => s.title.includes('prev'))).toBe(true);
    expect(trace.steps.some((s) => s.title.startsWith('Percorre até'))).toBe(false);
  });

  it('é O(n) na lista simples, percorrendo até achar o antecessor', () => {
    const trace = planDeleteTail(listOf(['a', 'b', 'c'], 'singly'));
    expect(trace.complexity.notation).toBe('O(n)');
    const percurso = trace.steps.filter((s) => s.title.startsWith('Percorre até'));
    expect(percurso).toHaveLength(2);
  });
});

describe('planSearch', () => {
  it('encontra o valor e informa a posição', () => {
    const trace = planSearch(listOf(['a', 'b', 'c'], 'singly'), 'b');
    expect(trace.outcome).toBe('success');
    expect(trace.summary).toContain('posição 1');
    expect(trace.complexity.notation).toBe('O(n)');
  });

  it('gera um passo de comparação por nó visitado, parando ao encontrar', () => {
    const trace = planSearch(listOf(['a', 'b', 'c'], 'singly'), 'b');
    const comparacoes = trace.steps.filter(
      (s) => s.title.startsWith('Compara o nó') || s.title.includes('valor encontrado'),
    );
    expect(comparacoes).toHaveLength(2);
    expect(trace.steps.at(-1)?.tone).toBe('success');
  });

  it('destaca o nó encontrado com o papel "found"', () => {
    const trace = planSearch(listOf(['a', 'b'], 'doubly'), 'b');
    const destaques = trace.steps.at(-1)?.highlights ?? [];
    expect(destaques).toContainEqual({ kind: 'node', id: 'no-b', role: 'found' });
  });

  // --- Casos de borda: valor não encontrado ---

  it('comunica visualmente quando o valor não existe', () => {
    const trace = planSearch(listOf(['a', 'b', 'c'], 'singly'), 'z');
    expect(trace.outcome).toBe('error');
    expect(trace.steps.at(-1)?.title).toBe('Valor não encontrado');
    expect(trace.steps.at(-1)?.tone).toBe('error');
    expect(trace.summary).toContain('não encontrado');
  });

  it('percorre a lista inteira antes de concluir que o valor não existe', () => {
    const trace = planSearch(listOf(['a', 'b', 'c'], 'singly'), 'z');
    const comparacoes = trace.steps.filter((s) => s.title.startsWith('Compara o nó'));
    expect(comparacoes).toHaveLength(3);
  });

  it('trata a busca numa lista vazia sem percorrer nada', () => {
    const trace = planSearch(emptyList('singly'), 'a');
    expect(trace.outcome).toBe('error');
    expect(trace.steps).toHaveLength(1);
    expect(trace.steps[0].title).toBe('A lista está vazia');
  });

  it('não altera a lista', () => {
    const trace = planSearch(listOf(['a', 'b'], 'doubly'), 'z');
    expect(toArray(finalState(trace))).toEqual(['a', 'b']);
  });
});

describe('invariantes do motor de passos', () => {
  const trilhas: readonly ListTrace[] = VARIANTES.flatMap((variant) => [
    planInsertHead(listOf(['b'], variant), novo('a')),
    planInsertTail(emptyList(variant), novo('a')),
    planInsertAt(listOf(['a', 'b'], variant), 1, novo('x')),
    planInsertAt(listOf(['a'], variant), 9, novo('x')),
    planDeleteHead(listOf(['a', 'b'], variant)),
    planDeleteHead(emptyList(variant)),
    planDeleteTail(listOf(['a', 'b', 'c'], variant)),
    planDeleteTail(emptyList(variant)),
    planDeleteAt(listOf(['a', 'b', 'c'], variant), 2),
    planDeleteAt(listOf(['a'], variant), 4),
    planSearch(listOf(['a', 'b'], variant), 'b'),
    planSearch(listOf(['a', 'b'], variant), 'z'),
    planSearch(emptyList(variant), 'z'),
  ]);

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
        expect(step.codeLine).toBeGreaterThanOrEqual(0);
        expect(step.codeLine).toBeLessThan(trace.pseudocode.lines.length);
      }
    }
  });

  it('todo destaque de nó aponta para um nó existente no snapshot', () => {
    for (const trace of trilhas) {
      for (const step of trace.steps) {
        for (const highlight of step.highlights) {
          if (highlight.kind === 'node') {
            expect(Object.keys(step.snapshot.state.nodes)).toContain(highlight.id);
          }
          if (highlight.kind === 'link') {
            const noFlutuante = step.snapshot.floating?.item.id === highlight.from;
            const existe = Object.keys(step.snapshot.state.nodes).includes(highlight.from);
            expect(existe || noFlutuante).toBe(true);
          }
        }
      }
    }
  });

  it('trilhas com erro terminam num passo de tom "error"', () => {
    for (const trace of trilhas.filter((t) => t.outcome === 'error')) {
      expect(trace.steps.at(-1)?.tone).toBe('error');
    }
  });

  it('listas simplesmente ligadas nunca narram passos de ponteiro prev', () => {
    const simples = trilhas.filter((t) => t.steps[0].snapshot.state.variant === 'singly');
    for (const trace of simples) {
      for (const step of trace.steps) {
        expect(step.highlights.some((h) => h.kind === 'link' && h.direction === 'prev')).toBe(
          false,
        );
      }
    }
  });
});
