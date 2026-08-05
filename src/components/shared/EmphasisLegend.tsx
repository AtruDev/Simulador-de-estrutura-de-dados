import type { EmphasisRole } from '../../types/step';
import { EMPHASIS } from './emphasis';

/** Ordem de exibição, da inserção à consulta. */
const ORDEM: readonly EmphasisRole[] = [
  'entering',
  'leaving',
  'inspected',
  'found',
  'target',
  'anchor',
];

/**
 * Legenda das cores de destaque. O mesmo código de cores vale nas três
 * estruturas, então o aluno o aprende uma vez só.
 */
export function EmphasisLegend() {
  return (
    <section
      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1"
      aria-label="Legenda das cores de destaque"
    >
      <span className="painel-titulo">Legenda</span>
      {ORDEM.map((role) => (
        <span key={role} className="flex items-center gap-1.5 text-xs text-slate-600">
          <span
            className={`h-3.5 w-3.5 shrink-0 rounded border-2 ${EMPHASIS[role].box}`}
            aria-hidden="true"
          />
          {EMPHASIS[role].label}
        </span>
      ))}
    </section>
  );
}
