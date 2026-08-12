import type { Pseudocode } from '../../types/step';

interface PseudocodePanelProps {
  readonly pseudocode: Pseudocode;
  /** Linha correspondente ao passo atual, ou `null`. */
  readonly activeLine: number | null;
}

/** Pseudocódigo da operação, com a linha do passo atual destacada. */
export function PseudocodePanel({ pseudocode, activeLine }: PseudocodePanelProps) {
  return (
    <section className="painel overflow-hidden" aria-labelledby="titulo-pseudocodigo">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 id="titulo-pseudocodigo" className="painel-titulo">
          Pseudocódigo
        </h2>
        <p className="mt-1 font-mono text-sm text-slate-700">{pseudocode.title}</p>
      </div>

      {/* O pseudocódigo rola na horizontal em vez de ser cortado: linhas com
          comentário de complexidade passam da largura do painel, e cortar o fim
          da linha esconderia justamente a parte que explica o custo.

          A rolagem fica no container e a largura na lista (`w-max min-w-full`,
          isto é, a largura da linha mais longa e nunca menos que o painel).
          Assim todas as linhas têm a mesma largura, e o realce da linha ativa
          atravessa a faixa inteira em vez de parar no fim do próprio texto. */}
      <div className="overflow-x-auto">
        <ol className="w-max min-w-full py-2 font-mono text-[13px] leading-6">
          {pseudocode.lines.map((linha, numero) => {
            const ativa = numero === activeLine;
            return (
              <li
                key={numero}
                aria-current={ativa ? 'step' : undefined}
                className={`flex w-full gap-3 px-4 transition-colors ${
                  ativa
                    ? 'bg-indigo-100 font-semibold text-indigo-950'
                    : 'text-slate-600'
                }`}
              >
                <span
                  className={`w-4 shrink-0 select-none text-right tabular-nums ${
                    ativa ? 'text-indigo-500' : 'text-slate-300'
                  }`}
                  aria-hidden="true"
                >
                  {numero + 1}
                </span>
                <span className="whitespace-pre">{linha}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
