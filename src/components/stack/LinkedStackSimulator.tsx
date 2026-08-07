import { useMemo, useState } from 'react';
import { emptyList } from '../../core/data-structures/linked-list';
import { type LinkedStackState, isEmpty, size } from '../../core/data-structures/linked-stack';
import { nextId } from '../../core/ids';
import { SAMPLE_LIST_SIZE, randomList, randomValue } from '../../core/sample-data';
import {
  planIsEmpty,
  planPeek,
  planPop,
  planPush,
} from '../../core/step-engine/linked-stack-steps';
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

/** A pilha encadeada não tem fundo rotulado: só o topo é ponteiro nomeado. */
function naming(state: LinkedStackState): PointerNaming {
  return {
    head: 'topo',
    tail: null,
    empty: 'A pilha está vazia: o ponteiro de topo vale NULL.',
    aria: `Pilha encadeada com ${state.size} nós, do topo para o fundo`,
  };
}

function buildNotices(state: LinkedStackState): readonly Notice[] {
  const avisos: Notice[] = [];

  if (isEmpty(state)) {
    avisos.push({
      tone: 'error',
      text: 'A pilha está vazia (topo = NULL). pop() e peek() ficam indisponíveis — executá-los causaria underflow.',
    });
  }

  avisos.push({
    tone: 'info',
    text: 'Não existe isFull() aqui: cada nó é alocado individualmente, então esta pilha nunca fica cheia e push() nunca causa overflow. O limite de 20 nós é da visualização.',
  });

  return avisos;
}

interface LinkedStackSimulatorProps {
  readonly implementation: Implementation;
  readonly onImplementationChange: (value: Implementation) => void;
}

export function LinkedStackSimulator({
  implementation,
  onImplementationChange,
}: LinkedStackSimulatorProps) {
  const simulator = useSimulator<LinkedStackState, ListSnapshot, ListHighlight>(
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

  function empilhar() {
    const limpo = valor.trim();
    if (limpo.length === 0 || cheiaNaTela) return;
    simulator.run((atual) => planPush(atual, { id: nextId('no'), value: limpo }));
    setValor('');
  }

  return (
    <SimulatorScaffold
      title="Pilha encadeada"
      subtitle="O mesmo TAD pilha, implementado com alocação dinâmica: cada elemento é um nó alocado individualmente e ligado ao anterior por um ponteiro."
      player={player}
      trace={trace}
      step={step}
      log={log}
      onReplay={simulator.replay}
      help={
        <DefaultHelp>
          Empilhe com push() e compare com a versão em vetor: mesmas complexidades, mas aqui
          não há capacidade fixa nem overflow.
        </DefaultHelp>
      }
      controls={
        <div className="flex flex-col gap-3">
          <ImplementationSwitch
            value={implementation}
            onChange={onImplementationChange}
            abstractType="pilha"
            hint="Na versão encadeada não há capacidade fixa nem overflow, e cada push religa dois ponteiros em vez de gravar numa posição."
          />

          <ControlPanel label="Operações da pilha encadeada">
            <ValueInput
              id="valor-pilha-encadeada"
              label="Valor"
              value={valor}
              onChange={setValor}
              onSubmit={empilhar}
              onRandom={() => {
                setValor(randomValue());
              }}
            />

            <OperationButton
              variant="insert"
              onClick={empilhar}
              disabled={semValor || cheiaNaTela}
              disabledReason={
                cheiaNaTela
                  ? `a visualização comporta no máximo ${LIMITE_VISUAL} nós`
                  : 'informe um valor para empilhar'
              }
            >
              push(valor)
            </OperationButton>

            <OperationButton
              variant="remove"
              onClick={() => {
                simulator.run(planPop);
              }}
              disabled={vazia}
              disabledReason="a pilha está vazia; um pop() causaria underflow"
            >
              pop()
            </OperationButton>

            <OperationButton
              variant="inspect"
              onClick={() => {
                simulator.run(planPeek);
              }}
              disabled={vazia}
              disabledReason="a pilha está vazia; não há topo para consultar"
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
                simulator.reset(
                  randomList('singly', SAMPLE_LIST_SIZE, () => nextId('no')),
                );
              }}
              hint="monta uma pilha com nós aleatórios, reiniciando a atual"
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
