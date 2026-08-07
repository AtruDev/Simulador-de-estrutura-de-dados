/**
 * Planejadores de passos da **Lista Ligada**, nas variantes simplesmente e
 * duplamente ligada.
 *
 * Duas ênfases pedagógicas guiam a narração:
 *
 * 1. **O percurso é visível.** Operações por índice e a busca ganham um passo
 *    por nó visitado. É assim que o aluno enxerga, e não apenas lê, por que
 *    `insertAt(i)` é O(n) enquanto `insertHead` é O(1).
 * 2. **O religamento de ponteiros é explícito.** Cada alteração de `next` ou
 *    `prev` é um passo próprio, com o ponteiro em questão destacado.
 */

import {
  type LinkedListState,
  type ListVariant,
  type NewNode,
  deleteAt,
  deleteHead,
  deleteTail,
  getNode,
  insertAt,
  insertHead,
  insertTail,
  isEmpty,
  nodeIds,
  search,
} from '../data-structures/linked-list';
import type { NonEmptyArray, Pseudocode } from '../../types/step';
import type { ListHighlight, ListSnapshot, ListTrace } from '../../types/structures';
import { type TraceBuilder, complexity, createTraceBuilder, quote } from './trace-builder';

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

function createListTrace(): TraceBuilder<ListSnapshot, ListHighlight> {
  return createTraceBuilder<ListSnapshot, ListHighlight>();
}

function still(state: LinkedListState): ListSnapshot {
  return { state, floating: null };
}

function isDoubly(state: LinkedListState): boolean {
  return state.variant === 'doubly';
}

function variantName(variant: ListVariant): string {
  return variant === 'doubly' ? 'duplamente ligada' : 'simplesmente ligada';
}

/** Descreve o tamanho atual da lista. */
function sizeOf(state: LinkedListState): string {
  return `${state.size} ${state.size === 1 ? 'nó' : 'nós'}`;
}

/** Valor de um nó, entre aspas angulares, ou `NULL` quando não há nó. */
function nodeLabel(state: LinkedListState, id: string | null): string {
  const node = getNode(state, id);
  return node === null ? 'NULL' : quote(node.value);
}

/** Monta um pseudocódigo garantindo o tipo "ao menos uma linha". */
function pseudocode(title: string, lines: readonly string[]): Pseudocode {
  const [first, ...rest] = lines;
  const safe: NonEmptyArray<string> = first === undefined ? [title] : [first, ...rest];
  return { title, lines: safe };
}

// ---------------------------------------------------------------------------
// Complexidades
// ---------------------------------------------------------------------------

const C_INSERT_HEAD = complexity(
  'O(1)',
  'Basta criar o nó e redirecionar o ponteiro de cabeça. Nenhum percurso é necessário, independentemente do tamanho da lista.',
);

const C_INSERT_TAIL = complexity(
  'O(1)',
  'Como a lista mantém um ponteiro para a cauda, o último nó é alcançado diretamente, sem percorrer os anteriores. (Sem esse ponteiro, a operação seria O(n).)',
);

const C_INSERT_AT = complexity(
  'O(n)',
  'Uma lista ligada não tem acesso indexado como um array: para chegar à posição i é preciso partir da cabeça e seguir os ponteiros next um a um. No pior caso, percorre-se a lista inteira.',
);

const C_DELETE_HEAD = complexity(
  'O(1)',
  'A cabeça é conhecida diretamente; basta avançar o ponteiro para o nó seguinte.',
);

const C_DELETE_TAIL_DOUBLY = complexity(
  'O(1)',
  'Na lista duplamente ligada, o ponteiro prev da cauda leva direto ao nó anterior, que passa a ser a nova cauda.',
);

const C_DELETE_TAIL_SINGLY = complexity(
  'O(n)',
  'Na lista simplesmente ligada não há caminho de volta: descobrir qual nó aponta para a cauda exige percorrer a lista desde a cabeça. É justamente por isso que a lista dupla resolve essa operação em O(1).',
);

const C_DELETE_AT = complexity(
  'O(n)',
  'É preciso percorrer a lista desde a cabeça até o nó anterior à posição i. O religamento dos ponteiros em si é O(1); o custo está no percurso.',
);

const C_SEARCH = complexity(
  'O(n)',
  'A busca numa lista ligada é sempre linear: percorre-se nó a nó pelos ponteiros next, sem poder saltar posições. No pior caso — valor ausente ou no último nó — visita-se a lista inteira.',
);

// ---------------------------------------------------------------------------
// Pseudocódigos
// ---------------------------------------------------------------------------

function pseudoInsertHead(variant: ListVariant): Pseudocode {
  const linhas = [
    'insertHead(valor):',
    '  novo ← aloca nó com valor',
    '  novo.next ← cabeca',
    ...(variant === 'doubly'
      ? ['  se cabeca ≠ NULL então cabeca.prev ← novo']
      : []),
    '  cabeca ← novo',
    '  se cauda = NULL então cauda ← novo',
  ];
  return pseudocode('insertHead(valor)', linhas);
}

