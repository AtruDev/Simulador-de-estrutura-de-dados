/**
 * Reprodutor da trilha de passos: play/pause, avançar/voltar e velocidade.
 *
 * O hook conhece apenas *quantos* passos existem e *qual* trilha está em cena —
 * nunca o conteúdo dos passos. Isso o mantém reutilizável por todas as
 * estruturas e testável independentemente da visualização.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

/** Duração de um passo em velocidade 1×. */
const BASE_STEP_DURATION_MS = 1400;

/** Multiplicadores oferecidos ao usuário. */
export const SPEED_OPTIONS = [0.5, 1, 1.5, 2, 3] as const;

export type PlaybackSpeed = (typeof SPEED_OPTIONS)[number];

export interface StepPlayerOptions {
  /** Identidade da trilha atual. Ao mudar, a reprodução recomeça do passo 1. */
  readonly traceId: string | null;
  readonly totalSteps: number;
  /** Inicia a reprodução automaticamente ao receber uma trilha nova. */
  readonly autoPlay?: boolean;
}

export interface StepPlayer {
  /** Índice do passo atual, base 0. */
  readonly index: number;
  readonly totalSteps: number;
  readonly isPlaying: boolean;
  readonly isAtStart: boolean;
  readonly isAtEnd: boolean;
  readonly speed: PlaybackSpeed;
  /** Duração do passo atual em ms — usada para sincronizar as animações. */
  readonly stepDurationMs: number;
  readonly play: () => void;
  readonly pause: () => void;
  readonly togglePlay: () => void;
  readonly next: () => void;
  readonly previous: () => void;
  readonly goTo: (index: number) => void;
  readonly restart: () => void;
  readonly setSpeed: (speed: PlaybackSpeed) => void;
}

export function useStepPlayer({
  traceId,
  totalSteps,
  autoPlay = true,
}: StepPlayerOptions): StepPlayer {
  const [index, setIndex] = useState(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  /**
   * Intenção do usuário de reproduzir. O `isPlaying` efetivo é derivado dela:
   * ao chegar no último passo a reprodução cessa sozinha, sem precisar de um
   * efeito que sincronize estado (o que causaria renderizações em cascata).
   */
  const [playRequested, setPlayRequested] = useState(false);
  const [renderedTraceId, setRenderedTraceId] = useState(traceId);

  const lastIndex = Math.max(0, totalSteps - 1);

  // Trilha nova: ajuste de estado durante a renderização — padrão recomendado
  // pelo React para reagir à mudança de uma prop sem passar por useEffect.
  if (traceId !== renderedTraceId) {
    setRenderedTraceId(traceId);
    setIndex(0);
    setPlayRequested(autoPlay && traceId !== null && totalSteps > 1);
  }

  const isPlaying = playRequested && index < lastIndex;

  // Avanço automático. O único setState acontece dentro do callback do timer,
  // não no corpo do efeito.
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => Math.min(current + 1, lastIndex));
    }, BASE_STEP_DURATION_MS / speed);
    return () => {
      window.clearTimeout(timer);
    };
  }, [isPlaying, index, lastIndex, speed]);

  const goTo = useCallback(
    (target: number) => {
      setPlayRequested(false);
      setIndex(Math.min(Math.max(0, target), Math.max(0, totalSteps - 1)));
    },
    [totalSteps],
  );

  const next = useCallback(() => {
    setPlayRequested(false);
    setIndex((current) => Math.min(current + 1, Math.max(0, totalSteps - 1)));
  }, [totalSteps]);

  const previous = useCallback(() => {
    setPlayRequested(false);
    setIndex((current) => Math.max(current - 1, 0));
  }, []);

  const play = useCallback(() => {
    // Reproduzir a partir do último passo recomeça a trilha, evitando um
    // clique que não produz efeito visível.
    setIndex((current) => (current >= Math.max(0, totalSteps - 1) ? 0 : current));
    setPlayRequested(totalSteps > 1);
  }, [totalSteps]);

  const pause = useCallback(() => {
    setPlayRequested(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const restart = useCallback(() => {
    setIndex(0);
    setPlayRequested(totalSteps > 1);
  }, [totalSteps]);

  return useMemo(
    () => ({
      index: Math.min(index, lastIndex),
      totalSteps,
      isPlaying,
      isAtStart: index <= 0,
      isAtEnd: index >= lastIndex,
      speed,
      stepDurationMs: BASE_STEP_DURATION_MS / speed,
      play,
      pause,
      togglePlay,
      next,
      previous,
      goTo,
      restart,
      setSpeed,
    }),
    [
      index,
      lastIndex,
      totalSteps,
      isPlaying,
      speed,
      play,
      pause,
      togglePlay,
      next,
      previous,
      goTo,
      restart,
    ],
  );
}
