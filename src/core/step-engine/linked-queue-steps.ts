/**
 * Planejadores de passos da **fila encadeada** (alocação dinâmica).
 *
 * A narração é escrita para ser comparada com a da fila em vetor circular. Três
 * contrastes que a aula deve explorar:
 *
 * 1. **Nada dá a volta.** Não há aritmética modular nem posições reaproveitadas:
 *    cada nó é alocado quando entra e liberado quando sai.
 * 2. **Não há `isFull` nem contador de capacidade.** O contador `total` da fila
 *    circular existe para desempatar fila vazia de cheia; aqui basta comparar o
 *    ponteiro de início com NULL.
 * 3. **O ponteiro de fim é o que mantém `enqueue` em O(1).** Sem ele seria
 *    preciso percorrer a lista inteira até a cauda a cada inserção.
 */

import {
  type LinkedQueueState,
  dequeue,
  enqueue,
  isEmpty,
  peek,
  rearNode,
} from '../data-structures/linked-queue';
import type { NewNode } from '../data-structures/linked-list';
import type { ListHighlight, ListSnapshot, ListTrace } from '../../types/structures';
import {
  type TraceBuilder,
  complexity,
  createTraceBuilder,
  pseudocodigo,
  quote,
} from './trace-builder';

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

function createQueueTrace(): TraceBuilder<ListSnapshot, ListHighlight> {
  return createTraceBuilder<ListSnapshot, ListHighlight>();
}

function still(state: LinkedQueueState): ListSnapshot {
  return { state, floating: null };
}

function sizeOf(state: LinkedQueueState): string {
  return `${state.size} ${state.size === 1 ? 'nó' : 'nós'}`;
}

// ---------------------------------------------------------------------------
// Complexidades e pseudocódigo
// ---------------------------------------------------------------------------

const C_ENQUEUE = complexity(
  'O(1)',
  'A inserção é no fim, alcançado diretamente pelo ponteiro de fim — sem ele, seria preciso percorrer a fila inteira e a operação seria O(n). Não há teste de capacidade: a fila encadeada não fica cheia.',
);

const C_DEQUEUE = complexity(
  'O(1)',
  'A remoção é no início, para onde o ponteiro de início já aponta. Nada é deslocado e nenhum índice precisa dar a volta: o nó sai e sua memória é liberada.',
);

const C_PEEK = complexity(
  'O(1)',
  'Consultar quem será atendido é seguir o ponteiro de início. Nada muda na fila.',
);

const C_TESTE = complexity(
  'O(1)',
  'Basta comparar o ponteiro de início com NULL. Diferente da fila circular, não é preciso um contador para desempatar vazia de cheia — a fila encadeada não tem estado de cheia.',
);

const ENQUEUE = pseudocodigo('enqueue(valor)', [
  'enqueue(valor):',
  ['aloca', '  novo ← aloca nó com valor;'],
  ['terminaNext', '  novo.next ← NULL;'],
  ['testeVazia', '  se inicio = NULL então'],
  ['primeiroNo', '    inicio ← novo;'],
  '  senão',
  ['ligaFim', '    fim.next ← novo;'],
  '  fim se',
  ['avancaFim', '  fim ← novo;'],
  ['incrementaTamanho', '  tamanho ← tamanho + 1;'],
]);

const DEQUEUE = pseudocodigo('dequeue()', [
  'dequeue():',
  ['testeVazia', '  se inicio = NULL então'],
  ['underflow', '    erro: underflow — a fila está vazia;'],
  '  fim se',
  ['guarda', '  removido ← inicio;'],
  ['avancaInicio', '  inicio ← inicio.next;'],
  '  se inicio = NULL então',
  ['zeraFim', '    fim ← NULL;'],
  '  fim se',
  ['libera', '  libera removido;'],
  ['decrementaTamanho', '  tamanho ← tamanho - 1;'],
  ['retorna', '  retorna removido.valor;'],
]);

const PEEK = pseudocodigo('peek()', [
  'peek():',
  ['testeVazia', '  se inicio = NULL então'],
  ['vazia', '    erro: a fila está vazia;'],
  '  fim se',
  ['retorna', '  retorna inicio.valor;       // não move os ponteiros'],
]);

const IS_EMPTY = pseudocodigo('isEmpty()', [
  'isEmpty():',
  ['retorna', '  retorna (inicio = NULL);'],
]);

// ---------------------------------------------------------------------------
// enqueue
// ---------------------------------------------------------------------------