function pseudoInsertTail(variant: ListVariant): Pseudocode {
  const linhas = [
    'insertTail(valor):',
    '  novo ← aloca nó com valor; novo.next ← NULL',
    '  se cauda = NULL então',
    '    cabeca ← novo; cauda ← novo; retorna',
    '  cauda.next ← novo',
    ...(variant === 'doubly' ? ['  novo.prev ← cauda'] : []),
    '  cauda ← novo',
  ];
  return pseudocode('insertTail(valor)', linhas);
}

function pseudoInsertAt(variant: ListVariant): Pseudocode {
  const linhas = [
    'insertAt(i, valor):',
    '  se i < 0 ou i > tamanho então erro: índice inválido',
    '  se i = 0 então insertHead(valor); retorna',
    '  atual ← cabeca; k ← 0',
    '  enquanto k < i - 1 faça  atual ← atual.next; k ← k + 1',
    '  novo ← aloca nó com valor',
    '  novo.next ← atual.next',
    ...(variant === 'doubly'
      ? ['  novo.prev ← atual; se novo.next ≠ NULL então novo.next.prev ← novo']
      : []),
    '  atual.next ← novo',
  ];
  return pseudocode('insertAt(i, valor)', linhas);
}

function pseudoDeleteHead(variant: ListVariant): Pseudocode {
  const linhas = [
    'deleteHead():',
    '  se cabeca = NULL então erro: lista vazia',
    '  removido ← cabeca',
    '  cabeca ← removido.next',
    ...(variant === 'doubly' ? ['  se cabeca ≠ NULL então cabeca.prev ← NULL'] : []),
    '  se cabeca = NULL então cauda ← NULL',
    '  libera removido; retorna removido.valor',
  ];
  return pseudocode('deleteHead()', linhas);
}

function pseudoDeleteTail(variant: ListVariant): Pseudocode {
  const linhas =
    variant === 'doubly'
      ? [
          'deleteTail():',
          '  se cauda = NULL então erro: lista vazia',
          '  removido ← cauda',
          '  cauda ← removido.prev        // O(1): há caminho de volta',
          '  se cauda ≠ NULL então cauda.next ← NULL senão cabeca ← NULL',
          '  libera removido; retorna removido.valor',
        ]
      : [
          'deleteTail():',
          '  se cauda = NULL então erro: lista vazia',
          '  removido ← cauda',
          '  atual ← cabeca',
          '  enquanto atual.next ≠ cauda faça  atual ← atual.next   // O(n)',
          '  atual.next ← NULL; cauda ← atual',
          '  libera removido; retorna removido.valor',
        ];
  return pseudocode('deleteTail()', linhas);
}

function pseudoDeleteAt(variant: ListVariant): Pseudocode {
  const linhas = [
    'deleteAt(i):',
    '  se lista vazia ou i inválido então erro',
    '  se i = 0 então deleteHead(); retorna',
    '  atual ← cabeca; k ← 0',
    '  enquanto k < i - 1 faça  atual ← atual.next; k ← k + 1',
    '  removido ← atual.next',
    '  atual.next ← removido.next',
    ...(variant === 'doubly'
      ? ['  se removido.next ≠ NULL então removido.next.prev ← atual']
      : []),
    '  libera removido',
  ];
  return pseudocode('deleteAt(i)', linhas);
}

const PSEUDO_SEARCH = pseudocode('search(valor)', [
  'search(valor):',
  '  atual ← cabeca; i ← 0',
  '  enquanto atual ≠ NULL faça',
  '    se atual.valor = valor então retorna i',
  '    atual ← atual.next; i ← i + 1',
  '  retorna "não encontrado"',
]);

// ---------------------------------------------------------------------------
// Percurso — os passos que tornam o custo O(n) visível
// ---------------------------------------------------------------------------

interface WalkOptions {
  readonly builder: TraceBuilder<ListSnapshot, ListHighlight>;
  readonly state: LinkedListState;
  readonly visited: readonly string[];
  readonly codeLine: number;
  /** Explica para onde o percurso está indo. */
  readonly goal: string;
}

/** Acrescenta um passo por nó visitado durante o percurso. */
function addWalkSteps({ builder, state, visited, codeLine, goal }: WalkOptions): void {
  visited.forEach((id, posicao) => {
    const node = getNode(state, id);
    if (node === null) return;
    const ultimo = posicao === visited.length - 1;

    builder.add({
      title: `Percorre até a posição ${posicao}`,
      description: ultimo
        ? `O percurso chega ao nó da posição ${posicao}, de valor ${quote(node.value)}. ${goal}`
        : `Partindo da cabeça, o ponteiro auxiliar está no nó da posição ${posicao}, de valor ${quote(node.value)}. Ainda não é o destino, então segue pelo ponteiro next.`,
      snapshot: still(state),
      highlights: [
        { kind: 'node', id, role: ultimo ? 'target' : 'inspected' },
        ...(ultimo ? [] : ([{ kind: 'link', from: id, direction: 'next', role: 'inspected' }] as const)),
      ],
      codeLine,
      // Cada parada do ponteiro auxiliar é uma visita. É a soma delas que
      // explica por que chegar à posição i custa O(n) numa lista ligada.
      counts: { visits: 1 },
    });
  });
}

