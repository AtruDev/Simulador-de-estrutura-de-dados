import { useMemo } from 'react';
import {
  STACK_DEFAULT_CAPACITY,
  createStack,
  isEmpty,
  isFull,
  size,
} from '../../core/data-structures/stack';
import {
  planIsEmpty,
  planIsFull,
  planPeek,
  planPop,
  planPush,
} from '../../core/step-engine/stack-steps';
import { nextId } from '../../core/ids';
import { useSimulator } from '../../hooks/useSimulator';
import { usePlayerShortcuts } from '../../hooks/usePlayerShortcuts';
import { useStepPlayer } from '../../hooks/useStepPlayer';
import type { StackHighlight, StackSnapshot } from '../../types/structures';
import type { StackState } from '../../core/data-structures/stack';
import { ComplexityBadge } from '../shared/ComplexityBadge';
import { OperationLog } from '../shared/OperationLog';
import { PlaybackControls } from '../shared/PlaybackControls';
import { PseudocodePanel } from '../shared/PseudocodePanel';
import { SimulatorLayout } from '../shared/SimulatorLayout';
import { StepDescription } from '../shared/StepDescription';
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

  const player = useStepPlayer({
    traceId: sceneKey,
    totalSteps: trace?.steps.length ?? 0,
  });
  usePlayerShortcuts(player, trace !== null);

  const step = trace?.steps[Math.min(player.index, trace.steps.length - 1)] ?? null;

  // Sem operação em cena, a visualização mostra o estado consolidado.
  const snapshot: StackSnapshot = useMemo(
    () => step?.snapshot ?? { state, floating: null },
    [step, state],
  );

  const notices = useMemo(() => buildNotices(state), [state]);

  return (
    <SimulatorLayout
      title="Pilha (Stack)"
      subtitle="Estrutura LIFO baseada em array: o último elemento a entrar é o primeiro a sair."
      controls={
        <div className="flex flex-col gap-3">
          <StackControls
            state={state}
            onPush={(valor) => {
              simulator.run((atual) =>
                planPush(atual, { id: nextId('item'), value: valor }),
              );
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
      playback={<PlaybackControls player={player} disabled={trace === null} />}
      side={
        <>
          {trace !== null && step !== null ? (
            <>
              <StepDescription
                title={step.title}
                description={step.description}
                tone={step.tone}
                stepNumber={player.index + 1}
                totalSteps={trace.steps.length}
                operation={trace.label}
              />
              <ComplexityBadge complexity={trace.complexity} operation={trace.label} />
              <PseudocodePanel pseudocode={trace.pseudocode} activeLine={step.codeLine} />
            </>
          ) : (
            <section className="painel p-4">
              <h2 className="painel-titulo">Como usar</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Digite um valor e execute uma operação. Cada operação é decomposta em
                passos: use <strong>Reproduzir</strong> para assistir, ou avance passo a
                passo com as setas <kbd className="rounded border border-slate-300 bg-slate-50 px-1 font-mono text-xs">←</kbd>{' '}
                <kbd className="rounded border border-slate-300 bg-slate-50 px-1 font-mono text-xs">→</kbd>{' '}
                do teclado.
              </p>
            </section>
          )}

          <OperationLog
            entries={log}
            activeTraceId={trace?.id ?? null}
            onReplay={simulator.replay}
          />
        </>
      }
    />
  );
}
