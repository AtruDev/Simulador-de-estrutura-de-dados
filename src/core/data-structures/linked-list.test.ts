import { describe, expect, it } from 'vitest';
import {
  type LinkedListState,
  type ListMutation,
  type ListVariant,
  createList,
  deleteAt,
  deleteHead,
  deleteTail,
  emptyList,
  getNode,
  indexOfNode,
  insertAt,
  insertHead,
  insertTail,
  isEmpty,
  nodeAt,
  nodeIds,
  search,
  toArray,
} from './linked-list';

const VARIANTES: readonly ListVariant[] = ['singly', 'doubly'];

function novo(value: string) {
  return { id: `no-${value}`, value };
}

function listOf(values: readonly string[], variant: ListVariant): LinkedListState {
  return createList(variant, values.map(novo));
}

/** Extrai o estado de uma mutação, falhando o teste se ela não deu certo. */
function ok(result: ListMutation): LinkedListState {
  if (!result.ok) throw new Error(`operação falhou inesperadamente: ${result.error}`);
  return result.state;
}

/**
 * Verifica os invariantes estruturais da lista. É a rede de segurança que
 * garante que nenhuma operação deixou um ponteiro inconsistente.
 */
function expectIntegridade(state: LinkedListState): void {
  const ids = nodeIds(state);
  expect(ids).toHaveLength(state.size);
  expect(Object.keys(state.nodes)).toHaveLength(state.size);

  if (state.size === 0) {
    expect(state.head).toBeNull();
    expect(state.tail).toBeNull();
    return;
  }

  expect(state.head).toBe(ids[0]);
  expect(state.tail).toBe(ids[ids.length - 1]);
  expect(getNode(state, state.tail)?.next).toBeNull();
  expect(getNode(state, state.head)?.prev).toBeNull();

  ids.forEach((id, posicao) => {
    const node = getNode(state, id);
    expect(node).not.toBeNull();
    if (node === null) return;

    const esperadoNext = ids[posicao + 1] ?? null;
    expect(node.next).toBe(esperadoNext);

    // Em listas simples, `prev` nunca é preenchido; em duplas, aponta de volta.
    const esperadoPrev = state.variant === 'doubly' ? (ids[posicao - 1] ?? null) : null;
    expect(node.prev).toBe(esperadoPrev);
  });
}

