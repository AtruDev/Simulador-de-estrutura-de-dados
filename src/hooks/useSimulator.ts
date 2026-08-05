/**
 * Orquestra uma estrutura: dispara operações, guarda a trilha em cena e mantém
 * o log da sessão.
 *
 * É genérico sobre a estrutura — a única exigência é que o snapshot exponha o
 * estado puro em `snapshot.state`, o que permite ao hook saber em que estado a
 * estrutura ficou ao final de cada operação.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { LogEntry, OperationTrace } from '../types/step';
import { finalSnapshot } from '../types/step';

/** Contrato mínimo de um snapshot: precisa expor o estado puro da estrutura. */
export interface SnapshotWithState<TState> {
  readonly state: TState;
}

interface Scene<TSnapshot, THighlight> {
  readonly trace: OperationTrace<TSnapshot, THighlight>;
  /**
   * Identidade da *exibição*. Distinta do `trace.id` porque rever a mesma
   * operação duas vezes deve reiniciar a animação sem confundir o log.
   */
  readonly key: string;
}

export interface SimulatorController<
  TState,
  TSnapshot extends SnapshotWithState<TState>,
  THighlight,
> {
  /** Estado consolidado após a última operação disparada. */
  readonly state: TState;
  /** Trilha em cena, ou `null` enquanto nenhuma operação foi executada. */
  readonly trace: OperationTrace<TSnapshot, THighlight> | null;
  /** Muda a cada nova exibição — é o que reinicia o reprodutor de passos. */
  readonly sceneKey: string | null;
  readonly log: readonly LogEntry<TSnapshot, THighlight>[];
  /** Executa um planejador contra o estado atual e coloca a trilha em cena. */
  readonly run: (planner: (state: TState) => OperationTrace<TSnapshot, THighlight>) => void;
  /** Recoloca em cena uma trilha já registrada no log (revisão pelo aluno). */
  readonly replay: (trace: OperationTrace<TSnapshot, THighlight>) => void;
  /** Reinicia a estrutura, limpando trilha e log. */
  readonly reset: (state: TState) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function useSimulator<TState, TSnapshot extends SnapshotWithState<TState>, THighlight>(
  initialState: TState,
): SimulatorController<TState, TSnapshot, THighlight> {
  const [state, setState] = useState<TState>(initialState);
  const [scene, setScene] = useState<Scene<TSnapshot, THighlight> | null>(null);
  const [log, setLog] = useState<readonly LogEntry<TSnapshot, THighlight>[]>([]);
  const sceneCounter = useRef(0);

  const nextSceneKey = useCallback((traceId: string) => {
    sceneCounter.current += 1;
    return `${traceId}#${sceneCounter.current.toString(36)}`;
  }, []);

  const run = useCallback(
    (planner: (current: TState) => OperationTrace<TSnapshot, THighlight>) => {
      // `run` só é chamado a partir de manipuladores de evento, que sempre
      // enxergam o `state` da última renderização. Planejar aqui — e não dentro
      // de um *updater* — evita efeitos colaterais duplicados sob StrictMode.
      const trace = planner(state);
      setScene({ trace, key: nextSceneKey(trace.id) });
      setLog((entries) => [
        ...entries,
        { trace, time: formatTime(new Date()), sequence: entries.length + 1 },
      ]);
      // O estado consolidado avança imediatamente para o final da operação;
      // a animação apenas reconstitui o caminho até ele.
      setState(finalSnapshot(trace).state);
    },
    [state, nextSceneKey],
  );

  const replay = useCallback(
    (trace: OperationTrace<TSnapshot, THighlight>) => {
      // Rever é só revisão: não altera o estado consolidado nem o log.
      setScene({ trace, key: nextSceneKey(trace.id) });
    },
    [nextSceneKey],
  );

  const reset = useCallback((next: TState) => {
    setState(next);
    setScene(null);
    setLog([]);
  }, []);

  return useMemo(
    () => ({
      state,
      trace: scene?.trace ?? null,
      sceneKey: scene?.key ?? null,
      log,
      run,
      replay,
      reset,
    }),
    [state, scene, log, run, replay, reset],
  );
}
