import type { Complexity } from '../../types/step';

interface ComplexityBadgeProps {
  readonly complexity: Complexity;
  /** Nome da operação a que a complexidade se refere, ex.: `'push(42)'`. */
  readonly operation: string;
}

/** Complexidade assintótica da operação em cena, com a justificativa. */
export function ComplexityBadge({ complexity, operation }: ComplexityBadgeProps) {
  return (
    <section className="painel p-4" aria-labelledby="titulo-complexidade">
      <h2 id="titulo-complexidade" className="painel-titulo">
        Complexidade
      </h2>

      <div className="mt-3 flex items-baseline gap-3">
        <span className="rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-lg font-bold text-white">
          {complexity.notation}
        </span>
        <span className="font-mono text-sm text-slate-600">{operation}</span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-600">{complexity.rationale}</p>
    </section>
  );
}