describe.each(VARIANTES)('lista %s — inserções', (variant) => {
  it('insertHead numa lista vazia define cabeça e cauda no mesmo nó', () => {
    const state = ok(insertHead(emptyList(variant), novo('a')));
    expect(toArray(state)).toEqual(['a']);
    expect(state.head).toBe(state.tail);
    expectIntegridade(state);
  });

  it('insertHead empurra os nós existentes para a frente', () => {
    const state = ok(insertHead(listOf(['b', 'c'], variant), novo('a')));
    expect(toArray(state)).toEqual(['a', 'b', 'c']);
    expect(state.head).toBe('no-a');
    expect(state.tail).toBe('no-c');
    expectIntegridade(state);
  });

  it('insertTail numa lista vazia define cabeça e cauda no mesmo nó', () => {
    const state = ok(insertTail(emptyList(variant), novo('a')));
    expect(toArray(state)).toEqual(['a']);
    expect(state.head).toBe(state.tail);
    expectIntegridade(state);
  });

  it('insertTail acrescenta ao fim e atualiza a cauda', () => {
    const state = ok(insertTail(listOf(['a', 'b'], variant), novo('c')));
    expect(toArray(state)).toEqual(['a', 'b', 'c']);
    expect(state.tail).toBe('no-c');
    expectIntegridade(state);
  });

  it('insertAt no meio religa os ponteiros dos vizinhos', () => {
    const result = insertAt(listOf(['a', 'c'], variant), 1, novo('b'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(toArray(result.state)).toEqual(['a', 'b', 'c']);
    expect(result.index).toBe(1);
    expectIntegridade(result.state);
  });

  it('insertAt(0) equivale a insertHead e não percorre nenhum nó', () => {
    const result = insertAt(listOf(['b'], variant), 0, novo('a'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(toArray(result.state)).toEqual(['a', 'b']);
    expect(result.visited).toEqual([]);
  });

  it('insertAt(size) acrescenta ao fim e atualiza a cauda', () => {
    const result = insertAt(listOf(['a', 'b'], variant), 2, novo('c'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(toArray(result.state)).toEqual(['a', 'b', 'c']);
    expect(result.state.tail).toBe('no-c');
    expectIntegridade(result.state);
  });

  it('insertAt registra os nós percorridos até a posição', () => {
    const result = insertAt(listOf(['a', 'b', 'c'], variant), 2, novo('x'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Para inserir na posição 2 é preciso alcançar o nó da posição 1.
    expect(result.visited).toEqual(['no-a', 'no-b']);
  });

  // --- Casos de borda ---

  it('insertAt rejeita índices fora do intervalo', () => {
    const lista = listOf(['a', 'b'], variant);
    expect(insertAt(lista, -1, novo('x'))).toEqual({ ok: false, error: 'OUT_OF_RANGE' });
    expect(insertAt(lista, 3, novo('x'))).toEqual({ ok: false, error: 'OUT_OF_RANGE' });
    expect(insertAt(lista, 1.5, novo('x'))).toEqual({ ok: false, error: 'OUT_OF_RANGE' });
  });

  it('insertAt(0) é válido mesmo na lista vazia', () => {
    expect(insertAt(emptyList(variant), 0, novo('a')).ok).toBe(true);
    expect(insertAt(emptyList(variant), 1, novo('a')).ok).toBe(false);
  });

  it('não modifica o estado original (imutabilidade)', () => {
    const original = listOf(['a', 'b'], variant);
    insertHead(original, novo('z'));
    insertTail(original, novo('z'));
    insertAt(original, 1, novo('z'));
    expect(toArray(original)).toEqual(['a', 'b']);
    expect(original.size).toBe(2);
  });
});

describe.each(VARIANTES)('lista %s — remoções', (variant) => {
  it('deleteHead remove o primeiro nó e promove o seguinte a cabeça', () => {
    const result = deleteHead(listOf(['a', 'b', 'c'], variant));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.node.value).toBe('a');
    expect(toArray(result.state)).toEqual(['b', 'c']);
    expect(result.state.head).toBe('no-b');
    expectIntegridade(result.state);
  });

  it('deleteTail remove o último nó e promove o anterior a cauda', () => {
    const result = deleteTail(listOf(['a', 'b', 'c'], variant));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.node.value).toBe('c');
    expect(toArray(result.state)).toEqual(['a', 'b']);
    expect(result.state.tail).toBe('no-b');
    expectIntegridade(result.state);
  });

  it('deleteAt no meio religa o nó anterior ao seguinte', () => {
    const result = deleteAt(listOf(['a', 'b', 'c'], variant), 1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.node.value).toBe('b');
    expect(toArray(result.state)).toEqual(['a', 'c']);
    expectIntegridade(result.state);
  });

  it('deleteAt na última posição atualiza a cauda', () => {
    const result = deleteAt(listOf(['a', 'b', 'c'], variant), 2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.tail).toBe('no-b');
    expectIntegridade(result.state);
  });

  it('deleteAt registra os nós percorridos até a posição', () => {
    const result = deleteAt(listOf(['a', 'b', 'c'], variant), 2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.visited).toEqual(['no-a', 'no-b']);
  });

  // --- Casos de borda ---

  it('remover o único nó esvazia a lista por completo', () => {
    for (const remover of [deleteHead, deleteTail]) {
      const result = remover(listOf(['único'], variant));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(isEmpty(result.state)).toBe(true);
      expect(result.state.head).toBeNull();
      expect(result.state.tail).toBeNull();
      expectIntegridade(result.state);
    }
  });

  it('deleteAt(0) sobre lista de um nó também a esvazia', () => {
    const result = deleteAt(listOf(['único'], variant), 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(isEmpty(result.state)).toBe(true);
    expectIntegridade(result.state);
  });

  it('falha com EMPTY em qualquer remoção sobre lista vazia', () => {
    const vazia = emptyList(variant);
    expect(deleteHead(vazia)).toEqual({ ok: false, error: 'EMPTY' });
    expect(deleteTail(vazia)).toEqual({ ok: false, error: 'EMPTY' });
    expect(deleteAt(vazia, 0)).toEqual({ ok: false, error: 'EMPTY' });
  });

  it('deleteAt rejeita índices fora do intervalo', () => {
    const lista = listOf(['a', 'b'], variant);
    expect(deleteAt(lista, -1)).toEqual({ ok: false, error: 'OUT_OF_RANGE' });
    expect(deleteAt(lista, 2)).toEqual({ ok: false, error: 'OUT_OF_RANGE' });
  });

  it('esvazia a lista completamente após N remoções', () => {
    let state = listOf(['a', 'b', 'c'], variant);
    for (let i = 0; i < 3; i += 1) {
      state = ok(deleteHead(state));
      expectIntegridade(state);
    }
    expect(isEmpty(state)).toBe(true);
    expect(deleteHead(state).ok).toBe(false);
  });

  it('não modifica o estado original (imutabilidade)', () => {
    const original = listOf(['a', 'b'], variant);
    deleteHead(original);
    deleteTail(original);
    deleteAt(original, 1);
    expect(toArray(original)).toEqual(['a', 'b']);
    expect(original.size).toBe(2);
  });
});

describe('diferença entre as variantes', () => {
  it('lista simplesmente ligada nunca preenche o ponteiro prev', () => {
    const state = listOf(['a', 'b', 'c'], 'singly');
    for (const id of nodeIds(state)) {
      expect(getNode(state, id)?.prev).toBeNull();
    }
  });

  it('lista duplamente ligada liga cada nó ao anterior', () => {
    const state = listOf(['a', 'b', 'c'], 'doubly');
    expect(getNode(state, 'no-b')?.prev).toBe('no-a');
    expect(getNode(state, 'no-c')?.prev).toBe('no-b');
    expect(getNode(state, 'no-a')?.prev).toBeNull();
  });

  it('deleteTail percorre a lista simples, mas não a dupla', () => {
    const simples = deleteTail(listOf(['a', 'b', 'c'], 'singly'));
    const dupla = deleteTail(listOf(['a', 'b', 'c'], 'doubly'));
    expect(simples.ok && dupla.ok).toBe(true);
    if (!simples.ok || !dupla.ok) return;

    // Sem caminho de volta, a lista simples precisa achar o antecessor da cauda.
    expect(simples.visited).toEqual(['no-a', 'no-b']);
    // Com o ponteiro prev, a lista dupla chega ao antecessor em um passo.
    expect(dupla.visited).toEqual([]);
  });
});

describe('search', () => {
  it('encontra o valor e informa a posição', () => {
    const result = search(listOf(['a', 'b', 'c'], 'singly'), 'b');
    expect(result.foundId).toBe('no-b');
    expect(result.foundIndex).toBe(1);
  });

  it('para de percorrer assim que encontra', () => {
    const result = search(listOf(['a', 'b', 'c'], 'singly'), 'b');
    expect(result.visited).toEqual(['no-a', 'no-b']);
  });

  it('encontra o valor logo na cabeça visitando um único nó', () => {
    const result = search(listOf(['a', 'b', 'c'], 'doubly'), 'a');
    expect(result.foundIndex).toBe(0);
    expect(result.visited).toEqual(['no-a']);
  });

  // --- Casos de borda ---

  it('percorre a lista inteira quando o valor não existe', () => {
    const result = search(listOf(['a', 'b', 'c'], 'singly'), 'z');
    expect(result.foundId).toBeNull();
    expect(result.foundIndex).toBe(-1);
    expect(result.visited).toEqual(['no-a', 'no-b', 'no-c']);
  });

  it('não visita nenhum nó numa lista vazia', () => {
    const result = search(emptyList('doubly'), 'a');
    expect(result.foundIndex).toBe(-1);
    expect(result.visited).toEqual([]);
  });

  it('encontra a primeira ocorrência quando há valores repetidos', () => {
    const result = search(listOf(['x', 'y', 'x'], 'singly'), 'x');
    expect(result.foundIndex).toBe(0);
    expect(result.visited).toEqual(['no-x']);
  });
});

describe('consultas auxiliares', () => {
  it('nodeAt devolve o nó da posição, ou null fora do intervalo', () => {
    const state = listOf(['a', 'b'], 'doubly');
    expect(nodeAt(state, 0)?.value).toBe('a');
    expect(nodeAt(state, 1)?.value).toBe('b');
    expect(nodeAt(state, 2)).toBeNull();
    expect(nodeAt(state, -1)).toBeNull();
  });

  it('indexOfNode localiza a posição de um nó', () => {
    const state = listOf(['a', 'b', 'c'], 'singly');
    expect(indexOfNode(state, 'no-c')).toBe(2);
    expect(indexOfNode(state, 'inexistente')).toBe(-1);
  });

  it('createList monta a lista na ordem informada', () => {
    const state = listOf(['a', 'b', 'c'], 'doubly');
    expect(toArray(state)).toEqual(['a', 'b', 'c']);
    expect(state.size).toBe(3);
    expectIntegridade(state);
  });
});