// ---------------------------------------------------------------------------
// insertHead
// ---------------------------------------------------------------------------

export function planInsertHead(state: LinkedListState, novo: NewNode): ListTrace {
  const builder = createListTrace();
  const label = `insertHead(${novo.value})`;
  const duplamente = isDoubly(state);
  const listaVazia = isEmpty(state);
  const cabecaAntiga = state.head;

  const result = insertHead(state, novo);
  // insertHead nunca falha: a lista ligada não tem capacidade máxima.
  if (!result.ok) throw new Error('insertHead não deveria falhar');

  const node = result.node;

  builder.add({
    title: 'Aloca o novo nó',
    description: `Um nó com o valor ${quote(novo.value)} é alocado. Numa lista ligada não existe limite de capacidade: cada nó é alocado individualmente, por isso não há estado de "lista cheia".`,
    snapshot: { state, floating: { item: node, phase: 'entering' } },
    highlights: [{ kind: 'floating', role: 'entering' }],
    codeLine: 1,
  });

  builder.add({
    title: 'Liga o next do novo nó à cabeça atual',
    description: listaVazia
      ? `A lista está vazia, então a cabeça vale NULL e o next do novo nó também recebe NULL — ele será, ao mesmo tempo, o primeiro e o último nó.`
      : `O ponteiro next do novo nó passa a apontar para ${nodeLabel(state, cabecaAntiga)}, que era a cabeça. A ligação precisa ser feita **antes** de mover o ponteiro de cabeça: se a cabeça fosse atualizada primeiro, o resto da lista ficaria inalcançável.`,
    snapshot: still(result.state),
    highlights: [
      { kind: 'node', id: node.id, role: 'entering' },
      { kind: 'link', from: node.id, direction: 'next', role: 'target' },
    ],
    codeLine: 2,
    counts: { moves: 1 },
  });

  if (duplamente && !listaVazia && cabecaAntiga !== null) {
    builder.add({
      title: 'Liga o prev da antiga cabeça ao novo nó',
      description: `Numa lista ${variantName(state.variant)} as ligações são recíprocas: o ponteiro prev de ${nodeLabel(state, cabecaAntiga)} passa a apontar para o novo nó.`,
      snapshot: still(result.state),
      highlights: [
        { kind: 'node', id: cabecaAntiga, role: 'inspected' },
        { kind: 'link', from: cabecaAntiga, direction: 'prev', role: 'target' },
      ],
      codeLine: 3,
      counts: { moves: 1 },
    });
  }

  builder.add({
    title: 'Atualiza o ponteiro de cabeça',
    description: listaVazia
      ? `A cabeça e a cauda passam a apontar para o novo nó: a lista deixa de estar vazia e agora tem ${sizeOf(result.state)}.`
      : `A cabeça passa a apontar para o novo nó. A lista agora tem ${sizeOf(result.state)} e ${quote(novo.value)} é o primeiro deles.`,
    snapshot: still(result.state),
    highlights: [
      { kind: 'pointer', pointer: 'head', role: 'anchor' },
      { kind: 'node', id: node.id, role: 'anchor' },
      ...(listaVazia
        ? ([{ kind: 'pointer', pointer: 'tail', role: 'anchor' }] as const)
        : []),
    ],
    codeLine: duplamente ? 4 : 3,
    tone: 'success',
    counts: { moves: listaVazia ? 2 : 1 },
  });

  return builder.build({
    label,
    complexity: C_INSERT_HEAD,
    outcome: 'success',
    summary: `${quote(novo.value)} foi inserido como nova cabeça da lista.`,
    pseudocode: pseudoInsertHead(state.variant),
  });
}

// ---------------------------------------------------------------------------
// insertTail
// ---------------------------------------------------------------------------

