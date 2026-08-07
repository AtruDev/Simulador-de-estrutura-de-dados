/**
 * Geração de valores de exemplo, para montar um cenário de aula em um clique.
 *
 * Motivação didática: demonstrar `pop`, `dequeue` ou `search` exige uma
 * estrutura já povoada, e digitar meia dúzia de valores no projetor custa tempo
 * de aula. Estas funções produzem esse ponto de partida.
 *
 * Módulo **puro** no mesmo sentido dos módulos de estrutura de dados: o sorteio
 * e a geração de identificadores são recebidos de fora (`rng`, `makeId`), o que
 * mantém os testes determinísticos.
 */

import {
  type LinkedListState,
  type ListVariant,
  createList,
} from './data-structures/linked-list';
import { type QueueState, clampCapacity as clampQueue, createQueue, enqueue } from './data-structures/queue';
import { type StackState, clampCapacity as clampStack, createStack } from './data-structures/stack';

/** Sorteador no intervalo `[0, 1)` — a assinatura de `Math.random`. */
export type Rng = () => number;

/** Menor valor sorteado. */
export const SAMPLE_MIN = 1;
/** Maior valor sorteado. Dois dígitos cabem na caixa de um nó sem apertar. */
export const SAMPLE_MAX = 99;

/** Quantidade de valores possíveis. */
const FAIXA = SAMPLE_MAX - SAMPLE_MIN + 1;

/** Índice sorteado em `[0, size)`, tolerante a um `rng` fora do contrato. */
function randomIndex(size: number, rng: Rng): number {
  const sorteado = Math.floor(rng() * size);
  return Math.min(Math.max(sorteado, 0), size - 1);
}

/** Um valor de exemplo, já como texto — é assim que a estrutura o guarda. */
export function randomValue(rng: Rng = Math.random): string {
  return String(SAMPLE_MIN + randomIndex(FAIXA, rng));
}

/**
 * `count` valores **distintos**, em ordem de sorteio.
 *
 * Distintos porque valores repetidos atrapalham a demonstração de `search`: o
 * aluno não saberia dizer se o percurso parou na primeira ocorrência ou não.
 *
 * A distinção vem de um Fisher-Yates parcial sobre os valores possíveis, e não
 * de sortear até não repetir: assim o custo é linear e um `rng` viciado não
 * consegue prender o laço.
 */
export function randomValues(count: number, rng: Rng = Math.random): readonly string[] {
  const total = Math.max(0, Math.min(Math.trunc(count), FAIXA));
  const disponiveis = Array.from({ length: FAIXA }, (_, i) => SAMPLE_MIN + i);
  const valores: string[] = [];

  for (let i = 0; i < total; i += 1) {
    const sorteado = i + randomIndex(FAIXA - i, rng);
    const escolhido = disponiveis[sorteado] ?? disponiveis[i];
    // Move o valor consumido para fora da parte ainda sorteável.
    disponiveis[sorteado] = disponiveis[i] ?? SAMPLE_MIN;
    valores.push(String(escolhido));
  }

  return valores;
}

/**
 * Quantos elementos povoar numa estrutura de capacidade fixa: cerca de 60% dela,
 * deixando espaço livre para demonstrar inserções sem esbarrar em overflow.
 */
export function sampleSize(capacity: number): number {
  const segura = Math.max(1, Math.trunc(capacity));
  return Math.max(1, Math.min(segura, Math.ceil(segura * 0.6)));
}

/** Quantidade de nós de uma lista de exemplo, quando não há capacidade a seguir. */
export const SAMPLE_LIST_SIZE = 5;

/** Pilha povoada, da base ao topo, com capacidade preservada. */
export function randomStack(
  capacity: number,
  makeId: () => string,
  rng: Rng = Math.random,
): StackState {
  const total = sampleSize(clampStack(capacity));
  const items = randomValues(total, rng).map((value) => ({ id: makeId(), value }));
  return createStack(capacity, items);
}

/**
 * Fila povoada a partir da posição 0, com `início` e `fim` nos índices que os
 * mesmos `enqueue` teriam produzido — o cenário é o de uma fila recém-usada, não
 * um estado montado à mão.
 */
export function randomQueue(
  capacity: number,
  makeId: () => string,
  rng: Rng = Math.random,
): QueueState {
  const total = sampleSize(clampQueue(capacity));
  return randomValues(total, rng).reduce<QueueState>((estado, value) => {
    const resultado = enqueue(estado, { id: makeId(), value });
    return resultado.ok ? resultado.state : estado;
  }, createQueue(capacity));
}

/** Lista povoada por inserções na cauda, preservando a variante em uso. */
export function randomList(
  variant: ListVariant,
  count: number,
  makeId: () => string,
  rng: Rng = Math.random,
): LinkedListState {
  const total = Math.max(0, Math.trunc(count));
  return createList(
    variant,
    randomValues(total, rng).map((value) => ({ id: makeId(), value })),
  );
}
