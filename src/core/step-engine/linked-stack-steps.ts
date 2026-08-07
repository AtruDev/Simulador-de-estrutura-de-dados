/**
 * Planejadores de passos da **pilha encadeada** (alocação dinâmica).
 *
 * A narração é escrita para ser comparada com a da pilha em vetor. Onde aquela
 * fala em "gravar na posição i do array" e "atualizar o índice do topo", esta
 * fala em "alocar um nó" e "religar o ponteiro de topo" — mesmo TAD, mesmas
 * complexidades, custos de implementação diferentes.
 *
 * Dois pontos que a comparação deve deixar claros:
 *
 * 1. **Não há passo de verificação de espaço.** Sem capacidade fixa não existe
 *    overflow: nenhuma operação de inserção pode falhar aqui.
 * 2. **`push` religa dois ponteiros**, contra a única gravação da versão em
 *    vetor. Os dois continuam O(1) — o custo extra é constante —, e é o
 *    contador que mostra a diferença sem contradizer o Big-O.
 */

import {
  type LinkedStackState,
  isEmpty,
  peek,
  pop,
  push,
  topNode,
} from '../data-structures/linked-stack';
import type { NewNode } from '../data-structures/linked-list';
import type { NonEmptyArray, Pseudocode } from '../../types/step';
import type { ListHighlight, ListSnapshot, ListTrace } from '../../types/structures';
import { type TraceBuilder, complexity, createTraceBuilder, quote } from './trace-builder';

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

function createStackTrace(): TraceBuilder<ListSnapshot, ListHighlight> {
  return createTraceBuilder<ListSnapshot, ListHighlight>();
}

function still(state: LinkedStackState): ListSnapshot {
  return { state, floating: null };
}

function sizeOf(state: LinkedStackState): string {
  return `${state.size} ${state.size === 1 ? 'nó' : 'nós'}`;
}

function pseudocode(title: string, lines: readonly string[]): Pseudocode {
  const [first, ...rest] = lines;
  const safe: NonEmptyArray<string> = first === undefined ? [title] : [first, ...rest];
  return { title, lines: safe };
}

// ---------------------------------------------------------------------------
// Complexidades e pseudocódigo
// ---------------------------------------------------------------------------

const C_PUSH = complexity(
  'O(1)',
  'A inserção acontece sempre no topo, que é a cabeça da lista: aloca-se um nó e religam-se dois ponteiros. Nada depende do tamanho da pilha — e, sem capacidade fixa, não há sequer o teste de espaço da versão em vetor.',
);

const C_POP = complexity(
  'O(1)',
  'A remoção também é no topo: o ponteiro de topo avança para o segundo nó e o antigo é liberado. Nenhum percurso, independentemente do tamanho da pilha.',
);

const C_PEEK = complexity(
  'O(1)',
  'Consultar o topo é seguir um único ponteiro. Nada é alocado, liberado ou religado.',
);

const C_TESTE = complexity(
  'O(1)',
  'Basta comparar o ponteiro de topo com NULL. Não há contador de capacidade a consultar: a pilha encadeada não tem estado de "cheia".',
);

const PSEUDO_PUSH = pseudocode('push(valor)', [
  'push(v):',
  '  novo ← aloca_nó(v)',
  '  novo.next ← topo',
  '  topo ← novo',
  '  tamanho ← tamanho + 1',
]);

const PSEUDO_POP = pseudocode('pop()', [
  'pop():',
  '  se topo = NULL então',
  '    erro "underflow"',
  '  removido ← topo',
  '  topo ← topo.next',
  '  libera(removido)',
  '  tamanho ← tamanho - 1',
]);

const PSEUDO_PEEK = pseudocode('peek()', [
  'peek():',
  '  se topo = NULL então',
  '    erro "pilha vazia"',
  '  devolve topo.valor',
]);

const PSEUDO_IS_EMPTY = pseudocode('isEmpty()', ['isEmpty():', '  devolve topo = NULL']);

// ---------------------------------------------------------------------------
// push
// ---------------------------------------------------------------------------