export function planInsertTail(state: LinkedListState, novo: NewNode): ListTrace {
  const builder = createListTrace();
  const label = `insertTail(${novo.value})`;
  const duplamente = isDoubly(state);
  const listaVazia = isEmpty(state);
  const caudaAntiga = state.tail;

  const result = insertTail(state, novo);
  if (!result.ok) throw new Error('insertTail não deveria falhar');
  const node = result.node;

  builder.add({
    title: 'Aloca o novo nó',
    description: `Um nó com o valor ${quote(novo.value)} é alocado, com o ponteiro next em NULL — ele será o último da lista, e NULL é o que marca esse fim.`,
    snapshot: { state, floating: { item: node, phase: 'entering' } },
    highlights: [{ kind: 'floating', role: 'entering' }],
    codeLine: 1,
  });

  if (listaVazia) {
    builder.add({
      title: 'A lista está vazia: o nó vira cabeça e cauda',
      description: `Como não havia nenhum nó, cabeça e cauda passam a apontar para o mesmo nó. Não há ponteiro algum a religar.`,
      snapshot: still(result.state),
      highlights: [
        { kind: 'node', id: node.id, role: 'entering' },
        { kind: 'pointer', pointer: 'head', role: 'anchor' },
        { kind: 'pointer', pointer: 'tail', role: 'anchor' },
      ],
      codeLine: 3,
      tone: 'success',
      counts: { moves: 2 },
    });

    return builder.build({
      label,
      complexity: C_INSERT_TAIL,
      outcome: 'success',
      summary: `${quote(novo.value)} foi inserido numa lista vazia: virou cabeça e cauda.`,
      pseudocode: pseudoInsertTail(state.variant),
    });
  }

  builder.add({
    title: 'Liga o next da cauda ao novo nó',
    description: `O ponteiro next de ${nodeLabel(state, caudaAntiga)}, que era a cauda, deixa de apontar para NULL e passa a apontar para o novo nó. Note que a cauda foi alcançada diretamente pelo ponteiro, sem percorrer a lista.`,
    snapshot: still(result.state),
    highlights: [
      ...(caudaAntiga !== null
        ? ([
            { kind: 'node', id: caudaAntiga, role: 'inspected' },
            { kind: 'link', from: caudaAntiga, direction: 'next', role: 'target' },
          ] as const)
        : []),
      { kind: 'node', id: node.id, role: 'entering' },
    ],
    codeLine: 4,
    counts: { moves: 1 },
  });

  if (duplamente && caudaAntiga !== null) {
    builder.add({
      title: 'Liga o prev do novo nó à antiga cauda',
      description: `Numa lista ${variantName(state.variant)} a ligação é recíproca: o ponteiro prev do novo nó aponta de volta para ${nodeLabel(state, caudaAntiga)}.`,
      snapshot: still(result.state),
      highlights: [
        { kind: 'node', id: node.id, role: 'inspected' },
        { kind: 'link', from: node.id, direction: 'prev', role: 'target' },
      ],
      codeLine: 5,
      counts: { moves: 1 },
    });
  }

  builder.add({
    title: 'Atualiza o ponteiro de cauda',
    description: `A cauda passa a apontar para o novo nó, cujo next é NULL. A lista agora tem ${sizeOf(result.state)}.`,
    snapshot: still(result.state),
    highlights: [
      { kind: 'pointer', pointer: 'tail', role: 'anchor' },
      { kind: 'node', id: node.id, role: 'anchor' },
    ],
    codeLine: duplamente ? 6 : 5,
    tone: 'success',
    counts: { moves: 1 },
  });

  return builder.build({
    label,
    complexity: C_INSERT_TAIL,
    outcome: 'success',
    summary: `${quote(novo.value)} foi inserido como nova cauda da lista.`,
    pseudocode: pseudoInsertTail(state.variant),
  });
}

// ---------------------------------------------------------------------------
// insertAt
// ---------------------------------------------------------------------------

