/**
 * Planejadores de passos da **Fila**.
 *
 * A narração dá ênfase ao que distingue a fila da pilha: a ordem FIFO e a
 * aritmética modular dos ponteiros de início e fim, que é o que permite
 * reaproveitar as posições liberadas sem deslocar elementos.
 */

import {
  type QueueItem,
  type QueueState,
  capacity,
  dequeue,
  enqueue,
  isEmpty,
  isFull,
  peek,
  size,
} from '../data-structures/queue';
import type { QueueHighlight, QueueSnapshot, QueueTrace } from '../../types/structures';
import {
  type TraceBuilder,
  complexity,
  createTraceBuilder,
  pseudocodigo,
  quote,
} from './trace-builder';

// ---------------------------------------------------------------------------
// Pseudocódigo
// ---------------------------------------------------------------------------

const ENQUEUE = pseudocodigo('enqueue(valor)', [
  ['assinatura', 'enqueue(valor):'],
  ['testeCheia', '  se total = capacidade então'],
  ['overflow', '    erro: overflow — a fila está cheia;'],
  '  fim se',
  ['grava', '  itens[fim] ← valor;'],
  ['avancaFim', '  fim ← (fim + 1) mod capacidade;'],
  ['incrementaTotal', '  total ← total + 1;'],
]);

const DEQUEUE = pseudocodigo('dequeue()', [
  'dequeue():',
  ['testeVazia', '  se total = 0 então'],
  ['underflow', '    erro: underflow — a fila está vazia;'],
  '  fim se',
  ['le', '  valor ← itens[inicio];'],
  ['libera', '  itens[inicio] ← vazio;'],
  ['avancaInicio', '  inicio ← (inicio + 1) mod capacidade;'],
  ['decrementaTotal', '  total ← total - 1;'],
  ['retorna', '  retorna valor;'],
]);

const PEEK = pseudocodigo('peek()', [
  'peek():',
  ['testeVazia', '  se total = 0 então'],
  ['vazia', '    erro: a fila está vazia;'],
  '  fim se',
  ['retorna', '  retorna itens[inicio];      // não move os ponteiros'],
]);

const IS_EMPTY = pseudocodigo('isEmpty()', [
  'isEmpty():',
  ['retorna', '  retorna (total = 0);'],
]);

const IS_FULL = pseudocodigo('isFull()', [
  'isFull():',
  ['retorna', '  retorna (total = capacidade);'],
]);

// ---------------------------------------------------------------------------
// Complexidades
// ---------------------------------------------------------------------------

const C_ENQUEUE = complexity(
  'O(1)',
  'O elemento é gravado diretamente na posição apontada pelo fim, e o ponteiro apenas avança. Nenhum outro elemento é deslocado.',
);

const C_DEQUEUE = complexity(
  'O(1)',
  'A remoção acontece na posição apontada pelo início, que então avança. É o array circular que garante isso: numa fila que desloca todos os elementos a cada remoção, dequeue custaria O(n).',
);

const C_PEEK = complexity(
  'O(1)',
  'É um acesso direto à posição do início, sem percorrer a fila.',
);

const C_TESTE = complexity(
  'O(1)',
  'Basta comparar o contador de elementos com um valor conhecido — nenhum elemento é percorrido.',
);

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

function createQueueTrace(): TraceBuilder<QueueSnapshot, QueueHighlight> {
  return createTraceBuilder<QueueSnapshot, QueueHighlight>();
}

function still(state: QueueState): QueueSnapshot {
  return { state, floating: null };
}

function occupancy(state: QueueState): string {
  const cap = capacity(state);
  return `${size(state)} de ${cap} ${cap === 1 ? 'posição' : 'posições'}`;
}

/**
 * Explica o avanço de um ponteiro, destacando a volta ao índice 0 quando ela
 * acontece — o momento em que o caráter circular da fila fica evidente.
 */
function pointerMove(name: string, from: number, to: number, cap: number): string {
  if (to === 0 && from === cap - 1) {
    return `O ponteiro de ${name} estava na última posição do array (índice ${from}), então a aritmética modular o traz de volta ao índice 0. É exatamente isso que torna a fila circular: as posições já liberadas voltam a ser aproveitadas.`;
  }
  return `O ponteiro de ${name} avança de ${from} para ${to}, calculado como (${from} + 1) mod ${cap}.`;
}

// ---------------------------------------------------------------------------
// enqueue
// ---------------------------------------------------------------------------

