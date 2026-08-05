/**
 * Lista ligada — simplesmente ligada e duplamente ligada.
 *
 * Módulo **puro**: sem dependência de React, sem estado global, sem mutação.
 *
 * Diferentemente da pilha e da fila, a lista ligada **não tem capacidade fixa**:
 * cada nó é alocado individualmente e ligado aos vizinhos por ponteiros. Por
 * isso não existe estado de "cheia" e não há erro de overflow aqui.
 *
 * Representação: os nós ficam num mapa `id → nó`, e as ligações são feitas por
 * identificador (`next` e `prev`), não por referência direta. Isso mantém o
 * estado imutável e serializável — cada passo da animação guarda um retrato
 * completo da lista — sem esconder a manipulação de ponteiros, que é justamente
 * o que se quer ensinar.
 *
 * Numa lista simplesmente ligada o campo `prev` é sempre `null`.
 */

export type ListVariant = 'singly' | 'doubly';

export interface ListNode {
  readonly id: string;
  readonly value: string;
  /** Ponteiro para o próximo nó; `null` marca o fim da lista. */
  readonly next: string | null;
  /** Ponteiro para o nó anterior; sempre `null` em listas simplesmente ligadas. */
  readonly prev: string | null;
}

export interface LinkedListState {
  readonly variant: ListVariant;
  readonly nodes: Readonly<Record<string, ListNode>>;
  /** Identificador do primeiro nó (cabeça), ou `null` na lista vazia. */
  readonly head: string | null;
  /** Identificador do último nó (cauda), ou `null` na lista vazia. */
  readonly tail: string | null;
  readonly size: number;
}

/** Dados de um nó a ser criado — o identificador vem de fora, por pureza. */
export interface NewNode {
  readonly id: string;
  readonly value: string;
}

export type ListError =
  /** Operação de remoção sobre lista vazia. */
  | 'EMPTY'
  /** Índice fora do intervalo aceito pela operação. */
  | 'OUT_OF_RANGE';

export interface ListMutationSuccess {
  readonly ok: true;
  readonly state: LinkedListState;
  /** Nó inserido ou removido. */
  readonly node: ListNode;
  /** Posição do nó na lista (0 = cabeça). */
  readonly index: number;
  /** Nós percorridos até chegar à posição, na ordem da visita. */
  readonly visited: readonly string[];
}

export type ListMutation =
  | ListMutationSuccess
  | { readonly ok: false; readonly error: ListError };

export interface SearchResult {
  /** Nós visitados durante o percurso, na ordem. */
  readonly visited: readonly string[];
  readonly foundId: string | null;
  /** Posição do nó encontrado, ou `-1`. */
  readonly foundIndex: number;
}

// ---------------------------------------------------------------------------
// Construção e consultas
// ---------------------------------------------------------------------------

export function createList(
  variant: ListVariant,
  values: readonly NewNode[] = [],
): LinkedListState {
  return values.reduce<LinkedListState>((state, value) => {
    const result = insertTail(state, value);
    return result.ok ? result.state : state;
  }, emptyList(variant));
}

export function emptyList(variant: ListVariant): LinkedListState {
  return { variant, nodes: {}, head: null, tail: null, size: 0 };
}

export function isEmpty(state: LinkedListState): boolean {
  return state.size === 0;
}

/** Nó de um identificador, ou `null` se não existir. */
export function getNode(state: LinkedListState, id: string | null): ListNode | null {
  if (id === null) return null;
  return state.nodes[id] ?? null;
}

/** Identificadores dos nós, da cabeça à cauda. */
export function nodeIds(state: LinkedListState): readonly string[] {
  const ids: string[] = [];
  let current = state.head;
  // O limite por `size` protege contra ciclos caso um estado inválido surja.
  while (current !== null && ids.length < state.size) {
    ids.push(current);
    current = state.nodes[current]?.next ?? null;
  }
  return ids;
}

/** Nós na ordem da lista, da cabeça à cauda. */
export function toNodes(state: LinkedListState): readonly ListNode[] {
  const result: ListNode[] = [];
  for (const id of nodeIds(state)) {
    const node = state.nodes[id];
    if (node !== undefined) result.push(node);
  }
  return result;
}

/** Valores na ordem da lista — atalho para asserções e renderização. */
export function toArray(state: LinkedListState): readonly string[] {
  return toNodes(state).map((node) => node.value);
}

