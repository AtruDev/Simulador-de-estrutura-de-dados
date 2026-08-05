import { AnimatePresence, motion } from 'framer-motion';
import { capacity, isEmpty, logicalPosition, toArray } from '../../core/data-structures/queue';
import type { QueueHighlight, QueueSnapshot } from '../../types/structures';
import { EMPHASIS, EMPTY_SLOT_BOX, NEUTRAL_BOX, findRole } from '../shared/emphasis';

interface QueueViewProps {
  readonly snapshot: QueueSnapshot;
  readonly highlights: readonly QueueHighlight[];
  readonly durationMs: number;
}

/** Dimensões das células, reduzidas em filas grandes para caber na tela. */
function cellSize(cap: number): { readonly box: string; readonly text: string } {
  if (cap <= 8) return { box: 'h-16 w-16', text: 'text-xl' };
  if (cap <= 12) return { box: 'h-14 w-14', text: 'text-lg' };
  if (cap <= 16) return { box: 'h-12 w-12', text: 'text-base' };
  return { box: 'h-11 w-11', text: 'text-sm' };
}

/**
 * Visualização da fila: array circular desenhado na horizontal, com os
 * ponteiros de início e fim acima das posições que ocupam e um conector abaixo
 * indicando que o array dá a volta.
 */
export function QueueView({ snapshot, highlights, durationMs }: QueueViewProps) {
  const { state, floating } = snapshot;
  const cap = capacity(state);
  const { box, text } = cellSize(cap);
  const duracao = durationMs / 1000;
  const vazia = isEmpty(state);

  const papelInicio = findRole(highlights, (h) => h.kind === 'pointer' && h.pointer === 'front');
  const papelFim = findRole(highlights, (h) => h.kind === 'pointer' && h.pointer === 'rear');
  const papelFlutuante = findRole(highlights, (h) => h.kind === 'floating');

  const posicoes = Array.from({ length: cap }, (_, i) => i);
  const ordemLogica = toArray(state);

  return (
    <div className="flex flex-col items-center gap-4 overflow-x-auto">
      {/* Faixa do elemento em trânsito. */}
      <div className="flex h-14 items-center justify-center" aria-hidden={floating === null}>
        <AnimatePresence mode="wait">
          {floating !== null && (
            <motion.div
              key={`${floating.item.id}-${floating.phase}`}
              initial={{ opacity: 0, y: -20, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: floating.phase === 'leaving' ? -20 : 14, scale: 0.85 }}
              transition={{ duration: Math.min(duracao * 0.5, 0.4) }}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={`flex ${box} items-center justify-center rounded-lg border-2 font-mono ${text} font-bold shadow-md ${
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

      <div className="flex flex-col items-center">
        {/* Ponteiros de início e fim, acima das posições que ocupam. */}
        <div className="flex" aria-hidden="true">
          {posicoes.map((indice) => (
            <div key={indice} className={`flex ${box} h-auto flex-col items-center justify-end gap-0.5 pb-1`}>
              {indice === state.front && (
                <motion.span
                  layout
                  transition={{ duration: Math.min(duracao * 0.4, 0.3) }}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase leading-tight ${
                    papelInicio !== null
                      ? EMPHASIS[papelInicio].box
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  início
                </motion.span>
              )}
              {indice === state.rear && (
                <motion.span
                  layout
                  transition={{ duration: Math.min(duracao * 0.4, 0.3) }}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase leading-tight ${
                    papelFim !== null ? EMPHASIS[papelFim].box : 'bg-violet-100 text-violet-800'
                  }`}
                >
                  fim
                </motion.span>
              )}
              <span className="text-xs leading-none text-slate-400">
                {indice === state.front || indice === state.rear ? '▼' : ' '}
              </span>
            </div>
          ))}
        </div>

        {/* Células do array. */}
        <ol
          className="flex overflow-hidden rounded-lg border-2 border-slate-400 bg-slate-100"
          aria-label={`Fila com ${state.count} de ${cap} posições ocupadas, do início ao fim`}
        >
          {posicoes.map((indice) => {
            const item = state.slots[indice] ?? null;
            const papel = findRole(highlights, (h) => h.kind === 'slot' && h.index === indice);
            const posicaoLogica = logicalPosition(state, indice);

            const estilo =
              papel !== null
                ? EMPHASIS[papel].box
                : item !== null
                  ? NEUTRAL_BOX
                  : EMPTY_SLOT_BOX;

            return (
              <li key={indice} className="border-r border-slate-200 last:border-r-0">
                <motion.div
                  layout
                  transition={{ duration: Math.min(duracao * 0.4, 0.3) }}
                  className={`flex ${box} items-center justify-center border-2 border-transparent font-mono ${text} font-bold transition-colors ${estilo}`}
                >
                  {item !== null ? (
                    <span>
                      {item.value}
                      <span className="sr-only">
                        {' '}
                        (posição {posicaoLogica + 1} da fila
                        {papel !== null ? `, ${EMPHASIS[papel].label}` : ''})
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs font-normal italic text-slate-400">livre</span>
                  )}
                </motion.div>
              </li>
            );
          })}
        </ol>

        {/* Índices físicos do array. */}
        <div className="flex" aria-hidden="true">
          {posicoes.map((indice) => (
            <span
              key={indice}
              className={`flex ${box} h-5 items-center justify-center font-mono text-xs text-slate-400`}
            >
              {indice}
            </span>
          ))}
        </div>

        {/* Conector que evidencia a volta do array. */}
        <div className="relative mt-1 w-full" aria-hidden="true">
          <div className="h-4 rounded-b-lg border-b-2 border-l-2 border-r-2 border-dashed border-slate-300" />
          <span className="absolute left-1/2 top-2.5 -translate-x-1/2 bg-white px-2 font-mono text-[11px] text-slate-400">
            ↩ (índice + 1) mod {cap} — o array dá a volta
          </span>
        </div>
      </div>

      {/* Ordem lógica de saída — nem sempre coincide com a ordem física. */}
      <p className="mt-3 text-sm text-slate-600">
        <span className="font-semibold">Ordem de saída:</span>{' '}
        {vazia ? (
          <span className="italic text-slate-400">fila vazia</span>
        ) : (
          <span className="font-mono">{ordemLogica.join(' → ')}</span>
        )}
      </p>

      {/* Estado dos ponteiros, em texto. */}
      <p className="font-mono text-sm text-slate-600">
        início = <span className="font-bold text-indigo-700">{state.front}</span>
        <span className="mx-2 text-slate-300">|</span>
        fim = <span className="font-bold text-violet-700">{state.rear}</span>
        <span className="mx-2 text-slate-300">|</span>
        total ={' '}
        <span className={`font-bold ${vazia ? 'text-rose-600' : 'text-slate-800'}`}>
          {state.count}
        </span>
        <span className="mx-2 text-slate-300">|</span>
        capacidade = <span className="font-bold text-slate-800">{cap}</span>
      </p>

      {vazia && (
        <p className="text-sm italic text-slate-400">
          A fila está vazia: início e fim coincidem, e é o total = 0 que distingue este
          estado de uma fila cheia.
        </p>
      )}
    </div>
  );
}