export function planInsertAt(
  state: LinkedListState,
  index: number,
  novo: NewNode,
): ListTrace {
  const label = `insertAt(${index}, ${novo.value})`;
  const pseudo = pseudoInsertAt(state.variant);

  // Índice 0 é, por definição, uma inserção na cabeça.
  if (index === 0) {
    const trace = planInsertHead(state, novo);
    return { ...trace, label, complexity: C_INSERT_AT, pseudocode: pseudo };
  }

  const builder = createListTrace();
  const duplamente = isDoubly(state);

  builder.add({
    title: 'Valida o índice',
    description: `A lista tem ${sizeOf(state)}, então os índices aceitos para inserção vão de 0 (antes da cabeça) até ${state.size} (depois da cauda). O índice pedido é ${index}.`,
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'head', role: 'inspected' }],
    codeLine: 1,
  });

  const result = insertAt(state, index, novo);

  if (!result.ok) {
    builder.add({
      title: 'Índice fora do intervalo',
      description: `O índice ${index} não existe nesta lista: só é possível inserir entre as posições 0 e ${state.size}. A operação é cancelada e a lista permanece inalterada.`,
      snapshot: still(state),
      highlights: [],
      codeLine: 1,
      tone: 'error',
    });

    return builder.build({
      label,
      complexity: C_INSERT_AT,
      outcome: 'error',
      summary: `Índice ${index} inválido: a lista aceita inserções entre 0 e ${state.size}.`,
      pseudocode: pseudo,
    });
  }

  addWalkSteps({
    builder,
    state,
    visited: result.visited,
    codeLine: 4,
    goal: `É atrás dele que o novo nó será inserido, para ocupar a posição ${index}.`,
  });

  const anteriorId = result.visited[result.visited.length - 1] ?? null;
  const node = result.node;
  const seguinteId = node.next;

  builder.add({
    title: 'Aloca o novo nó',
    description: `Com o nó anterior localizado, um nó com o valor ${quote(novo.value)} é alocado para entrar entre ${nodeLabel(state, anteriorId)} e ${nodeLabel(state, seguinteId)}.`,
    snapshot: { state, floating: { item: node, phase: 'entering' } },
    highlights: [{ kind: 'floating', role: 'entering' }],
    codeLine: 5,
  });

  builder.add({
    title: 'Liga o next do novo nó ao nó seguinte',
    description: `O ponteiro next do novo nó recebe ${nodeLabel(state, seguinteId)}. Esta é a ordem que evita perder o resto da lista: primeiro o novo nó passa a conhecer o seguinte, só depois o anterior passa a apontar para ele.`,
    snapshot: still(result.state),
    highlights: [
      { kind: 'node', id: node.id, role: 'entering' },
      { kind: 'link', from: node.id, direction: 'next', role: 'target' },
    ],
    codeLine: 6,
    counts: { moves: 1 },
  });

  if (duplamente) {
    builder.add({
      title: 'Religa os ponteiros prev',
      description: `Na lista ${variantName(state.variant)}, o prev do novo nó aponta para ${nodeLabel(state, anteriorId)} e, se houver nó seguinte, o prev dele passa a apontar para o novo nó.`,
      snapshot: still(result.state),
      highlights: [
        { kind: 'link', from: node.id, direction: 'prev', role: 'target' },
        ...(seguinteId !== null
          ? ([{ kind: 'link', from: seguinteId, direction: 'prev', role: 'target' }] as const)
          : []),
      ],
      codeLine: 7,
      counts: { moves: seguinteId !== null ? 2 : 1 },
    });
  }

  builder.add({
    title: 'Liga o next do nó anterior ao novo nó',
    description: `Por fim, o ponteiro next de ${nodeLabel(state, anteriorId)} passa a apontar para o novo nó, que assume a posição ${index}. A lista agora tem ${sizeOf(result.state)}.`,
    snapshot: still(result.state),
    highlights: [
      ...(anteriorId !== null
        ? ([
            { kind: 'node', id: anteriorId, role: 'inspected' },
            { kind: 'link', from: anteriorId, direction: 'next', role: 'target' },
          ] as const)
        : []),
      { kind: 'node', id: node.id, role: 'anchor' },
    ],
    codeLine: duplamente ? 8 : 7,
    tone: 'success',
    counts: { moves: 1 },
  });

  return builder.build({
    label,
    complexity: C_INSERT_AT,
    outcome: 'success',
    summary: `${quote(novo.value)} foi inserido na posição ${index}, após percorrer ${result.visited.length} ${result.visited.length === 1 ? 'nó' : 'nós'}.`,
    pseudocode: pseudo,
  });
}

// ---------------------------------------------------------------------------
// deleteHead
// ---------------------------------------------------------------------------

export function planDeleteHead(state: LinkedListState): ListTrace {
  const builder = createListTrace();
  const label = 'deleteHead()';
  const duplamente = isDoubly(state);
  const pseudo = pseudoDeleteHead(state.variant);

  builder.add({
    title: 'Verifica se a lista está vazia',
    description:
      'Antes de remover, confere-se o ponteiro de cabeça: numa lista vazia ele vale NULL e não há nó algum para remover.',
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'head', role: 'inspected' }],
    codeLine: 1,
  });

  const result = deleteHead(state);

  if (!result.ok) {
    builder.add({
      title: 'A lista está vazia',
      description:
        'A cabeça vale NULL: não há nós para remover. A operação é cancelada. Insira algo com insertHead() ou insertTail() antes de tentar novamente.',
      snapshot: still(state),
      highlights: [{ kind: 'pointer', pointer: 'head', role: 'target' }],
      codeLine: 1,
      tone: 'error',
    });

    return builder.build({
      label,
      complexity: C_DELETE_HEAD,
      outcome: 'error',
      summary: 'A lista está vazia: não há cabeça para remover.',
      pseudocode: pseudo,
    });
  }

  const removido = result.node;
  const novaCabeca = removido.next;

  builder.add({
    title: 'Guarda a referência ao nó removido',
    description: `A cabeça aponta para o nó de valor ${quote(removido.value)}. Guarda-se uma referência a ele antes de mover o ponteiro — caso contrário o nó ficaria inalcançável e não poderia ser liberado.`,
    snapshot: still(state),
    highlights: [{ kind: 'node', id: removido.id, role: 'leaving' }],
    codeLine: 2,
    counts: { visits: 1 },
  });

  builder.add({
    title: 'Avança o ponteiro de cabeça',
    description:
      novaCabeca === null
        ? 'O next do nó removido é NULL, ou seja, ele era o único da lista. A cabeça passa a valer NULL.'
        : `A cabeça passa a apontar para ${nodeLabel(state, novaCabeca)}, que era o segundo nó e agora é o primeiro.`,
    snapshot: { state: result.state, floating: { item: removido, phase: 'leaving' } },
    highlights: [
      { kind: 'pointer', pointer: 'head', role: 'anchor' },
      { kind: 'floating', role: 'leaving' },
    ],
    codeLine: 3,
    counts: { moves: novaCabeca === null ? 2 : 1 },
  });

  if (duplamente && novaCabeca !== null) {
    builder.add({
      title: 'Zera o prev da nova cabeça',
      description: `Na lista ${variantName(state.variant)}, a nova cabeça não tem antecessor: o ponteiro prev de ${nodeLabel(result.state, novaCabeca)} recebe NULL.`,
      snapshot: still(result.state),
      highlights: [
        { kind: 'node', id: novaCabeca, role: 'inspected' },
        { kind: 'link', from: novaCabeca, direction: 'prev', role: 'target' },
      ],
      codeLine: 4,
      counts: { moves: 1 },
    });
  }

  builder.add({
    title: 'Libera o nó removido',
    description:
      novaCabeca === null
        ? 'A lista ficou vazia: cabeça e cauda valem NULL. A memória do nó removido é liberada.'
        : `A memória do nó ${quote(removido.value)} é liberada. A lista agora tem ${sizeOf(result.state)}.`,
    snapshot: still(result.state),
    highlights: [{ kind: 'pointer', pointer: 'head', role: 'anchor' }],
    codeLine: duplamente ? 6 : 5,
    tone: 'success',
  });

  return builder.build({
    label,
    complexity: C_DELETE_HEAD,
    outcome: 'success',
    summary: `${quote(removido.value)} foi removido da cabeça da lista.`,
    pseudocode: pseudo,
  });
}

