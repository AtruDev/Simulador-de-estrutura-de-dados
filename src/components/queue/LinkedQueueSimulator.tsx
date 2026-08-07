import { useMemo, useState } from 'react';
import { emptyList } from '../../core/data-structures/linked-list';
import { type LinkedQueueState, isEmpty, size } from '../../core/data-structures/linked-queue';
import { nextId } from '../../core/ids';
import { SAMPLE_LIST_SIZE, randomList, randomValue } from '../../core/sample-data';
import {
  planDequeue,
  planEnqueue,
  planIsEmpty,
  planPeek,
} from '../../core/step-engine/linked-queue-steps';
import { usePlayerShortcuts } from '../../hooks/usePlayerShortcuts';
import { useSimulator } from '../../hooks/useSimulator';
import { useStepPlayer } from '../../hooks/useStepPlayer';
import type { ListHighlight, ListSnapshot } from '../../types/structures';
import { LIMITE_VISUAL } from '../linked-list/LinkedListControls';
import { LinkedListView, type PointerNaming } from '../linked-list/LinkedListView';
import { DefaultHelp, SimulatorScaffold } from '../shared/SimulatorScaffold';
import {
  ControlDivider,
  ControlPanel,
  type Notice,
  OperationButton,
  SetupButton,
  StatusBanner,
  ValueInput,
} from '../shared/controls';
import { type Implementation, ImplementationSwitch } from '../shared/ImplementationSwitch';

function naming(state: LinkedQueueState): PointerNaming {
  return {
    head: 'início',
    tail: 'fim',
    empty: 'A fila está vazia: início e fim valem NULL.',
    aria: `Fila encadeada com ${state.size} nós, do início ao fim`,
  };
}

function buildNotices(state: LinkedQueueState): readonly Notice[] {
  const avisos: Notice[] = [];

  if (isEmpty(state)) {
    avisos.push({
      tone: 'error',
      text: 'A fila está vazia (início = NULL). dequeue() e peek() ficam indisponíveis — executá-los causaria underflow.',
    });
  }

  avisos.push({
    tone: 'info',
    text: 'Sem capacidade fixa não há isFull() nem aritmética modular: nada dá a volta, porque não existe array a reaproveitar. O ponteiro de fim é o que mantém enqueue() em O(1).',
  });

  return avisos;
}

interface LinkedQueueSimulatorProps {
  readonly implementation: Implementation;
  readonly onImplementationChange: (value: Implementation) => void;
}

export function LinkedQueueSimulator({
  implementation,
  onImplementationChange,
}: LinkedQueueSimulatorProps) {
  const simulator = useSimulator<LinkedQueueState, ListSnapshot, ListHighlight>(
    emptyList('singly'),
  );
  const { state, trace, sceneKey, log } = simulator;
  const [valor, setValor] = useState('');

  const player = useStepPlayer({ traceId: sceneKey, totalSteps: trace?.steps.length ?? 0 });
  usePlayerShortcuts(player, trace !== null);

  const step = trace?.steps[Math.min(player.index, trace.steps.length - 1)] ?? null;

  const snapshot: ListSnapshot = useMemo(
    () => step?.snapshot ?? { state, floating: null },
    [step, state],
  );

  const notices = useMemo(() => buildNotices(state), [state]);

  const vazia = isEmpty(state);
  const semValor = valor.trim().length === 0;
  const cheiaNaTela = size(state) >= LIMITE_VISUAL;

  function enfileirar() {
    const limpo = valor.trim();
    if (limpo.length === 0 || cheiaNaTela) return;
    simulator.run((atual) => planEnqueue(atual, { id: nextId('no'), value: limpo }));
    setValor('');
  }

  return (
    <SimulatorScaffold
      title="Fila encadeada"
      subtitle="O mesmo TAD fila, implementado com alocação dinâmica: nós ligados por ponteiros, com início e fim apontando para as duas pontas."
      player={player}
      trace={trace}
      step={step}
      log={log}
      onReplay={simulator.replay}
      help={
        <DefaultHelp>
          Enfileire com enqueue() e compare com a versão em vetor circular: aqui nada dá a
          volta, e é o ponteiro de fim que mantém a inserção em O(1).
        </DefaultHelp>
      }
      controls={
        <div className="flex flex-col gap-3">
          <ImplementationSwitch
            value={implementation}
            onChange={onImplementationChange}
            abstractType="fila"
            hint="Na versão encadeada não há capacidade fixa, nem contador para desempatar vazia de cheia, nem índices dando a volta."
          />

          <ControlPanel label="Operações da fila encadeada">
            <ValueInput
              id="valor-fila-encadeada"
              label="Valor"
              value={valor}
              onChange={setValor}
              onSubmit={enfileirar}
              onRandom={() => {
                setValor(randomValue());
              }}
            />

            <OperationButton
              variant="insert"
              onClick={enfileirar}
              disabled={semValor || cheiaNaTela}
              disabledReason={
                cheiaNaTela
                  ? `a visualização comporta no máximo ${LIMITE_VISUAL} nós`
                  : 'informe um valor para enfileirar'
              }
            >
              enqueue(valor)
            </OperationButton>

            <OperationButton
              variant="remove"
              onClick={() => {
                simulator.run(planDequeue);
              }}
              disabled={vazia}
              disabledReason="a fila está vazia; um dequeue() causaria underflow"
            >
              dequeue()
            </OperationButton>

            <OperationButton
              variant="inspect"
              onClick={() => {
                simulator.run(planPeek);
              }}
              disabled={vazia}
              disabledReason="a fila está vazia; não há elemento no início para consultar"
            >
              peek()
            </OperationButton>

            <ControlDivider />

            <OperationButton
              variant="inspect"
              onClick={() => {
                simulator.run(planIsEmpty);
              }}
            >
              isEmpty()
            </OperationButton>

            <ControlDivider />

            <SetupButton
              onClick={() => {
                simulator.reset(randomList('singly', SAMPLE_LIST_SIZE, () => nextId('no')));
              }}
              hint="monta uma fila com nós aleatórios, reiniciando a atual"
            >
              Preencher
            </SetupButton>

            <button
              type="button"
              onClick={() => {
                simulator.reset(emptyList('singly'));
              }}
              className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-500 underline-offset-4 transition-colors hover:text-slate-800 hover:underline"
            >
              Reiniciar
            </button>
          </ControlPanel>

          <StatusBanner notices={notices} />
        </div>
      }
      canvas={
        <LinkedListView
          snapshot={snapshot}
          highlights={step?.highlights ?? []}
          durationMs={player.stepDurationMs}
          naming={naming(state)}
        />
      }
    />
  );
}
