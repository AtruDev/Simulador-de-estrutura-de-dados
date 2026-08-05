import { AnimatePresence, motion } from 'framer-motion';
import { topIndex } from '../../core/data-structures/stack';
import type { StackHighlight, StackSnapshot } from '../../types/structures';
import { EMPHASIS, EMPTY_SLOT_BOX, NEUTRAL_BOX, findRole } from '../shared/emphasis';

interface StackViewProps {
  readonly snapshot: StackSnapshot;
  readonly highlights: readonly StackHighlight[];
  /** Duração das transições, sincronizada com a velocidade da reprodução. */
  readonly durationMs: number;
}

/** Altura das células, reduzida em pilhas grandes para caber na tela. */
function cellHeight(capacity: number): string {
  if (capacity <= 10) return 'h-12';
  if (capacity <= 15) return 'h-10';
  return 'h-8';
}

/**
 * Visualização da pilha: array vertical, base embaixo e topo em cima, com o
 * índice de cada posição à esquerda e o marcador de topo à direita.
 */
export function StackView({ snapshot, highlights, durationMs }: StackViewProps) {
  const { state, floating } = snapshot;
  const indiceTopo = topIndex(state);
  const altura = cellHeight(state.capacity);
  const duracao = durationMs / 1000;

  // Posições de cima (última do array) para baixo (base).
  const posicoes = Array.from({ length: state.capacity }, (_, i) => state.capacity - 1 - i);

  const papelPonteiroTopo = findRole(
    highlights,
    (h) => h.kind === 'pointer' && h.pointer === 'top',
  );
  const papelFlutuante = findRole(highlights, (h) => h.kind === 'floating');

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Faixa do elemento em trânsito, fora da estrutura. */}
      <div className="flex h-14 items-center justify-center" aria-hidden={floating === null}>
        <AnimatePresence mode="wait">
          {floating !== null && (
            <motion.div
              key={`${floating.item.id}-${floating.phase}`}
              initial={{ opacity: 0, y: floating.phase === 'entering' ? -24 : 0, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: floating.phase === 'leaving' ? -24 : 12, scale: 0.85 }}
              transition={{ duration: Math.min(duracao * 0.5, 0.4) }}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={`flex ${altura} w-32 items-center justify-center rounded-lg border-2 font-mono text-xl font-bold shadow-md ${
                  papelFlutuante !== null
                    ? EMPHASIS[papelFlutuante].box
                    : EMPHASIS[floating.phase === 'entering' ? 'entering' : 'leaving'].box
                }`}
              >
                {floating.item.value}
              </div>
              <span className="text-xs font-medium text-slate-500">
                {floating.phase === 'entering' ? 'novo elemento' : 'elemento removido'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Array da pilha. */}
      <div className="flex items-stretch gap-3">
        {/* Coluna dos índices. */}
        <ol className="flex flex-col" aria-hidden="true">
          {posicoes.map((indice) => (
            <li
              key={indice}
              className={`flex ${altura} w-7 items-center justify-end pr-1 font-mono text-xs text-slate-400`}
            >
              {indice}
            </li>
          ))}
        </ol>

        {/* Células. */}
        <ol
          className="flex flex-col overflow-hidden rounded-lg border-2 border-slate-400 bg-slate-100"
          aria-label={`Pilha com ${state.items.length} de ${state.capacity} posições ocupadas, da base ao topo`}
        >
          {posicoes.map((indice) => {
            const item = state.items[indice];
            const papel = findRole(
              highlights,
              (h) => h.kind === 'slot' && h.index === indice,
            );
            const ocupada = item !== undefined;

            const estilo = papel !== null
              ? EMPHASIS[papel].box
              : ocupada
                ? NEUTRAL_BOX
                : EMPTY_SLOT_BOX;

            return (
              <li key={indice} className="border-b border-slate-200 last:border-b-0">
                <motion.div
                  layout
                  transition={{ duration: Math.min(duracao * 0.4, 0.3) }}
                  className={`flex ${altura} w-40 items-center justify-center border-2 border-transparent font-mono text-xl font-bold transition-colors ${estilo}`}
                >
                  {ocupada ? (
                    <span>
                      {item.value}
                      {papel !== null && (
                        <span className="sr-only"> ({EMPHASIS[papel].label})</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-sm font-normal italic">vazio</span>
                  )}
                </motion.div>
              </li>
            );
          })}
        </ol>

        {/* Coluna dos marcadores (topo e base). */}
        <div className="relative w-28">
          {posicoes.map((indice) => {
            const eTopo = indice === indiceTopo;
            const eBase = indice === 0 && state.items.length > 0;
            return (
              <div key={indice} className={`flex ${altura} items-center`}>
                {eTopo && (
                  <motion.span
                    layout
                    transition={{ duration: Math.min(duracao * 0.4, 0.3) }}
                    className={`rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                      papelPonteiroTopo !== null
                        ? EMPHASIS[papelPonteiroTopo].box
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    ← topo
                  </motion.span>
                )}
                {eBase && !eTopo && (
                  <span className="rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    ← base
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Estado dos ponteiros, em texto — o que o aluno anota no caderno. */}
      <p className="font-mono text-sm text-slate-600">
        topo ={' '}
        <span
          className={`font-bold ${indiceTopo < 0 ? 'text-rose-600' : 'text-indigo-700'}`}
        >
          {indiceTopo}
        </span>
        <span className="mx-2 text-slate-300">|</span>
        capacidade = <span className="font-bold text-slate-800">{state.capacity}</span>
      </p>

      {state.items.length === 0 && (
        <p className="text-sm italic text-slate-400">
          A pilha está vazia: não há topo (topo = -1).
        </p>
      )}
    </div>
  );
}
