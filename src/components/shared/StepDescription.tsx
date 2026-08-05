import type { StepTone } from '../../types/step';
import { TONE_STYLES } from './emphasis';

interface StepDescriptionProps {
  readonly title: string;
  readonly description: string;
  readonly tone: StepTone;
  readonly stepNumber: number;
  readonly totalSteps: number;
  /** Assinatura da operação em cena, ex.: `'push(42)'`. */
  readonly operation: string;
}

/** Descrição textual do passo atual, exibida junto à animação. */
export function StepDescription({
  title,
  description,
  tone,
  stepNumber,
  totalSteps,
  operation,
}: StepDescriptionProps) {
  const style = TONE_STYLES[tone];

  return (
    <section
      className={`rounded-xl border p-4 transition-colors ${style.panel}`}
      aria-labelledby="titulo-passo"
      // O aluno que usa leitor de tela precisa ouvir a mudança de passo.
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-70">
        <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
        <span>
          Passo {stepNumber} de {totalSteps}
        </span>
        <span aria-hidden="true">·</span>
        <span className="font-mono normal-case tracking-normal">{operation}</span>
      </div>

      <h2 id="titulo-passo" className="mt-2 text-lg font-bold">
        {title}
      </h2>
      <p className="mt-1.5 leading-relaxed">{description}</p>
    </section>
  );
}