/** Nó numa posição, ou `null` se o índice estiver fora do intervalo. */
export function nodeAt(state: LinkedListState, index: number): ListNode | null {
  const ids = nodeIds(state);
  const id = ids[index];
  return id === undefined ? null : (state.nodes[id] ?? null);
}

/** Posição de um nó na lista, ou `-1`. */
export function indexOfNode(state: LinkedListState, id: string): number {
  return nodeIds(state).indexOf(id);
}

// ---------------------------------------------------------------------------
// Auxiliares internos
// ---------------------------------------------------------------------------

/** Em listas simplesmente ligadas, `prev` nunca é preenchido. */
function backLink(variant: ListVariant, id: string | null): string | null {
  return variant === 'doubly' ? id : null;
}

/** Copia o mapa de nós aplicando alterações a um nó existente. */
function patchNode(
  nodes: Readonly<Record<string, ListNode>>,
  id: string,
  patch: Partial<Pick<ListNode, 'next' | 'prev'>>,
): Readonly<Record<string, ListNode>> {
  const node = nodes[id];
  if (node === undefined) return nodes;
  return { ...nodes, [id]: { ...node, ...patch } };
}

/** Copia o mapa de nós sem um dos nós. */
function withoutNode(
  nodes: Readonly<Record<string, ListNode>>,
  id: string,
): Readonly<Record<string, ListNode>> {
  const copy: Record<string, ListNode> = { ...nodes };
  // `delete` sobre a cópia local mantém a função pura em relação à entrada.
  delete copy[id];
  return copy;
}

/**
 * Percorre a lista da cabeça até a posição indicada, devolvendo os nós
 * visitados. O custo desse percurso é o que torna `insertAt` e `deleteAt` O(n).
 */
function walkTo(state: LinkedListState, index: number): readonly string[] {
  const ids = nodeIds(state);
  return ids.slice(0, Math.max(0, Math.min(index + 1, ids.length)));
}

// ---------------------------------------------------------------------------
// Inserções
// ---------------------------------------------------------------------------

/** Insere um nó no início da lista, tornando-o a nova cabeça. */
export function insertHead(state: LinkedListState, novo: NewNode): ListMutation {
  const node: ListNode = {
    id: novo.id,
    value: novo.value,
    next: state.head,
    prev: null,
  };

  let nodes: Readonly<Record<string, ListNode>> = { ...state.nodes, [node.id]: node };
  if (state.head !== null) {
    nodes = patchNode(nodes, state.head, { prev: backLink(state.variant, node.id) });
  }

  return {
    ok: true,
    node,
    index: 0,
    visited: [],
    state: {
      ...state,
      nodes,
      head: node.id,
      tail: state.tail ?? node.id,
      size: state.size + 1,
    },
  };
}

/** Insere um nó no fim da lista, tornando-o a nova cauda. */
export function insertTail(state: LinkedListState, novo: NewNode): ListMutation {
  const node: ListNode = {
    id: novo.id,
    value: novo.value,
    next: null,
    prev: backLink(state.variant, state.tail),
  };

  let nodes: Readonly<Record<string, ListNode>> = { ...state.nodes, [node.id]: node };
  if (state.tail !== null) {
    nodes = patchNode(nodes, state.tail, { next: node.id });
  }

  return {
    ok: true,
    node,
    index: state.size,
    visited: [],
    state: {
      ...state,
      nodes,
      head: state.head ?? node.id,
      tail: node.id,
      size: state.size + 1,
    },
  };
}

/**
 * Insere um nó numa posição arbitrária. Índices válidos vão de `0` (cabeça) a
 * `size` (após a cauda). Exige percorrer a lista até o nó anterior à posição.
 */
export function insertAt(
  state: LinkedListState,
  index: number,
  novo: NewNode,
): ListMutation {
  if (!Number.isInteger(index) || index < 0 || index > state.size) {
    return { ok: false, error: 'OUT_OF_RANGE' };
  }
  if (index === 0) {
    return insertHead(state, novo);
  }

  const visited = walkTo(state, index - 1);
  const anteriorId = visited[visited.length - 1];
  const anterior = anteriorId === undefined ? null : (state.nodes[anteriorId] ?? null);
  if (anterior === null) {
    return { ok: false, error: 'OUT_OF_RANGE' };
  }

  const node: ListNode = {
    id: novo.id,
    value: novo.value,
    next: anterior.next,
    prev: backLink(state.variant, anterior.id),
  };

  let nodes: Readonly<Record<string, ListNode>> = { ...state.nodes, [node.id]: node };
  nodes = patchNode(nodes, anterior.id, { next: node.id });
  if (node.next !== null) {
    nodes = patchNode(nodes, node.next, { prev: backLink(state.variant, node.id) });
  }

  return {
    ok: true,
    node,
    index,
    visited,
    state: {
      ...state,
      nodes,
      tail: anterior.id === state.tail ? node.id : state.tail,
      size: state.size + 1,
    },
  };
}

