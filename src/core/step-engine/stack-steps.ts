/**
 * Planejadores de passos da **Pilha**.
 *
 * Cada função recebe o estado atual e devolve a operação decomposta em passos
 * discretos e didáticos, na terminologia usada em aula (topo, base, LIFO,
 * overflow, underflow). Casos de borda não lançam exceção: produzem uma trilha
 * com `outcome: 'error'` cujos passos explicam o motivo ao aluno.
 */

import {
  type StackItem,
  type StackState,
  isEmpty,
  isFull,
  peek,
  pop,
  push,
  size,
  topIndex,
} from '../data-structures/stack';
import type { StackHighlight, StackSnapshot, StackTrace } from '../../types/structures';
import {
  type TraceBuilder,
  complexity,
  createTraceBuilder,
  pseudocodigo,
  quote,
} from './trace-builder';

// ---------------------------------------------------------------------------
// Pseudocódigo — cada passo aponta para uma linha pelo rótulo, nunca pelo número
//
// O ponto e vírgula fecha **instrução**, não linha: cabeçalho, `se ... então`,
// `senão`, `fim se`, `enquanto ... faça` e `fim enquanto` não levam, do mesmo
// modo que em C `if (...) {` e `}` não levam. Quem escreve o trabalho em C
// carrega o hábito daqui sem ter de desaprender nada.
// ---------------------------------------------------------------------------

const PUSH = pseudocodigo('push(valor)', [
  ['assinatura', 'push(valor):'],
  ['testeCheia', '  se topo = capacidade - 1 então'],
  ['overflow', '    erro: overflow — a pilha está cheia;'],
  '  fim se',
  ['grava', '  itens[topo + 1] ← valor;'],
  ['avancaTopo', '  topo ← topo + 1;'],
]);

const POP = pseudocodigo('pop()', [
  'pop():',
  ['testeVazia', '  se topo = -1 então'],
  ['underflow', '    erro: underflow — a pilha está vazia;'],
  '  fim se',
  ['le', '  valor ← itens[topo];'],
  ['recuaTopo', '  topo ← topo - 1;'],
  ['retorna', '  retorna valor;'],
]);

const PEEK = pseudocodigo('peek()', [
  'peek():',
  ['testeVazia', '  se topo = -1 então'],
  ['vazia', '    erro: a pilha está vazia;'],
  '  fim se',
  ['retorna', '  retorna itens[topo];        // não altera o topo'],
]);

const IS_EMPTY = pseudocodigo('isEmpty()', [
  'isEmpty():',
  ['retorna', '  retorna (topo = -1);'],
]);

const IS_FULL = pseudocodigo('isFull()', [
  'isFull():',
  ['retorna', '  retorna (topo = capacidade - 1);'],
]);

// ---------------------------------------------------------------------------
// Complexidades
// ---------------------------------------------------------------------------

const C_PUSH = complexity(
  'O(1)',
  'O elemento entra na posição imediatamente acima do topo, cujo índice já é conhecido. Nenhum outro elemento precisa ser deslocado, independentemente do tamanho da pilha.',
);

const C_POP = complexity(
  'O(1)',
  'A remoção acontece sempre no topo, cujo índice já é conhecido. Nenhum outro elemento precisa ser deslocado.',
);

const C_PEEK = complexity(
  'O(1)',
  'É um acesso direto à posição do topo, sem percorrer a pilha.',
);

const C_TESTE = complexity(
  'O(1)',
  'Basta comparar o índice do topo com um valor conhecido — nenhum elemento é percorrido.',
);

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

/** Construtor de trilhas já parametrizado com os tipos da pilha. */
function createStackTrace(): TraceBuilder<StackSnapshot, StackHighlight> {
  return createTraceBuilder<StackSnapshot, StackHighlight>();
}

/** Snapshot sem elemento em trânsito. */
function still(state: StackState): StackSnapshot {
  return { state, floating: null };
}

/** Descreve a ocupação atual, ex.: `'2 de 10 posições'`. */
function occupancy(state: StackState): string {
  const n = size(state);
  return `${n} de ${state.capacity} ${state.capacity === 1 ? 'posição' : 'posições'}`;
}

// ---------------------------------------------------------------------------
// push
// ---------------------------------------------------------------------------