export function planEnqueue(state: LinkedQueueState, novo: NewNode): ListTrace {
  const builder = createQueueTrace();
  const label = `enqueue(${novo.value})`;
  const filaVazia = isEmpty(state);
  const fimAntigo = rearNode(state);

  const result = enqueue(state, novo);
  // Invariante da alocação dinâmica: enfileirar nunca falha.
  if (!result.ok) throw new Error('enqueue numa fila encadeada não deveria falhar');

  const node = result.node;

  builder.add({
    title: 'Aloca o novo nó',
    description: `Um nó com o valor ${quote(novo.value)} é alocado, com o next em NULL — ele será o último da fila, e NULL é o que marca esse fim. Não há verificação de espaço: a fila encadeada não tem capacidade máxima.`,
    snapshot: { state, floating: { item: node, phase: 'entering' } },
    highlights: [{ kind: 'floating', role: 'entering' }],
    codeLine: ENQUEUE.em.aloca,
  });

  if (filaVazia) {
    builder.add({
      title: 'A fila estava vazia: início e fim apontam para o novo nó',
      description:
        'Como não havia nenhum nó, o novo é ao mesmo tempo o primeiro e o último: os dois ponteiros passam a apontar para ele. Nenhum next precisou ser religado.',
      snapshot: still(result.state),
      highlights: [
        { kind: 'node', id: node.id, role: 'entering' },
        { kind: 'pointer', pointer: 'head', role: 'anchor' },
        { kind: 'pointer', pointer: 'tail', role: 'anchor' },
      ],
      codeLine: ENQUEUE.em.primeiroNo,
      tone: 'success',
      counts: { moves: 2 },
    });

    return builder.build({
      label,
      complexity: C_ENQUEUE,
      outcome: 'success',
      summary: `${quote(novo.value)} entrou numa fila vazia: virou início e fim.`,
      pseudocode: ENQUEUE.code,
    });
  }

  builder.add({
    title: 'Liga o next do último nó ao novo',
    description: `O ponteiro de fim leva direto a ${quote(fimAntigo?.value ?? '')}, que era o último da fila, sem percorrer nada. O next dele deixa de ser NULL e passa a apontar para o novo nó. É esse atalho que mantém a operação em O(1).`,
    snapshot: still(result.state),
    highlights: [
      ...(fimAntigo !== null
        ? ([
            { kind: 'node', id: fimAntigo.id, role: 'inspected' },
            { kind: 'link', from: fimAntigo.id, direction: 'next', role: 'target' },
          ] as const)
        : []),
      { kind: 'node', id: node.id, role: 'entering' },
    ],
    codeLine: ENQUEUE.em.ligaFim,
    counts: { visits: 1, moves: 1 },
  });

  builder.add({
    title: 'Avança o ponteiro de fim',
    description: `O fim passa a apontar para o novo nó, cujo next é NULL. A fila agora tem ${sizeOf(result.state)} e ${quote(novo.value)} só sairá depois de todos os que já estavam nela (FIFO).`,
    snapshot: still(result.state),
    highlights: [
      { kind: 'pointer', pointer: 'tail', role: 'anchor' },
      { kind: 'node', id: node.id, role: 'anchor' },
    ],
    codeLine: ENQUEUE.em.avancaFim,
    tone: 'success',
    counts: { moves: 1 },
  });

  return builder.build({
    label,
    complexity: C_ENQUEUE,
    outcome: 'success',
    summary: `${quote(novo.value)} entrou no fim da fila, alcançado em O(1) pelo ponteiro de fim.`,
    pseudocode: ENQUEUE.code,
  });
}

// ---------------------------------------------------------------------------
// dequeue
// ---------------------------------------------------------------------------

export function planDequeue(state: LinkedQueueState): ListTrace {
  const builder = createQueueTrace();
  const label = 'dequeue()';

  builder.add({
    title: 'Verifica se a fila está vazia',
    description:
      'Antes de remover, confere-se o ponteiro de início: numa fila encadeada vazia ele vale NULL. Não é preciso contador algum — na fila circular ele existia só para desempatar vazia de cheia.',
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'head', role: 'inspected' }],
    codeLine: DEQUEUE.em.testeVazia,
  });

  const result = dequeue(state);

  if (!result.ok) {
    builder.add({
      title: 'Underflow: a fila está vazia',
      description:
        'O início vale NULL: não há ninguém na fila para ser atendido. A operação é cancelada. Enfileire algo com enqueue() antes de tentar novamente.',
      snapshot: still(state),
      highlights: [{ kind: 'pointer', pointer: 'head', role: 'target' }],
      codeLine: DEQUEUE.em.underflow,
      tone: 'error',
    });

    return builder.build({
      label,
      complexity: C_DEQUEUE,
      outcome: 'error',
      summary: 'Underflow: não há elementos para desenfileirar.',
      pseudocode: DEQUEUE.code,
    });
  }

  const removido = result.node;
  const novoInicio = removido.next;

  builder.add({
    title: 'Guarda a referência ao primeiro nó',
    description: `O início aponta para ${quote(removido.value)}, o primeiro que entrou e, por isso, o primeiro a sair. Guarda-se a referência antes de mover o ponteiro, para poder liberar a memória depois.`,
    snapshot: still(state),
    highlights: [{ kind: 'node', id: removido.id, role: 'leaving' }],
    codeLine: DEQUEUE.em.guarda,
    counts: { visits: 1 },
  });

  builder.add({
    title: 'Avança o ponteiro de início',
    description:
      novoInicio === null
        ? 'O next do nó removido é NULL: ele era o único da fila. O início passa a valer NULL e, como não há mais último, o ponteiro de fim também precisa ser zerado — esquecer esse detalhe deixaria o fim apontando para memória liberada.'
        : `O início passa a apontar para ${quote(result.state.nodes[novoInicio]?.value ?? '')}, o próximo a ser atendido. O ponteiro de fim não muda.`,
    snapshot: { state: result.state, floating: { item: removido, phase: 'leaving' } },
    highlights: [
      { kind: 'pointer', pointer: 'head', role: 'anchor' },
      { kind: 'floating', role: 'leaving' },
    ],
    // Quando a fila esvazia, o passo trata do zeramento do fim — que é a linha
    // que o aluno precisa ver destacada, não a do avanço do início.
    codeLine: novoInicio === null ? DEQUEUE.em.zeraFim : DEQUEUE.em.avancaInicio,
    counts: { moves: novoInicio === null ? 2 : 1 },
  });

  builder.add({
    title: 'Libera o nó removido',
    description: `A memória do nó ${quote(removido.value)} é devolvida. A fila agora tem ${sizeOf(result.state)}. Na fila em vetor a posição continuaria existindo, à espera de ser reaproveitada quando o fim desse a volta; aqui o espaço volta para a memória.`,
    snapshot: still(result.state),
    highlights: [{ kind: 'pointer', pointer: 'head', role: 'anchor' }],
    codeLine: DEQUEUE.em.libera,
    tone: 'success',
  });

  return builder.build({
    label,
    complexity: C_DEQUEUE,
    outcome: 'success',
    summary: `${quote(removido.value)} saiu do início da fila e sua memória foi liberada.`,
    pseudocode: DEQUEUE.code,
  });
}