export function planPush(state: LinkedStackState, novo: NewNode): ListTrace {
  const builder = createStackTrace();
  const label = `push(${novo.value})`;
  const topoAntigo = topNode(state);
  const pilhaVazia = isEmpty(state);

  const result = push(state, novo);
  // Invariante da alocação dinâmica: empilhar nunca falha.
  if (!result.ok) throw new Error('push numa pilha encadeada não deveria falhar');

  const node = result.node;

  builder.add({
    title: 'Aloca o novo nó',
    description: `Um nó com o valor ${quote(novo.value)} é alocado. Aqui não existe verificação de espaço: cada nó é pedido à memória individualmente, então a pilha encadeada não tem capacidade máxima e nunca sofre overflow.`,
    snapshot: { state, floating: { item: node, phase: 'entering' } },
    highlights: [{ kind: 'floating', role: 'entering' }],
    codeLine: 1,
  });

  builder.add({
    title: 'Liga o next do novo nó ao topo atual',
    description: pilhaVazia
      ? 'A pilha está vazia, então o topo vale NULL e o next do novo nó também recebe NULL — ele será o único nó, e o fundo da pilha é justamente quem aponta para NULL.'
      : `O next do novo nó passa a apontar para ${quote(topoAntigo?.value ?? '')}, que era o topo. A ordem importa: se o ponteiro de topo fosse movido primeiro, o resto da pilha ficaria inalcançável.`,
    snapshot: still(result.state),
    highlights: [
      { kind: 'node', id: node.id, role: 'entering' },
      { kind: 'link', from: node.id, direction: 'next', role: 'target' },
    ],
    codeLine: 2,
    counts: { moves: 1 },
  });

  builder.add({
    title: 'Atualiza o ponteiro de topo',
    description: `O topo passa a apontar para o novo nó. A pilha agora tem ${sizeOf(result.state)} e ${quote(novo.value)}, por ser o último a entrar, será o primeiro a sair (LIFO). Note que nenhuma posição foi calculada: não há índice, só ponteiros.`,
    snapshot: still(result.state),
    highlights: [
      { kind: 'pointer', pointer: 'head', role: 'anchor' },
      { kind: 'node', id: node.id, role: 'anchor' },
    ],
    codeLine: 3,
    tone: 'success',
    counts: { moves: 1 },
  });

  return builder.build({
    label,
    complexity: C_PUSH,
    outcome: 'success',
    summary: `${quote(novo.value)} foi empilhado: um nó alocado e dois ponteiros religados.`,
    pseudocode: PSEUDO_PUSH,
  });
}

// ---------------------------------------------------------------------------
// pop
// ---------------------------------------------------------------------------

export function planPop(state: LinkedStackState): ListTrace {
  const builder = createStackTrace();
  const label = 'pop()';

  builder.add({
    title: 'Verifica se a pilha está vazia',
    description:
      'Antes de remover, confere-se o ponteiro de topo: numa pilha encadeada vazia ele vale NULL. Repare que o teste é sobre um ponteiro, não sobre um índice.',
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'head', role: 'inspected' }],
    codeLine: 1,
  });

  const result = pop(state);

  if (!result.ok) {
    builder.add({
      title: 'Underflow: a pilha está vazia',
      description:
        'O topo vale NULL: não há nó algum para desempilhar. A operação é cancelada e a pilha continua vazia. Empilhe algo com push() antes de tentar novamente.',
      snapshot: still(state),
      highlights: [{ kind: 'pointer', pointer: 'head', role: 'target' }],
      codeLine: 2,
      tone: 'error',
    });

    return builder.build({
      label,
      complexity: C_POP,
      outcome: 'error',
      summary: 'Underflow: não há elementos para desempilhar.',
      pseudocode: PSEUDO_POP,
    });
  }

  const removido = result.node;
  const novoTopo = removido.next;

  builder.add({
    title: 'Guarda a referência ao nó do topo',
    description: `O topo aponta para o nó de valor ${quote(removido.value)}. Guarda-se uma referência a ele antes de mover o ponteiro — sem isso o nó ficaria inalcançável e sua memória não poderia ser liberada.`,
    snapshot: still(state),
    highlights: [{ kind: 'node', id: removido.id, role: 'leaving' }],
    codeLine: 3,
    counts: { visits: 1 },
  });

  builder.add({
    title: 'Avança o topo para o próximo nó',
    description:
      novoTopo === null
        ? 'O next do nó removido é NULL, ou seja, ele era o único da pilha. O topo passa a valer NULL e a pilha fica vazia.'
        : `O topo passa a apontar para o nó seguinte, de valor ${quote(result.state.nodes[novoTopo]?.value ?? '')}, que volta a ser o topo da pilha.`,
    snapshot: { state: result.state, floating: { item: removido, phase: 'leaving' } },
    highlights: [
      { kind: 'pointer', pointer: 'head', role: 'anchor' },
      { kind: 'floating', role: 'leaving' },
    ],
    codeLine: 4,
    counts: { moves: 1 },
  });

  builder.add({
    title: 'Libera o nó removido',
    description: `A memória do nó ${quote(removido.value)} é devolvida. A pilha agora tem ${sizeOf(result.state)}. Na pilha em vetor não há nada a liberar: a posição continua existindo, apenas deixa de ser considerada — é a diferença entre reaproveitar espaço já reservado e devolvê-lo.`,
    snapshot: still(result.state),
    highlights: [{ kind: 'pointer', pointer: 'head', role: 'anchor' }],
    codeLine: 5,
    tone: 'success',
  });

  return builder.build({
    label,
    complexity: C_POP,
    outcome: 'success',
    summary: `${quote(removido.value)} foi desempilhado e sua memória, liberada.`,
    pseudocode: PSEUDO_POP,
  });
}

