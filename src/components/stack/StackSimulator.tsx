import { useMemo } from 'react';
import {
  STACK_DEFAULT_CAPACITY,
  type StackState,
  createStack,
  isEmpty,
  isFull,
  size,
} from '../../core/data-structures/stack';
import { nextId } from '../../core/ids';
import { randomStack } from '../../core/sample-data';
import {
  planIsEmpty,
  planIsFull,
  planPeek,
  planPop,
  planPush,
} from '../../core/step-engine/stack-steps';
import { usePlayerShortcuts } from '../../hooks/usePlayerShortcuts';
import { useSimulator } from '../../hooks/useSimulator';
import { useStepPlayer } from '../../hooks/useStepPlayer';
import type { StackHighlight, StackSnapshot } from '../../types/structures';
import { DefaultHelp, SimulatorScaffold } from '../shared/SimulatorScaffold';
import { type Notice, StatusBanner } from '../shared/controls';
import { StackControls } from './StackControls';
import { StackView } from './StackView';

/** Avisos sobre os estados de borda da pilha. */
function buildNotices(state: StackState): readonly Notice[] {
  if (isEmpty(state)) {
    return [
      {
        tone: 'error',
        text: 'A pilha está vazia (topo = -1). pop() e peek() ficam indisponíveis — executá-los causaria underflow.',
      },
    ];
  }
  if (isFull(state)) {
    return [
      {
        tone: 'error',
        text: `A pilha está cheia (${size(state)} de ${state.capacity}). push() fica indisponível — empilhar agora causaria overflow.`,
      },
    ];
  }
  return [];
}

export function StackSimulator() {
  const simulator = useSimulator<StackState, StackSnapshot, StackHighlight>(
    createStack(STACK_DEFAULT_CAPACITY),
  );
  const { state, trace, sceneKey, log } = simulator;

  const player = useStepPlayer({ traceId: sceneKey, totalSteps: trace?.steps.length ?? 0 });
  usePlayerShortcuts(player, trace !== null);

  const step = trace?.steps[Math.min(player.index, trace.steps.length - 1)] ?? null;

  // Sem operação em cena, a visualização mostra o estado consolidado.
  const snapshot: StackSnapshot = useMemo(
    () => step?.snapshot ?? { state, floating: null },
    [step, state],
  );

  const notices = useMemo(() => buildNotices(state), [state]);

  return (
    <SimulatorScaffold
      title="Pilha (Stack)"
      subtitle="Estrutura LIFO baseada em array: o último elemento a entrar é o primeiro a sair."
      player={player}
      trace={trace}
      step={step}
      log={log}
      onReplay={simulator.replay}
      help={
        <DefaultHelp>
          Digite um valor e empilhe com push() — ou use <strong>Preencher</strong> para
          partir de uma pilha já povoada.
        </DefaultHelp>
      }
      controls={
        <div className="flex flex-col gap-3">
          <StackControls
            state={state}
            onPush={(valor) => {
              simulator.run((atual) => planPush(atual, { id: nextId('item'), value: valor }));
            }}
            onPop={() => {
              simulator.run(planPop);
            }}
            onPeek={() => {
              simulator.run(planPeek);
            }}
            onIsEmpty={() => {
              simulator.run(planIsEmpty);
            }}
            onIsFull={() => {
              simulator.run(planIsFull);
            }}
            onCapacityChange={(capacidade) => {
              simulator.reset(createStack(capacidade));
            }}
            onFill={() => {
              // Preparação de cenário, não operação: entra como novo ponto de
              // partida, sem trilha para reproduzir e com o log zerado.
              simulator.reset(randomStack(state.capacity, () => nextId('item')));
            }}
            onReset={() => {
              simulator.reset(createStack(state.capacity));
            }}
          />
          <StatusBanner notices={notices} />
        </div>
      }
      canvas={
        <StackView
          snapshot={snapshot}
          highlights={step?.highlights ?? []}
          durationMs={player.stepDurationMs}
        />
      }
    />
  );
}