export function planPush(state: StackState, item: StackItem): StackTrace {
  const builder = createStackTrace();
  const label = `push(${item.value})`;

  builder.add({
    title: 'Cria o novo elemento',
    description: `Um elemento com o valor ${quote(item.value)} é preparado para entrar na pilha. Ele ainda não faz parte da estrutura.`,
    snapshot: { state, floating: { item, phase: 'entering' } },
    highlights: [{ kind: 'floating', role: 'entering' }],
    codeLine: PUSH.em.assinatura,
  });

  builder.add({
    title: 'Verifica se há espaço disponível',
    description: `A pilha ocupa ${occupancy(state)}. Como o array tem capacidade fixa, é preciso confirmar que o topo ainda não chegou à última posição (índice ${state.capacity - 1}).`,
    snapshot: { state, floating: { item, phase: 'entering' } },
    highlights: [{ kind: 'pointer', pointer: 'top', role: 'inspected' }],
    codeLine: PUSH.em.testeCheia,
  });

  const result = push(state, item);

  if (!result.ok) {
    builder.add({
      title: 'Overflow: a pilha está cheia',
      description: `O topo já ocupa a última posição do array (índice ${state.capacity - 1}), então não há para onde a pilha crescer. O elemento ${quote(item.value)} é descartado e a pilha permanece inalterada. Para abrir espaço é preciso remover elementos com pop().`,
      snapshot: still(state),
      highlights: [{ kind: 'pointer', pointer: 'top', role: 'target' }],
      codeLine: PUSH.em.overflow,
      tone: 'error',
    });

    return builder.build({
      label,
      complexity: C_PUSH,
      outcome: 'error',
      summary: `Overflow: a pilha já tinha ${state.capacity} elementos, o valor ${quote(item.value)} não foi empilhado.`,
      pseudocode: PUSH.code,
    });
  }

  const novoTopo = topIndex(result.state);

  builder.add({
    title: 'Posiciona o elemento no topo',
    description: `O valor ${quote(item.value)} é gravado na posição ${novoTopo} do array, logo acima do elemento que era o topo até agora.`,
    snapshot: still(result.state),
    highlights: [{ kind: 'slot', index: novoTopo, role: 'entering' }],
    codeLine: PUSH.em.grava,
    counts: { moves: 1 },
  });

  builder.add({
    title: 'Atualiza o índice do topo',
    description: `O índice do topo passa de ${novoTopo - 1} para ${novoTopo}. Agora ${quote(item.value)} é o topo da pilha e, por ser o último a entrar, será o primeiro a sair (LIFO).`,
    snapshot: still(result.state),
    highlights: [
      { kind: 'slot', index: novoTopo, role: 'anchor' },
      { kind: 'pointer', pointer: 'top', role: 'anchor' },
    ],
    codeLine: PUSH.em.avancaTopo,
    tone: 'success',
  });

  return builder.build({
    label,
    complexity: C_PUSH,
    outcome: 'success',
    summary: `${quote(item.value)} foi empilhado no topo (posição ${novoTopo}).`,
    pseudocode: PUSH.code,
  });
}

// ---------------------------------------------------------------------------
// pop
// ---------------------------------------------------------------------------

export function planPop(state: StackState): StackTrace {
  const builder = createStackTrace();
  const label = 'pop()';

  builder.add({
    title: 'Verifica se a pilha está vazia',
    description:
      'Antes de remover, é preciso confirmar que existe algum elemento: numa pilha vazia o índice do topo vale -1.',
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'top', role: 'inspected' }],
    codeLine: POP.em.testeVazia,
  });

  const result = pop(state);

  if (!result.ok) {
    builder.add({
      title: 'Underflow: a pilha está vazia',
      description:
        'O índice do topo vale -1, ou seja, não há nenhum elemento para remover. A operação é cancelada e a pilha continua vazia. Empilhe algo com push() antes de tentar novamente.',
      snapshot: still(state),
      highlights: [{ kind: 'pointer', pointer: 'top', role: 'target' }],
      codeLine: POP.em.underflow,
      tone: 'error',
    });

    return builder.build({
      label,
      complexity: C_POP,
      outcome: 'error',
      summary: 'Underflow: não há elementos para desempilhar.',
      pseudocode: POP.code,
    });
  }

  const indiceRemovido = topIndex(state);
  const removido = result.item;

  builder.add({
    title: 'Localiza o elemento do topo',
    description: `O índice do topo aponta para a posição ${indiceRemovido}, que guarda ${quote(removido.value)}. Numa pilha é sempre esse elemento que sai — o último que entrou é o primeiro a sair (LIFO).`,
    snapshot: still(state),
    highlights: [{ kind: 'slot', index: indiceRemovido, role: 'leaving' }],
    codeLine: POP.em.le,
    counts: { visits: 1 },
  });

  const novoTopo = topIndex(result.state);

  builder.add({
    title: 'Recua o índice do topo',
    description: `O topo passa de ${indiceRemovido} para ${novoTopo}. É essa única subtração que remove ${quote(removido.value)}: a posição ${indiceRemovido} deixa de pertencer à pilha, sem que nenhum outro elemento precise ser deslocado.`,
    snapshot: { state: result.state, floating: { item: removido, phase: 'leaving' } },
    highlights: [{ kind: 'floating', role: 'leaving' }],
    codeLine: POP.em.recuaTopo,
    counts: { moves: 1 },
  });

  const estadoFinal = isEmpty(result.state)
    ? 'A pilha ficou vazia: o topo voltou a valer -1.'
    : `A pilha agora ocupa ${occupancy(result.state)}, com ${quote(result.state.items[novoTopo]?.value ?? '')} no topo.`;

  builder.add({
    title: 'Devolve o valor removido',
    description: `pop() entrega ${quote(removido.value)} a quem o chamou. ${estadoFinal}`,
    snapshot: still(result.state),
    highlights: [{ kind: 'pointer', pointer: 'top', role: 'anchor' }],
    codeLine: POP.em.retorna,
    tone: 'success',
  });

  return builder.build({
    label,
    complexity: C_POP,
    outcome: 'success',
    summary: `${quote(removido.value)} foi desempilhado do topo.`,
    pseudocode: POP.code,
  });
}

