import type { ReactNode } from 'react';
import type { StepPlayer } from '../../hooks/useStepPlayer';
import type { LogEntry, OperationTrace, Step } from '../../types/step';
import { ComplexityBadge } from './ComplexityBadge';
import { CostPanel } from './CostPanel';
import { OperationLog } from './OperationLog';
import { PlaybackControls } from './PlaybackControls';
import { PseudocodePanel } from './PseudocodePanel';
import { SimulatorLayout } from './SimulatorLayout';
import { StepDescription } from './StepDescription';

interface SimulatorScaffoldProps<TSnapshot, THighlight> {
  readonly title: string;
  readonly subtitle: string;
  /** Painel de controles específico da estrutura. */
  readonly controls: ReactNode;
  /** Visualização específica da estrutura. */
  readonly canvas: ReactNode;
  readonly player: StepPlayer;
  readonly trace: OperationTrace<TSnapshot, THighlight> | null;
  readonly step: Step<TSnapshot, THighlight> | null;
  readonly log: readonly LogEntry<TSnapshot, THighlight>[];
  readonly onReplay: (trace: OperationTrace<TSnapshot, THighlight>) => void;
  /** Orientação exibida antes da primeira operação. */
  readonly help: ReactNode;
}

/**
 * Casca comum às três estruturas: reúne descrição do passo, complexidade,
 * pseudocódigo, log e controles de reprodução em torno de uma visualização e de
 * um painel de controles próprios de cada estrutura.
 */
export function SimulatorScaffold<TSnapshot, THighlight>({
  title,
  subtitle,
  controls,
  canvas,
  player,
  trace,
  step,
  log,
  onReplay,
  help,
}: SimulatorScaffoldProps<TSnapshot, THighlight>) {
  return (
    <SimulatorLayout
      title={title}
      subtitle={subtitle}
      controls={controls}
      canvas={canvas}
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
              <CostPanel current={step.counts} total={trace.totals} />
              <PseudocodePanel pseudocode={trace.pseudocode} activeLine={step.codeLine} />
            </>
          ) : (
            <section className="painel p-4">
              <h2 className="painel-titulo">Como usar</h2>
              <div className="mt-2 text-sm leading-relaxed text-slate-600">{help}</div>
            </section>
          )}

          <OperationLog
            entries={log}
            activeTraceId={trace?.id ?? null}
            onReplay={onReplay}
          />
        </>
      }
    />
  );
}

/** Texto de ajuda padrão, comum às três estruturas. */
export function DefaultHelp({ children }: { readonly children: ReactNode }) {
  return (
    <p>
      {children} Cada operação é decomposta em passos: use <strong>Reproduzir</strong> para
      assistir, ou avance passo a passo com as setas{' '}
      <kbd className="rounded border border-slate-300 bg-slate-50 px-1 font-mono text-xs">←</kbd>{' '}
      <kbd className="rounded border border-slate-300 bg-slate-50 px-1 font-mono text-xs">→</kbd>{' '}
      do teclado.
    </p>
  );
}
