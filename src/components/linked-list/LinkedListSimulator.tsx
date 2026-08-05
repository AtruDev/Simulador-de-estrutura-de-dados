import { useMemo } from 'react';
import {
  type LinkedListState,
  type ListVariant,
  emptyList,
  isEmpty,
} from '../../core/data-structures/linked-list';
import { nextId } from '../../core/ids';
import {
  planDeleteAt,
  planDeleteHead,
  planDeleteTail,
  planInsertAt,
  planInsertHead,
  planInsertTail,
  planSearch,
} from '../../core/step-engine/linked-list-steps';
import { usePlayerShortcuts } from '../../hooks/usePlayerShortcuts';
import { useSimulator } from '../../hooks/useSimulator';
import { useStepPlayer } from '../../hooks/useStepPlayer';
import type { ListHighlight, ListSnapshot } from '../../types/structures';
import { DefaultHelp, SimulatorScaffold } from '../shared/SimulatorScaffold';
import { type Notice, StatusBanner } from '../shared/controls';
import { LIMITE_VISUAL, LinkedListControls } from './LinkedListControls';
import { LinkedListView } from './LinkedListView';

/** Avisos sobre os estados de borda da lista. */
function buildNotices(state: LinkedListState): readonly Notice[] {
  const avisos: Notice[] = [];

  if (isEmpty(state)) {
    avisos.push({
      tone: 'error',
      text: 'A lista está vazia (cabeça = NULL). As remoções e a busca ficam indisponíveis até que exista pelo menos um nó.',
    });
  }

  if (state.size >= LIMITE_VISUAL) {
    avisos.push({
      tone: 'info',
      text: `A visualização comporta ${LIMITE_VISUAL} nós e esse limite foi atingido. A estrutura em si não tem capacidade máxima: cada nó é alocado individualmente, por isso uma lista ligada nunca fica "cheia".`,
    });
  }

  if (state.variant === 'singly' && state.size > 1) {
    avisos.push({
      tone: 'info',
      text: 'Nesta variante não há ponteiro prev. Compare o custo de deleteTail() aqui — O(n) — com o da lista duplamente ligada — O(1).',
    });
  }

  return avisos;
}

export function LinkedListSimulator() {
  const simulator = useSimulator<LinkedListState, ListSnapshot, ListHighlight>(
    emptyList('singly'),
  );
  const { state, trace, sceneKey, log } = simulator;

  const player = useStepPlayer({ traceId: sceneKey, totalSteps: trace?.steps.length ?? 0 });
  usePlayerShortcuts(player, trace !== null);

  const step = trace?.steps[Math.min(player.index, trace.steps.length - 1)] ?? null;

  const snapshot: ListSnapshot = useMemo(
    () => step?.snapshot ?? { state, floating: null },
    [step, state],
  );

  const notices = useMemo(() => buildNotices(state), [state]);

  /** Cria os dados de um nó novo, com identificador único para a sessão. */
  function novoNo(value: string) {
    return { id: nextId('no'), value };
  }

  return (
    <SimulatorScaffold
      title="Lista Ligada"
      subtitle="Nós alocados individualmente e conectados por ponteiros. Sem capacidade fixa e sem acesso indexado: chegar à posição i custa um percurso."
      player={player}
      trace={trace}
      step={step}
      log={log}
      onReplay={simulator.replay}
      help={
        <DefaultHelp>
          Digite um valor e insira na cabeça, na cauda ou numa posição. Use{' '}
          <strong>search</strong> para ver o percurso nó a nó.
        </DefaultHelp>
      }
      controls={
        <div className="flex flex-col gap-3">
          <LinkedListControls
            state={state}
            onInsertHead={(valor) => {
              simulator.run((atual) => planInsertHead(atual, novoNo(valor)));
            }}
            onInsertTail={(valor) => {
              simulator.run((atual) => planInsertTail(atual, novoNo(valor)));
            }}
            onInsertAt={(indice, valor) => {
              simulator.run((atual) => planInsertAt(atual, indice, novoNo(valor)));
            }}
            onDeleteHead={() => {
              simulator.run(planDeleteHead);
            }}
            onDeleteTail={() => {
              simulator.run(planDeleteTail);
            }}
            onDeleteAt={(indice) => {
              simulator.run((atual) => planDeleteAt(atual, indice));
            }}
            onSearch={(valor) => {
              simulator.run((atual) => planSearch(atual, valor));
            }}
            onVariantChange={(variante: ListVariant) => {
              simulator.reset(emptyList(variante));
            }}
            onReset={() => {
              simulator.reset(emptyList(state.variant));
            }}
          />
          <StatusBanner notices={notices} />
        </div>
      }
      canvas={
        <LinkedListView
          snapshot={snapshot}
          highlights={step?.highlights ?? []}
          durationMs={player.stepDurationMs}
        />
      }
    />
  );
}
