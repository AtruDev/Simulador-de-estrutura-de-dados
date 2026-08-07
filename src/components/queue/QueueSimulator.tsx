import { useMemo } from 'react';
import {
  QUEUE_DEFAULT_CAPACITY,
  type QueueState,
  capacity,
  createQueue,
  isEmpty,
  isFull,
  size,
} from '../../core/data-structures/queue';
import { nextId } from '../../core/ids';
import { randomQueue } from '../../core/sample-data';
import {
  planDequeue,
  planEnqueue,
  planIsEmpty,
  planIsFull,
  planPeek,
} from '../../core/step-engine/queue-steps';
import { usePlayerShortcuts } from '../../hooks/usePlayerShortcuts';
import { useSimulator } from '../../hooks/useSimulator';
import { useStepPlayer } from '../../hooks/useStepPlayer';
import type { QueueHighlight, QueueSnapshot } from '../../types/structures';
import { DefaultHelp, SimulatorScaffold } from '../shared/SimulatorScaffold';
import { type Implementation, ImplementationSwitch } from '../shared/ImplementationSwitch';
import { type Notice, StatusBanner } from '../shared/controls';
import { QueueControls } from './QueueControls';
import { QueueView } from './QueueView';

/** Avisos sobre os estados de borda da fila. */
function buildNotices(state: QueueState): readonly Notice[] {
  if (isEmpty(state)) {
    return [
      {
        tone: 'error',
        text: 'A fila está vazia (total = 0). dequeue() e peek() ficam indisponíveis — executá-los causaria underflow.',
      },
    ];
  }
  if (isFull(state)) {
    return [
      {
        tone: 'error',
        text: `A fila está cheia (${size(state)} de ${capacity(state)}). enqueue() fica indisponível — enfileirar agora causaria overflow.`,
      },
    ];
  }
  return [];
}

interface QueueSimulatorProps {
  readonly implementation: Implementation;
  readonly onImplementationChange: (value: Implementation) => void;
}

export function QueueSimulator({
  implementation,
  onImplementationChange,
}: QueueSimulatorProps) {
  const simulator = useSimulator<QueueState, QueueSnapshot, QueueHighlight>(
    createQueue(QUEUE_DEFAULT_CAPACITY),
  );
  const { state, trace, sceneKey, log } = simulator;

  const player = useStepPlayer({ traceId: sceneKey, totalSteps: trace?.steps.length ?? 0 });
  usePlayerShortcuts(player, trace !== null);

  const step = trace?.steps[Math.min(player.index, trace.steps.length - 1)] ?? null;

  const snapshot: QueueSnapshot = useMemo(
    () => step?.snapshot ?? { state, floating: null },
    [step, state],
  );

  const notices = useMemo(() => buildNotices(state), [state]);

  return (
    <SimulatorScaffold
      title="Fila (Queue)"
      subtitle="Estrutura FIFO baseada em array circular: o primeiro elemento a entrar é o primeiro a sair."
      player={player}
      trace={trace}
      step={step}
      log={log}
      onReplay={simulator.replay}
      help={
        <DefaultHelp>
          Digite um valor e enfileire com enqueue() — ou use <strong>Preencher</strong> para
          partir de uma fila já povoada.
        </DefaultHelp>
      }
      controls={
        <div className="flex flex-col gap-3">
          <ImplementationSwitch
            value={implementation}
            onChange={onImplementationChange}
            abstractType="fila"
            hint="Na versão em vetor a capacidade é fixa e os ponteiros dão a volta no array, o que permite reaproveitar posições já liberadas."
          />

          <QueueControls
            state={state}
            onEnqueue={(valor) => {
              simulator.run((atual) => planEnqueue(atual, { id: nextId('item'), value: valor }));
            }}
            onDequeue={() => {
              simulator.run(planDequeue);
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
            onCapacityChange={(novaCapacidade) => {
              simulator.reset(createQueue(novaCapacidade));
            }}
            onFill={() => {
              // Preparação de cenário, não operação: entra como novo ponto de
              // partida, sem trilha para reproduzir e com o log zerado.
              simulator.reset(randomQueue(capacity(state), () => nextId('item')));
            }}
            onReset={() => {
              simulator.reset(createQueue(capacity(state)));
            }}
          />
          <StatusBanner notices={notices} />
        </div>
      }
      canvas={
        <QueueView
          snapshot={snapshot}
          highlights={step?.highlights ?? []}
          durationMs={player.stepDurationMs}
        />
      }
    />
  );
}