// ---------------------------------------------------------------------------
// Remoções
// ---------------------------------------------------------------------------

/** Remove a cabeça da lista. */
export function deleteHead(state: LinkedListState): ListMutation {
  const node = getNode(state, state.head);
  if (node === null) {
    return { ok: false, error: 'EMPTY' };
  }

  let nodes = withoutNode(state.nodes, node.id);
  if (node.next !== null) {
    nodes = patchNode(nodes, node.next, { prev: null });
  }

  return {
    ok: true,
    node,
    index: 0,
    visited: [],
    state: {
      ...state,
      nodes,
      head: node.next,
      tail: node.next === null ? null : state.tail,
      size: state.size - 1,
    },
  };
}

/**
 * Remove a cauda da lista.
 *
 * Numa lista **duplamente ligada** o nó anterior é alcançado por `prev`, em
 * O(1). Numa lista **simplesmente ligada** não há caminho de volta: é preciso
 * percorrer desde a cabeça para descobrir quem aponta para a cauda, o que
 * torna a operação O(n). Essa diferença é justamente um dos pontos que a
 * comparação entre as duas variantes deve deixar claro.
 */
export function deleteTail(state: LinkedListState): ListMutation {
  const node = getNode(state, state.tail);
  if (node === null) {
    return { ok: false, error: 'EMPTY' };
  }

  const index = state.size - 1;

  // Lista com um único nó: some cabeça e cauda de uma vez.
  if (state.size === 1) {
    return {
      ok: true,
      node,
      index,
      visited: [],
      state: { ...state, nodes: withoutNode(state.nodes, node.id), head: null, tail: null, size: 0 },
    };
  }

  const visited = state.variant === 'doubly' ? [] : walkTo(state, index - 1);
  const anteriorId = state.variant === 'doubly' ? node.prev : (visited[visited.length - 1] ?? null);
  const anterior = getNode(state, anteriorId);
  if (anterior === null) {
    return { ok: false, error: 'EMPTY' };
  }

  const nodes = patchNode(withoutNode(state.nodes, node.id), anterior.id, { next: null });

  return {
    ok: true,
    node,
    index,
    visited,
    state: { ...state, nodes, tail: anterior.id, size: state.size - 1 },
  };
}

/**
 * Remove o nó de uma posição. Índices válidos vão de `0` a `size - 1`. Exige
 * percorrer a lista até o nó anterior ao que será removido.
 */
export function deleteAt(state: LinkedListState, index: number): ListMutation {
  if (isEmpty(state)) {
    return { ok: false, error: 'EMPTY' };
  }
  if (!Number.isInteger(index) || index < 0 || index >= state.size) {
    return { ok: false, error: 'OUT_OF_RANGE' };
  }
  if (index === 0) {
    return deleteHead(state);
  }

  const visited = walkTo(state, index - 1);
  const anterior = getNode(state, visited[visited.length - 1] ?? null);
  const node = getNode(state, anterior?.next ?? null);
  if (anterior === null || node === null) {
    return { ok: false, error: 'OUT_OF_RANGE' };
  }

  let nodes = patchNode(withoutNode(state.nodes, node.id), anterior.id, { next: node.next });
  if (node.next !== null) {
    nodes = patchNode(nodes, node.next, { prev: backLink(state.variant, anterior.id) });
  }

  return {
    ok: true,
    node,
    index,
    visited,
    state: {
      ...state,
      nodes,
      tail: node.id === state.tail ? anterior.id : state.tail,
      size: state.size - 1,
    },
  };
}

// ---------------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------------

/**
 * Percorre a lista nó a nó procurando um valor. Como não há acesso indexado,
 * a busca é sempre linear — O(n) — mesmo que a lista esteja ordenada.
 */
export function search(state: LinkedListState, value: string): SearchResult {
  const visited: string[] = [];
  let current = state.head;
  let index = 0;

  while (current !== null && visited.length < state.size) {
    const node = state.nodes[current];
    if (node === undefined) break;
    visited.push(node.id);
    if (node.value === value) {
      return { visited, foundId: node.id, foundIndex: index };
    }
    current = node.next;
    index += 1;
  }

  return { visited, foundId: null, foundIndex: -1 };
}
