import type { EmphasisRole } from '../../types/step';
import { EMPHASIS_ARROW, NEUTRAL_ARROW } from '../shared/emphasis';

interface PointerArrowProps {
  /** `next` aponta para a direita; `prev`, para a esquerda. */
  readonly direction: 'next' | 'prev';
  readonly role: EmphasisRole | null;
  /** Seta que termina em NULL é desenhada tracejada. */
  readonly toNull?: boolean;
}

/**
 * Seta que representa um ponteiro entre nós. O rótulo (`next`/`prev`) fica
 * sobre a seta para que o aluno associe o desenho ao campo do nó.
 */
export function PointerArrow({ direction, role, toNull = false }: PointerArrowProps) {
  const paraDireita = direction === 'next';
  const cor = role !== null ? EMPHASIS_ARROW[role] : NEUTRAL_ARROW;
  const destacada = role !== null;

  return (
    <span className={`flex flex-col items-center leading-none ${cor}`}>
      <span
        className={`text-[9px] font-semibold uppercase tracking-wide transition-opacity ${
          destacada ? 'opacity-100' : 'opacity-50'
        }`}
      >
        {direction}
      </span>
      <svg
        width="52"
        height="12"
        viewBox="0 0 52 12"
        fill="none"
        aria-hidden="true"
        className="transition-colors"
      >
        <line
          x1={paraDireita ? 2 : 50}
          y1="6"
          x2={paraDireita ? 44 : 8}
          y2="6"
          stroke="currentColor"
          strokeWidth={destacada ? 2.5 : 1.75}
          strokeDasharray={toNull ? '4 3' : undefined}
        />
        <path
          d={paraDireita ? 'M44 1.5 L50 6 L44 10.5 Z' : 'M8 1.5 L2 6 L8 10.5 Z'}
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

/** Marcador de `NULL` desenhado nas extremidades da lista. */
export function NullBadge({ highlighted = false }: { readonly highlighted?: boolean }) {
  return (
    <span
      className={`rounded border px-2 py-1 font-mono text-xs font-bold transition-colors ${
        highlighted
          ? 'border-violet-400 bg-violet-50 text-violet-700'
          : 'border-slate-300 bg-slate-50 text-slate-500'
      }`}
    >
      NULL
    </span>
  );
}