// ---------------------------------------------------------------------------
// deleteTail
// ---------------------------------------------------------------------------

export function planDeleteTail(state: LinkedListState): ListTrace {
  const builder = createListTrace();
  const label = 'deleteTail()';
  const duplamente = isDoubly(state);
  const pseudo = pseudoDeleteTail(state.variant);
  const complexidade = duplamente ? C_DELETE_TAIL_DOUBLY : C_DELETE_TAIL_SINGLY;

  builder.add({
    title: 'Verifica se a lista está vazia',
    description:
      'Antes de remover, confere-se o ponteiro de cauda: numa lista vazia ele vale NULL.',
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'tail', role: 'inspected' }],
    codeLine: 1,
  });

  const result = deleteTail(state);

  if (!result.ok) {
    builder.add({
      title: 'A lista está vazia',
      description:
        'A cauda vale NULL: não há nós para remover. A operação é cancelada e a lista permanece vazia.',
      snapshot: still(state),
      highlights: [{ kind: 'pointer', pointer: 'tail', role: 'target' }],
      codeLine: 1,
      tone: 'error',
    });

    return builder.build({
      label,
      complexity: complexidade,
      outcome: 'error',
      summary: 'A lista está vazia: não há cauda para remover.',
      pseudocode: pseudo,
    });
  }

  const removido = result.node;
  const unicoNo = state.size === 1;

  builder.add({
    title: 'Guarda a referência ao nó removido',
    description: `A cauda aponta para o nó de valor ${quote(removido.value)}, que é o último da lista (seu next é NULL).`,
    snapshot: still(state),
    highlights: [{ kind: 'node', id: removido.id, role: 'leaving' }],
    codeLine: 2,
    counts: { visits: 1 },
  });

  if (unicoNo) {
    builder.add({
      title: 'A lista tinha um único nó',
      description:
        'Como não há antecessor, cabeça e cauda passam a valer NULL de uma vez: a lista fica vazia.',
      snapshot: still(result.state),
      highlights: [
        { kind: 'pointer', pointer: 'head', role: 'anchor' },
        { kind: 'pointer', pointer: 'tail', role: 'anchor' },
      ],
      codeLine: duplamente ? 4 : 5,
      tone: 'success',
      counts: { moves: 2 },
    });

    return builder.build({
      label,
      complexity: complexidade,
      outcome: 'success',
      summary: `${quote(removido.value)} era o único nó: a lista ficou vazia.`,
      pseudocode: pseudo,
    });
  }

  const anteriorId = duplamente
    ? removido.prev
    : (result.visited[result.visited.length - 1] ?? null);

  if (duplamente) {
    builder.add({
      title: 'Chega ao nó anterior pelo ponteiro prev',
      description: `Numa lista ${variantName(state.variant)}, o prev da cauda aponta diretamente para ${nodeLabel(state, anteriorId)}. Um único acesso — é isso que torna esta operação O(1).`,
      snapshot: still(state),
      highlights: [
        { kind: 'link', from: removido.id, direction: 'prev', role: 'inspected' },
        ...(anteriorId !== null
          ? ([{ kind: 'node', id: anteriorId, role: 'target' }] as const)
          : []),
      ],
      codeLine: 3,
      // Uma única visita, contra as n−1 do percurso da lista simples: é o
      // contraste que o contador torna visível.
      counts: { visits: 1 },
    });
  } else {
    addWalkSteps({
      builder,
      state,
      visited: result.visited,
      codeLine: 4,
      goal: 'É ele quem aponta para a cauda, então será a nova cauda da lista.',
    });
  }

  builder.add({
    title: 'Desliga o nó anterior da cauda',
    description: `O ponteiro next de ${nodeLabel(state, anteriorId)} passa de ${quote(removido.value)} para NULL, marcando o novo fim da lista.`,
    snapshot: { state: result.state, floating: { item: removido, phase: 'leaving' } },
    highlights: [
      ...(anteriorId !== null
        ? ([{ kind: 'link', from: anteriorId, direction: 'next', role: 'target' }] as const)
        : []),
      { kind: 'floating', role: 'leaving' },
    ],
    codeLine: duplamente ? 4 : 5,
    counts: { moves: 1 },
  });

  builder.add({
    title: 'Atualiza o ponteiro de cauda',
    description: `A cauda passa a apontar para ${nodeLabel(result.state, anteriorId)} e a memória do nó removido é liberada. A lista agora tem ${sizeOf(result.state)}.`,
    snapshot: still(result.state),
    highlights: [
      { kind: 'pointer', pointer: 'tail', role: 'anchor' },
      ...(anteriorId !== null
        ? ([{ kind: 'node', id: anteriorId, role: 'anchor' }] as const)
        : []),
    ],
    codeLine: 5,
    tone: 'success',
    counts: { moves: 1 },
  });

  return builder.build({
    label,
    complexity: complexidade,
    outcome: 'success',
    summary: duplamente
      ? `${quote(removido.value)} foi removido da cauda, alcançada em O(1) pelo ponteiro prev.`
      : `${quote(removido.value)} foi removido da cauda, após percorrer ${result.visited.length} ${result.visited.length === 1 ? 'nó' : 'nós'} para achar o antecessor.`,
    pseudocode: pseudo,
  });
}

