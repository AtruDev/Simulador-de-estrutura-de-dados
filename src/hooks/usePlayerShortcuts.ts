/**
 * Atalhos de teclado para conduzir a animação durante a aula, sem tirar a mão
 * do teclado: barra de espaço reproduz/pausa, setas avançam e voltam passos.
 *
 * Os atalhos são ignorados enquanto o foco está num campo de texto, para não
 * atrapalhar a digitação de valores.
 */

import { useEffect } from 'react';
import type { StepPlayer } from './useStepPlayer';

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function usePlayerShortcuts(player: StepPlayer, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case ' ':
          event.preventDefault();
          player.togglePlay();
          break;
        case 'ArrowRight':
          event.preventDefault();
          player.next();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          player.previous();
          break;
        case 'Home':
          event.preventDefault();
          player.restart();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [player, enabled]);
}