export function planEnqueue(state: QueueState, item: QueueItem): QueueTrace {
  const builder = createQueueTrace();
  const label = `enqueue(${item.value})`;
  const cap = capacity(state);

  builder.add({
    title: 'Cria o novo elemento',
    description: `Um elemento com o valor ${quote(item.value)} é preparado para entrar na fila. Ele ainda não faz parte da estrutura.`,
    snapshot: { state, floating: { item, phase: 'entering' } },
    highlights: [{ kind: 'floating', role: 'entering' }],
    codeLine: ENQUEUE.em.assinatura,
  });

  builder.add({
    title: 'Verifica se há espaço disponível',
    description: `A fila ocupa ${occupancy(state)}. Como início e fim podem coincidir tanto na fila vazia quanto na cheia, quem responde a essa pergunta é o contador de elementos: total = ${size(state)}.`,
    snapshot: { state, floating: { item, phase: 'entering' } },
    highlights: [{ kind: 'pointer', pointer: 'rear', role: 'inspected' }],
    codeLine: ENQUEUE.em.testeCheia,
  });

  const result = enqueue(state, item);

  if (!result.ok) {
    builder.add({
      title: 'Overflow: a fila está cheia',
      description: `Todas as ${cap} posições do array estão ocupadas (total = capacidade). O elemento ${quote(item.value)} é descartado e a fila permanece inalterada. Para abrir espaço é preciso remover elementos com dequeue().`,
      snapshot: still(state),
      highlights: [{ kind: 'pointer', pointer: 'rear', role: 'target' }],
      codeLine: ENQUEUE.em.overflow,
      tone: 'error',
    });

    return builder.build({
      label,
      complexity: C_ENQUEUE,
      outcome: 'error',
      summary: `Overflow: a fila já tinha ${cap} elementos, o valor ${quote(item.value)} não foi enfileirado.`,
      pseudocode: ENQUEUE.code,
    });
  }

  builder.add({
    title: 'Grava o elemento na posição do fim',
    description: `O ponteiro de fim marcava a posição ${result.index} como a próxima livre, e é ali que o valor ${quote(item.value)} é gravado. O elemento entra no fim da fila: só sairá depois de todos os que já estavam nela.`,
    snapshot: still(result.state),
    highlights: [{ kind: 'slot', index: result.index, role: 'entering' }],
    codeLine: ENQUEUE.em.grava,
    counts: { moves: 1 },
  });

  builder.add({
    title: 'Avança o ponteiro de fim',
    description: `${pointerMove('fim', state.rear, result.state.rear, cap)} A fila agora ocupa ${occupancy(result.state)}.`,
    snapshot: still(result.state),
    highlights: [
      { kind: 'slot', index: result.index, role: 'anchor' },
      { kind: 'pointer', pointer: 'rear', role: 'anchor' },
    ],
    codeLine: ENQUEUE.em.avancaFim,
    tone: 'success',
  });

  return builder.build({
    label,
    complexity: C_ENQUEUE,
    outcome: 'success',
    summary: `${quote(item.value)} entrou no fim da fila (posição ${result.index} do array).`,
    pseudocode: ENQUEUE.code,
  });
}

// ---------------------------------------------------------------------------
// dequeue
// ---------------------------------------------------------------------------