// ---------------------------------------------------------------------------
// deleteAt
// ---------------------------------------------------------------------------

export function planDeleteAt(state: LinkedListState, index: number): ListTrace {
  const label = `deleteAt(${index})`;
  const pseudo = pseudoDeleteAt(state.variant);

  // Índice 0 é, por definição, a remoção da cabeça.
  if (index === 0 && !isEmpty(state)) {
    const trace = planDeleteHead(state);
    return { ...trace, label, complexity: C_DELETE_AT, pseudocode: pseudo };
  }

  const builder = createListTrace();
  const duplamente = isDoubly(state);

  builder.add({
    title: 'Valida a lista e o índice',
    description: isEmpty(state)
      ? 'A lista está vazia: não há nó em posição alguma para remover.'
      : `A lista tem ${sizeOf(state)}, então os índices válidos para remoção vão de 0 a ${state.size - 1}. O índice pedido é ${index}.`,
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'head', role: 'inspected' }],
    codeLine: 1,
  });

  const result = deleteAt(state, index);

  if (!result.ok) {
    const vazia = result.error === 'EMPTY';
    builder.add({
      title: vazia ? 'A lista está vazia' : 'Índice fora do intervalo',
      description: vazia
        ? 'Não há nós para remover. A operação é cancelada e a lista permanece vazia.'
        : `O índice ${index} não existe nesta lista: as posições válidas vão de 0 a ${state.size - 1}. A operação é cancelada e a lista permanece inalterada.`,
      snapshot: still(state),
      highlights: [],
      codeLine: 1,
      tone: 'error',
    });

    return builder.build({
      label,
      complexity: C_DELETE_AT,
      outcome: 'error',
      summary: vazia
        ? 'A lista está vazia: não há nó para remover.'
        : `Índice ${index} inválido: a lista tem posições de 0 a ${state.size - 1}.`,
      pseudocode: pseudo,
    });
  }

  addWalkSteps({
    builder,
    state,
    visited: result.visited,
    codeLine: 4,
    goal: `É ele quem aponta para o nó da posição ${index}, que será removido.`,
  });

  const removido = result.node;
  const anteriorId = result.visited[result.visited.length - 1] ?? null;
  const seguinteId = removido.next;

  builder.add({
    title: 'Identifica o nó a remover',
    description: `O next do nó anterior leva ao nó da posição ${index}, de valor ${quote(removido.value)}. É ele que sai da lista.`,
    snapshot: still(state),
    highlights: [{ kind: 'node', id: removido.id, role: 'leaving' }],
    codeLine: 5,
    counts: { visits: 1 },
  });

  builder.add({
    title: 'Religa o nó anterior ao seguinte',
    description: `O ponteiro next de ${nodeLabel(state, anteriorId)} passa a apontar para ${nodeLabel(state, seguinteId)}, saltando o nó removido. A lista volta a ficar contínua.`,
    snapshot: { state: result.state, floating: { item: removido, phase: 'leaving' } },
    highlights: [
      ...(anteriorId !== null
        ? ([{ kind: 'link', from: anteriorId, direction: 'next', role: 'target' }] as const)
        : []),
      { kind: 'floating', role: 'leaving' },
    ],
    codeLine: 6,
    counts: { moves: 1 },
  });

  if (duplamente && seguinteId !== null) {
    builder.add({
      title: 'Religa o prev do nó seguinte',
      description: `Na lista ${variantName(state.variant)} a ligação é recíproca: o prev de ${nodeLabel(result.state, seguinteId)} passa a apontar para ${nodeLabel(result.state, anteriorId)}.`,
      snapshot: still(result.state),
      highlights: [
        { kind: 'node', id: seguinteId, role: 'inspected' },
        { kind: 'link', from: seguinteId, direction: 'prev', role: 'target' },
      ],
      codeLine: 7,
      counts: { moves: 1 },
    });
  }

  builder.add({
    title: 'Libera o nó removido',
    description: `A memória do nó ${quote(removido.value)} é liberada. A lista agora tem ${sizeOf(result.state)}.`,
    snapshot: still(result.state),
    highlights: anteriorId !== null ? [{ kind: 'node', id: anteriorId, role: 'anchor' }] : [],
    codeLine: duplamente ? 8 : 7,
    tone: 'success',
  });

  return builder.build({
    label,
    complexity: C_DELETE_AT,
    outcome: 'success',
    summary: `${quote(removido.value)} foi removido da posição ${index}, após percorrer ${result.visited.length} ${result.visited.length === 1 ? 'nó' : 'nós'}.`,
    pseudocode: pseudo,
  });
}