// ---------------------------------------------------------------------------
// peek
// ---------------------------------------------------------------------------

export function planPeek(state: StackState): StackTrace {
  const builder = createStackTrace();
  const label = 'peek()';

  builder.add({
    title: 'Verifica se a pilha está vazia',
    description:
      'Para consultar o topo é preciso que exista pelo menos um elemento — numa pilha vazia o índice do topo vale -1.',
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'top', role: 'inspected' }],
    codeLine: PEEK.em.testeVazia,
  });

  const result = peek(state);

  if (!result.ok) {
    builder.add({
      title: 'A pilha está vazia',
      description:
        'Não há topo para consultar: a pilha não contém nenhum elemento. A operação é cancelada e nada é alterado.',
      snapshot: still(state),
      highlights: [{ kind: 'pointer', pointer: 'top', role: 'target' }],
      codeLine: PEEK.em.vazia,
      tone: 'error',
    });

    return builder.build({
      label,
      complexity: C_PEEK,
      outcome: 'error',
      summary: 'A pilha está vazia, não há topo para consultar.',
      pseudocode: PEEK.code,
    });
  }

  builder.add({
    title: 'Consulta o elemento do topo',
    description: `O topo está na posição ${result.index} e guarda ${quote(result.item.value)}. A operação peek() apenas lê esse valor: o elemento continua na pilha e o índice do topo não muda.`,
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
    summary: `O topo da pilha é ${quote(result.item.value)} (posição ${result.index}). Nada foi removido.`,
    pseudocode: PEEK.code,
  });
}

// ---------------------------------------------------------------------------
// isEmpty / isFull
// ---------------------------------------------------------------------------

export function planIsEmpty(state: StackState): StackTrace {
  const builder = createStackTrace();
  const vazia = isEmpty(state);

  builder.add({
    title: 'Compara o índice do topo com -1',
    description: `O teste de pilha vazia não percorre a estrutura: basta olhar o índice do topo, que agora vale ${topIndex(state)}.`,
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'top', role: 'inspected' }],
    codeLine: IS_EMPTY.em.retorna,
  });

  builder.add({
    title: vazia ? 'A pilha está vazia' : 'A pilha não está vazia',
    description: vazia
      ? 'O índice do topo vale -1, logo isEmpty() devolve verdadeiro. Operações de remoção (pop, peek) não podem ser executadas neste estado.'
      : `O índice do topo vale ${topIndex(state)}, logo isEmpty() devolve falso. A pilha guarda ${occupancy(state)}.`,
    snapshot: still(state),
    highlights: vazia ? [] : [{ kind: 'slot', index: topIndex(state), role: 'inspected' }],
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

export function planIsFull(state: StackState): StackTrace {
  const builder = createStackTrace();
  const cheia = isFull(state);

  builder.add({
    title: 'Compara o índice do topo com capacidade - 1',
    description: `O teste de pilha cheia também é imediato: compara-se o índice do topo (${topIndex(state)}) com a última posição do array (${state.capacity - 1}).`,
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'top', role: 'inspected' }],
    codeLine: IS_FULL.em.retorna,
  });

  builder.add({
    title: cheia ? 'A pilha está cheia' : 'A pilha não está cheia',
    description: cheia
      ? `O topo ocupa a última posição do array (índice ${state.capacity - 1}), logo isFull() devolve verdadeiro. Um novo push() causaria overflow.`
      : `Ainda restam ${state.capacity - size(state)} ${state.capacity - size(state) === 1 ? 'posição livre' : 'posições livres'}, logo isFull() devolve falso.`,
    snapshot: still(state),
    highlights: [{ kind: 'pointer', pointer: 'top', role: cheia ? 'target' : 'inspected' }],
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