// ---------------------------------------------------------------------------
// peek
// ---------------------------------------------------------------------------

export function planPeek(state: LinkedQueueState): ListTrace {
  const builder = createQueueTrace();
  const label = 'peek()';

  builder.add({
    title: 'Verifica se a fila está vazia',
    description: 'Para consultar quem será atendido, o ponteiro de início não pode ser NULL.',
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'head', role: 'inspected' }],
    codeLine: PEEK.em.testeVazia,
  });

  const result = peek(state);

  if (!result.ok) {
    builder.add({
      title: 'A fila está vazia',
      description:
        'O início vale NULL: não há ninguém para consultar. A operação é cancelada e nada é alterado.',
      snapshot: still(state),
      highlights: [{ kind: 'pointer', pointer: 'head', role: 'target' }],
      codeLine: PEEK.em.vazia,
      tone: 'error',
    });

    return builder.build({
      label,
      complexity: C_PEEK,
      outcome: 'error',
      summary: 'A fila está vazia, não há elemento no início para consultar.',
      pseudocode: PEEK.code,
    });
  }

  builder.add({
    title: 'Lê o valor do primeiro nó',
    description: `O início guarda ${quote(result.node.value)} — o próximo a ser atendido. A operação apenas lê: nenhum ponteiro se move e nenhum nó é liberado.`,
    snapshot: still(state),
    highlights: [{ kind: 'node', id: result.node.id, role: 'inspected' }],
    codeLine: PEEK.em.retorna,
    tone: 'success',
    counts: { visits: 1 },
  });

  return builder.build({
    label,
    complexity: C_PEEK,
    outcome: 'success',
    summary: `O início da fila é ${quote(result.node.value)}. Nada foi removido.`,
    pseudocode: PEEK.code,
  });
}

// ---------------------------------------------------------------------------
// isEmpty
// ---------------------------------------------------------------------------

export function planIsEmpty(state: LinkedQueueState): ListTrace {
  const builder = createQueueTrace();
  const vazia = isEmpty(state);

  builder.add({
    title: 'Compara o ponteiro de início com NULL',
    description:
      'Uma única comparação de ponteiro responde à pergunta. Não há contador de elementos envolvido.',
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'head', role: 'inspected' }],
    codeLine: IS_EMPTY.em.retorna,
  });

  builder.add({
    title: vazia ? 'A fila está vazia' : 'A fila não está vazia',
    description: vazia
      ? 'O início vale NULL, logo isEmpty() devolve verdadeiro. dequeue() e peek() ficam indisponíveis neste estado.'
      : `O início aponta para um nó, logo isEmpty() devolve falso. A fila guarda ${sizeOf(state)}. Não existe isFull() aqui: a fila encadeada não tem capacidade máxima.`,
    snapshot: still(state),
    highlights: vazia ? [] : [{ kind: 'node', id: state.head ?? '', role: 'inspected' }],
    codeLine: IS_EMPTY.em.retorna,
    tone: 'success',
  });

  return builder.build({
    label: 'isEmpty()',
    complexity: C_TESTE,
    outcome: 'success',
    summary: `isEmpty() = ${vazia ? 'verdadeiro' : 'falso'} (${sizeOf(state)}).`,
    pseudocode: IS_EMPTY.code,
  });
}