// ---------------------------------------------------------------------------
// search
// ---------------------------------------------------------------------------

export function planSearch(state: LinkedListState, value: string): ListTrace {
  const builder = createListTrace();
  const label = `search(${value})`;
  const total = state.size;

  if (isEmpty(state)) {
    builder.add({
      title: 'A lista está vazia',
      description: `A cabeça vale NULL, então o percurso termina antes de começar: não há nó algum para comparar com ${quote(value)}.`,
      snapshot: still(state),
      highlights: [{ kind: 'pointer', pointer: 'head', role: 'target' }],
      codeLine: 1,
      tone: 'error',
    });

    return builder.build({
      label,
      complexity: C_SEARCH,
      outcome: 'error',
      summary: `A lista está vazia: ${quote(value)} não foi encontrado.`,
      pseudocode: PSEUDO_SEARCH,
    });
  }

  builder.add({
    title: 'Começa o percurso pela cabeça',
    description: `A busca numa lista ligada só pode começar pela cabeça: não há acesso indexado. Um ponteiro auxiliar é posicionado nela e a lista será percorrida nó a nó até encontrar ${quote(value)} ou chegar a NULL.`,
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'head', role: 'inspected' }],
    codeLine: 1,
  });

  const result = search(state, value);
  const ids = nodeIds(state);

  result.visited.forEach((id, posicao) => {
    const node = getNode(state, id);
    if (node === null) return;
    const encontrado = id === result.foundId;
    const proximo = ids[posicao + 1];

    builder.add({
      title: encontrado
        ? `Nó da posição ${posicao}: valor encontrado`
        : `Compara o nó da posição ${posicao}`,
      description: encontrado
        ? `O nó da posição ${posicao} guarda ${quote(node.value)}, igual ao valor procurado. A busca termina aqui — não é preciso percorrer o resto da lista.`
        : `O nó da posição ${posicao} guarda ${quote(node.value)}, diferente de ${quote(value)}. ${
            proximo === undefined
              ? 'Este era o último nó e seu next é NULL, então o percurso chegou ao fim.'
              : 'O ponteiro auxiliar avança pelo next para o nó seguinte.'
          }`,
      snapshot: still(state),
      highlights: [
        { kind: 'node', id, role: encontrado ? 'found' : 'inspected' },
        ...(encontrado || proximo === undefined
          ? []
          : ([{ kind: 'link', from: id, direction: 'next', role: 'inspected' }] as const)),
      ],
      // Cada nó do percurso custa uma visita e uma comparação de valor — é a
      // única operação do simulador que compara chaves, e a soma é exatamente
      // o n da complexidade O(n).
      counts: { visits: 1, comparisons: 1 },
      codeLine: encontrado ? 3 : 4,
      tone: encontrado ? 'success' : 'info',
    });
  });

  if (result.foundId === null) {
    builder.add({
      title: 'Valor não encontrado',
      description: `O percurso chegou ao NULL depois de comparar todos os ${total} ${total === 1 ? 'nó' : 'nós'}, e nenhum deles guarda ${quote(value)}. Numa lista ligada esse é o pior caso da busca: percorrer a estrutura inteira sem sucesso.`,
      snapshot: still(state),
      highlights: state.tail !== null
        ? [{ kind: 'link', from: state.tail, direction: 'next', role: 'target' }]
        : [],
      codeLine: 5,
      tone: 'error',
    });

    return builder.build({
      label,
      complexity: C_SEARCH,
      outcome: 'error',
      summary: `${quote(value)} não encontrado: os ${total} ${total === 1 ? 'nó foi comparado' : 'nós foram comparados'} sem sucesso.`,
      pseudocode: PSEUDO_SEARCH,
    });
  }

  return builder.build({
    label,
    complexity: C_SEARCH,
    outcome: 'success',
    summary: `${quote(value)} encontrado na posição ${result.foundIndex}, após comparar ${result.visited.length} ${result.visited.length === 1 ? 'nó' : 'nós'}.`,
    pseudocode: PSEUDO_SEARCH,
  });
}
