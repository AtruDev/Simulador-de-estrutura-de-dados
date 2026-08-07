import { useId } from 'react';

/** Como o TAD está implementado por baixo. */
export type Implementation = 'array' | 'linked';

interface ImplementationSwitchProps {
  readonly value: Implementation;
  readonly onChange: (value: Implementation) => void;
  /** Nome do TAD, ex.: `'pilha'` — aparece no texto de apoio. */
  readonly abstractType: string;
  /** O que muda de uma implementação para a outra, em uma frase. */
  readonly hint: string;
}

const OPCOES: readonly { readonly id: Implementation; readonly label: string }[] = [
  { id: 'array', label: 'Vetor' },
  { id: 'linked', label: 'Encadeada' },
];

/**
 * Alterna entre as duas implementações do mesmo tipo abstrato.
 *
 * Fica separado do painel de operações de propósito: escolher entre vetor e
 * ponteiros não é uma operação do TAD, é uma decisão de implementação — e é
 * justamente essa distinção que a primeira unidade da disciplina ensina.
 * Trocar reinicia a estrutura, porque o estado de uma não é o da outra.
 */
export function ImplementationSwitch({
  value,
  onChange,
  abstractType,
  hint,
}: ImplementationSwitchProps) {
  const grupo = useId();

  return (
    <section className="painel flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <span id={grupo} className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Implementação
        </span>
        <div
          className="flex overflow-hidden rounded-lg border border-slate-300"
          role="group"
          aria-labelledby={grupo}
        >
          {OPCOES.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              onClick={() => {
                onChange(opcao.id);
              }}
              aria-pressed={value === opcao.id}
              title={`Trocar a implementação reinicia a ${abstractType}`}
              className={`h-9 px-3.5 text-sm font-semibold transition-colors ${
                value === opcao.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opcao.label}
            </button>
          ))}
        </div>
      </div>

      <p className="min-w-0 flex-1 text-sm text-slate-500">
        Mesmo TAD, mesmas operações, mesmas complexidades. {hint}
      </p>
    </section>
  );
}
