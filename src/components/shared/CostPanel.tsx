import type { StepCounts } from '../../types/step';

interface CostPanelProps {
  /** Trabalho acumulado até o passo em cena. */
  readonly current: StepCounts;
  /** Trabalho total da operação, quando ela chega ao fim. */
  readonly total: StepCounts;
}

interface Linha {
  readonly rotulo: string;
  readonly ajuda: string;
  readonly agora: number;
  readonly fim: number;
}

/**
 * Custo medido da operação em cena — a contrapartida empírica da complexidade
 * assintótica exibida ao lado.
 *
 * O aluno vê o Big-O e, logo abaixo, os números que o justificam crescerem
 * passo a passo: `search` numa lista de dez nós soma dez comparações, e é daí
 * que sai o n de O(n).
 */
export function CostPanel({ current, total }: CostPanelProps) {
  const linhas: readonly Linha[] = [
    {
      rotulo: 'Comparações',
      ajuda: 'comparações entre valores',
      agora: current.comparisons,
      fim: total.comparisons,
    },
    {
      rotulo: 'Movimentações',
      ajuda: 'gravações de valor e religações de ponteiro',
      agora: current.moves,
      fim: total.moves,
    },
    {
      rotulo: 'Visitas',
      ajuda: 'posições ou nós alcançados',
      agora: current.visits,
      fim: total.visits,
    },
  ];

  const semTrabalho = total.comparisons + total.moves + total.visits === 0;

  return (
    <section className="painel p-4" aria-labelledby="titulo-custo">
      <h2 id="titulo-custo" className="painel-titulo">
        Custo medido
      </h2>

      <dl className="mt-3 flex flex-col gap-2">
        {linhas.map((linha) => (
          <div key={linha.rotulo} className="flex items-baseline gap-2">
            <dt className="text-sm text-slate-600" title={linha.ajuda}>
              {linha.rotulo}
            </dt>
            <span className="min-w-0 flex-1 border-b border-dotted border-slate-200" />
            <dd className="shrink-0 font-mono text-sm tabular-nums">
              <span
                className={
                  linha.agora > 0 ? 'font-bold text-slate-900' : 'text-slate-400'
                }
              >
                {linha.agora}
              </span>
              <span className="text-slate-400"> / {linha.fim}</span>
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        {semTrabalho
          ? 'Esta operação não percorre nem altera a estrutura: só consulta um ponteiro, e por isso é O(1).'
          : 'Acumulado até o passo atual, seguido do total da operação. Verificações de borda (lista vazia, fila cheia) não entram na conta — a análise de algoritmos mede as operações que crescem com o tamanho da entrada.'}
      </p>
    </section>
  );
}