export function planDequeue(state: QueueState): QueueTrace {
  const builder = createQueueTrace();
  const label = 'dequeue()';
  const cap = capacity(state);

  builder.add({
    title: 'Verifica se a fila está vazia',
    description: `Antes de remover, confere-se o contador de elementos: total = ${size(state)}. Numa fila vazia não há início válido para consultar.`,
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'front', role: 'inspected' }],
    codeLine: DEQUEUE.em.testeVazia,
  });

  const result = dequeue(state);

  if (!result.ok) {
    builder.add({
      title: 'Underflow: a fila está vazia',
      description:
        'O contador de elementos vale 0, ou seja, não há ninguém na fila para ser atendido. A operação é cancelada e a fila continua vazia. Enfileire algo com enqueue() antes de tentar novamente.',
      snapshot: still(state),
      highlights: [{ kind: 'pointer', pointer: 'front', role: 'target' }],
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

  const removido = result.item;

  builder.add({
    title: 'Localiza o elemento do início',
    description: `O ponteiro de início aponta para a posição ${result.index}, que guarda ${quote(removido.value)}. Numa fila é sempre esse elemento que sai — o primeiro que entrou é o primeiro a sair (FIFO).`,
    snapshot: still(state),
    highlights: [{ kind: 'slot', index: result.index, role: 'leaving' }],
    codeLine: DEQUEUE.em.le,
    counts: { visits: 1 },
  });

  builder.add({
    title: 'Libera a posição do início',
    description: `${quote(removido.value)} deixa a fila. A posição ${result.index} do array fica livre e poderá ser reaproveitada quando o fim der a volta.`,
    snapshot: { state: result.state, floating: { item: removido, phase: 'leaving' } },
    highlights: [{ kind: 'floating', role: 'leaving' }],
    codeLine: DEQUEUE.em.libera,
    counts: { moves: 1 },
  });

  const proximo = isEmpty(result.state)
    ? 'A fila ficou vazia.'
    : `${quote(result.state.slots[result.state.front]?.value ?? '')} passa a ser o primeiro da fila.`;

  builder.add({
    title: 'Avança o ponteiro de início',
    description: `${pointerMove('início', state.front, result.state.front, cap)} ${proximo} A fila agora ocupa ${occupancy(result.state)}, e dequeue() devolve ${quote(removido.value)} a quem o chamou.`,
    snapshot: still(result.state),
    highlights: [{ kind: 'pointer', pointer: 'front', role: 'anchor' }],
    codeLine: DEQUEUE.em.avancaInicio,
    tone: 'success',
  });

  return builder.build({
    label,
    complexity: C_DEQUEUE,
    outcome: 'success',
    summary: `${quote(removido.value)} saiu do início da fila.`,
    pseudocode: DEQUEUE.code,
  });
}

// ---------------------------------------------------------------------------
// peek
// ---------------------------------------------------------------------------

export function planPeek(state: QueueState): QueueTrace {
  const builder = createQueueTrace();
  const label = 'peek()';

  builder.add({
    title: 'Verifica se a fila está vazia',
    description: `Para consultar a frente da fila é preciso que exista pelo menos um elemento: total = ${size(state)}.`,
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'front', role: 'inspected' }],
    codeLine: PEEK.em.testeVazia,
  });

  const result = peek(state);

  if (!result.ok) {
    builder.add({
      title: 'A fila está vazia',
      description:
        'Não há elemento no início para consultar: a fila não contém ninguém. A operação é cancelada e nada é alterado.',
      snapshot: still(state),
      highlights: [{ kind: 'pointer', pointer: 'front', role: 'target' }],
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
    title: 'Consulta o elemento do início',
    description: `O início aponta para a posição ${result.index}, que guarda ${quote(result.item.value)} — o próximo a ser atendido. A operação peek() apenas lê esse valor: nem o elemento nem os ponteiros mudam.`,
    snapshot: still(state),
    highlights: [{ kind: 'slot', index: result.index, role: 'inspected' }],
    codeLine: PEEK.em.retorna,
    tone: 'success',
    counts: { visits: 1 },
  });

  return builder.build({
    label,
    complexity: C_PEEK,
    outcome: 'success',
    summary: `O início da fila é ${quote(result.item.value)} (posição ${result.index} do array). Nada foi removido.`,
    pseudocode: PEEK.code,
  });
}

// ---------------------------------------------------------------------------
// isEmpty / isFull
// ---------------------------------------------------------------------------

export function planIsEmpty(state: QueueState): QueueTrace {
  const builder = createQueueTrace();
  const vazia = isEmpty(state);

  builder.add({
    title: 'Compara o total de elementos com zero',
    description: `Numa fila circular, comparar início com fim não basta: os dois coincidem tanto na fila vazia quanto na cheia. Por isso o teste usa o contador, que agora vale ${size(state)}.`,
    snapshot: still(state),
    highlights: [
      { kind: 'pointer', pointer: 'front', role: 'inspected' },
      { kind: 'pointer', pointer: 'rear', role: 'inspected' },
    ],
    codeLine: IS_EMPTY.em.retorna,
  });

  builder.add({
    title: vazia ? 'A fila está vazia' : 'A fila não está vazia',
    description: vazia
      ? 'O total vale 0, logo isEmpty() devolve verdadeiro. Operações de remoção (dequeue, peek) não podem ser executadas neste estado.'
      : `O total vale ${size(state)}, logo isEmpty() devolve falso. A fila guarda ${occupancy(state)}.`,
    snapshot: still(state),
    highlights: vazia ? [] : [{ kind: 'slot', index: state.front, role: 'inspected' }],
    codeLine: IS_EMPTY.em.retorna,
    tone: 'success',
  });

  return builder.build({
    label: 'isEmpty()',
    complexity: C_TESTE,
    outcome: 'success',
    summary: `isEmpty() = ${vazia ? 'verdadeiro' : 'falso'} (${occupancy(state)}).`,
    pseudocode: IS_EMPTY.code,
  });
}

export function planIsFull(state: QueueState): QueueTrace {
  const builder = createQueueTrace();
  const cheia = isFull(state);
  const cap = capacity(state);

  builder.add({
    title: 'Compara o total de elementos com a capacidade',
    description: `O teste de fila cheia também é imediato: compara-se o contador (${size(state)}) com a capacidade do array (${cap}).`,
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'rear', role: 'inspected' }],
    codeLine: IS_FULL.em.retorna,
  });

  builder.add({
    title: cheia ? 'A fila está cheia' : 'A fila não está cheia',
    description: cheia
      ? `As ${cap} posições do array estão ocupadas, logo isFull() devolve verdadeiro. Um novo enqueue() causaria overflow.`
      : `Ainda ${cap - size(state) === 1 ? 'resta 1 posição livre' : `restam ${cap - size(state)} posições livres`}, logo isFull() devolve falso.`,
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'rear', role: cheia ? 'target' : 'inspected' }],
    codeLine: IS_FULL.em.retorna,
    tone: 'success',
  });

  return builder.build({
    label: 'isFull()',
    complexity: C_TESTE,
    outcome: 'success',
    summary: `isFull() = ${cheia ? 'verdadeiro' : 'falso'} (${occupancy(state)}).`,
    pseudocode: IS_FULL.code,
  });
}