// ---------------------------------------------------------------------------
// peek
// ---------------------------------------------------------------------------

export function planPeek(state: LinkedStackState): ListTrace {
  const builder = createStackTrace();
  const label = 'peek()';

  builder.add({
    title: 'Verifica se a pilha está vazia',
    description:
      'Para consultar o topo é preciso que o ponteiro de topo não seja NULL.',
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'head', role: 'inspected' }],
    codeLine: 1,
  });

  const result = peek(state);

  if (!result.ok) {
    builder.add({
      title: 'A pilha está vazia',
      description:
        'O topo vale NULL: não há nó para consultar. A operação é cancelada e nada é alterado.',
      snapshot: still(state),
      highlights: [{ kind: 'pointer', pointer: 'head', role: 'target' }],
      codeLine: 2,
      tone: 'error',
    });

    return builder.build({
      label,
      complexity: C_PEEK,
      outcome: 'error',
      summary: 'A pilha está vazia, não há topo para consultar.',
      pseudocode: PSEUDO_PEEK,
    });
  }

  builder.add({
    title: 'Lê o valor do nó do topo',
    description: `O topo guarda ${quote(result.node.value)}. A operação apenas lê esse valor: nenhum nó é alocado, liberado ou religado, e o ponteiro de topo não se move.`,
    snapshot: still(state),
    highlights: [{ kind: 'node', id: result.node.id, role: 'inspected' }],
    codeLine: 3,
    tone: 'success',
    counts: { visits: 1 },
  });

  return builder.build({
    label,
    complexity: C_PEEK,
    outcome: 'success',
    summary: `O topo da pilha é ${quote(result.node.value)}. Nada foi removido.`,
    pseudocode: PSEUDO_PEEK,
  });
}

// ---------------------------------------------------------------------------
// isEmpty
// ---------------------------------------------------------------------------

export function planIsEmpty(state: LinkedStackState): ListTrace {
  const builder = createStackTrace();
  const vazia = isEmpty(state);

  builder.add({
    title: 'Compara o ponteiro de topo com NULL',
    description:
      'O teste não percorre a estrutura: basta olhar para onde o ponteiro de topo aponta.',
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'head', role: 'inspected' }],
    codeLine: 1,
  });

  builder.add({
    title: vazia ? 'A pilha está vazia' : 'A pilha não está vazia',
    description: vazia
      ? 'O topo vale NULL, logo isEmpty() devolve verdadeiro. pop() e peek() ficam indisponíveis neste estado.'
      : `O topo aponta para um nó, logo isEmpty() devolve falso. A pilha guarda ${sizeOf(state)}. Não existe isFull() aqui: a pilha encadeada não tem capacidade máxima.`,
    snapshot: still(state),
    highlights: vazia
      ? []
      : [{ kind: 'node', id: state.head ?? '', role: 'inspected' }],
    codeLine: 1,
    tone: 'success',
  });

  return builder.build({
    label: 'isEmpty()',
    complexity: C_TESTE,
    outcome: 'success',
    summary: `isEmpty() = ${vazia ? 'verdadeiro' : 'falso'} (${sizeOf(state)}).`,
    pseudocode: PSEUDO_IS_EMPTY,
  });
}
