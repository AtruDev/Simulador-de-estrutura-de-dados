import type { LogEntry, OperationTrace } from '../../types/step';

interface OperationLogProps<TSnapshot, THighlight> {
  readonly entries: readonly LogEntry<TSnapshot, THighlight>[];
  /** Identificador da trilha em cena, para marcar a entrada correspondente. */
  readonly activeTraceId: string | null;
  readonly onReplay: (trace: OperationTrace<TSnapshot, THighlight>) => void;
}

/**
 * Histórico das operações da sessão. Cada entrada pode ser recolocada em cena,
 * para que o aluno reveja a animação depois.
 */
export function OperationLog<TSnapshot, THighlight>({
  entries,
  activeTraceId,
  onReplay,
}: OperationLogProps<TSnapshot, THighlight>) {
  // Mais recentes no topo: evita rolagem automática e é o que o aluno procura.
  const recentesPrimeiro = [...entries].reverse();

  return (
    <section className="painel flex min-h-0 flex-col overflow-hidden" aria-labelledby="titulo-log">
      <div className="flex items-baseline justify-between border-b border-slate-200 px-4 py-3">
        <h2 id="titulo-log" className="painel-titulo">
          Log de operações
        </h2>
        <span className="text-xs tabular-nums text-slate-400">
          {entries.length} {entries.length === 1 ? 'operação' : 'operações'}
        </span>
      </div>

      {recentesPrimeiro.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-400">
          Nenhuma operação executada ainda. Use os controles acima para começar.
        </p>
      ) : (
        <ol className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
          {recentesPrimeiro.map((entry) => {
            const emCena = entry.trace.id === activeTraceId;
            const erro = entry.trace.outcome === 'error';
            return (
              <li key={`${entry.sequence}-${entry.trace.id}`}>
                <button
                  type="button"
                  onClick={() => {
                    onReplay(entry.trace);
                  }}
                  aria-current={emCena ? 'true' : undefined}
                  title="Rever esta operação passo a passo"
                  className={`w-full px-4 py-2.5 text-left transition-colors hover:bg-slate-50 ${
                    emCena ? 'bg-indigo-50/70' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-xs tabular-nums text-slate-400">
                      {entry.sequence}
                    </span>
                    <span
                      className={`font-mono text-sm font-semibold ${
                        erro ? 'text-rose-700' : 'text-slate-800'
                      }`}
                    >
                      {entry.trace.label}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                      {entry.trace.complexity.notation}
                    </span>
                    <span className="ml-auto shrink-0 text-xs tabular-nums text-slate-400">
                      {entry.time}
                    </span>
                  </div>
                  <p
                    className={`mt-0.5 pl-8 text-xs leading-snug ${
                      erro ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    {entry.trace.summary}
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
