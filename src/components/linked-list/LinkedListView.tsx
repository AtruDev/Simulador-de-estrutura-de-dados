import { Fragment } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { isEmpty, toNodes } from '../../core/data-structures/linked-list';
import type { EmphasisRole } from '../../types/step';
import type { ListHighlight, ListSnapshot } from '../../types/structures';
import { EMPHASIS, NEUTRAL_BOX, findRole } from '../shared/emphasis';
import { NullBadge, PointerArrow } from './PointerArrow';

/**
 * Vocabulário dos ponteiros. A pilha e a fila encadeadas são listas ligadas por
 * dentro, mas em aula chamam-se topo, início e fim — o desenho é o mesmo, os
 * nomes é que mudam.
 */
export interface PointerNaming {
  /** Rótulo do primeiro nó: `'cabeça'`, `'topo'` ou `'início'`. */
  readonly head: string;
  /** Rótulo do último nó, ou `null` para escondê-lo (a pilha não expõe o fundo). */
  readonly tail: string | null;
  /** Frase exibida quando a estrutura está vazia. */
  readonly empty: string;
  /** Descrição da estrutura para leitores de tela. */
  readonly aria: string;
}

interface LinkedListViewProps {
  readonly snapshot: ListSnapshot;
  readonly highlights: readonly ListHighlight[];
  readonly durationMs: number;
  readonly naming?: PointerNaming;
}

function defaultNaming(state: ListSnapshot['state']): PointerNaming {
  const dupla = state.variant === 'doubly';
  return {
    head: 'cabeça',
    tail: 'cauda',
    empty: 'A lista está vazia: cabeça e cauda valem NULL.',
    aria: `Lista ${dupla ? 'duplamente' : 'simplesmente'} ligada com ${state.size} nós, da cabeça à cauda`,
  };
}

/** Dimensões dos nós, reduzidas em listas grandes. */
function nodeSize(total: number): { readonly box: string; readonly text: string } {
  if (total <= 8) return { box: 'h-16 w-20', text: 'text-xl' };
  if (total <= 14) return { box: 'h-14 w-16', text: 'text-lg' };
  return { box: 'h-12 w-14', text: 'text-base' };
}

/**
 * Visualização da lista ligada: nós como caixas conectadas por setas de
 * ponteiro, com cabeça e cauda rotuladas e `NULL` visível nas extremidades.
 */
export function LinkedListView({
  snapshot,
  highlights,
  durationMs,
  naming,
}: LinkedListViewProps) {
  const { state, floating } = snapshot;
  const nodes = toNodes(state);
  const dupla = state.variant === 'doubly';
  const nomes = naming ?? defaultNaming(state);
  const { box, text } = nodeSize(nodes.length);
  const duracao = durationMs / 1000;
  const vazia = isEmpty(state);

  const papelCabeca = findRole(highlights, (h) => h.kind === 'pointer' && h.pointer === 'head');
  const papelCauda = findRole(highlights, (h) => h.kind === 'pointer' && h.pointer === 'tail');
  const papelFlutuante = findRole(highlights, (h) => h.kind === 'floating');

  /** Papel de destaque de uma seta que sai de um nó. */
  function linkRole(from: string, direction: 'next' | 'prev'): EmphasisRole | null {
    return findRole(
      highlights,
      (h) => h.kind === 'link' && h.from === from && h.direction === direction,
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Faixa do nó em trânsito, fora da lista. */}
      <div className="flex h-[4.5rem] items-center justify-center" aria-hidden={floating === null}>
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
                {floating.phase === 'entering' ? 'nó recém-alocado' : 'nó removido'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {vazia ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="flex items-center gap-3">
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-indigo-800">
              {nomes.head}
            </span>
            <PointerArrow direction="next" role={papelCabeca} toNull />
            <NullBadge highlighted={papelCabeca !== null} />
          </div>
          <p className="text-sm italic text-slate-400">{nomes.empty}</p>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-2">
          <ol
            className="flex flex-wrap items-start justify-center gap-y-6"
            aria-label={nomes.aria}
          >
            {/* NULL antes da cabeça — só existe na lista duplamente ligada. */}
            {dupla && (
              <li className="flex flex-col items-center">
                <span className="h-7" aria-hidden="true" />
                <span className={`flex ${box} items-center justify-center`}>
                  <NullBadge highlighted={linkRole(nodes[0]?.id ?? '', 'prev') !== null} />
                </span>
                <span className="h-5" aria-hidden="true" />
              </li>
            )}

            {nodes.map((node, posicao) => {
              const papel = findRole(highlights, (h) => h.kind === 'node' && h.id === node.id);
              const seguinte = nodes[posicao + 1];
              const eCabeca = node.id === state.head;
              const eCauda = node.id === state.tail;

              return (
                <Fragment key={node.id}>
                  <li className="flex flex-col items-center">
                    {/* Rótulos de cabeça e cauda. */}
                    <span className="flex h-7 items-center gap-1">
                      {eCabeca && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            papelCabeca !== null
                              ? EMPHASIS[papelCabeca].box
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {nomes.head}
                        </span>
                      )}
                      {eCauda && nomes.tail !== null && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            papelCauda !== null
                              ? EMPHASIS[papelCauda].box
                              : 'bg-violet-100 text-violet-800'
                          }`}
                        >
                          {nomes.tail}
                        </span>
                      )}
                    </span>

                    <motion.div
                      layout
                      transition={{ duration: Math.min(duracao * 0.4, 0.3) }}
                      className={`flex ${box} items-center justify-center rounded-lg border-2 font-mono ${text} font-bold shadow-sm transition-colors ${
                        papel !== null ? EMPHASIS[papel].box : NEUTRAL_BOX
                      }`}
                    >
                      {node.value}
                      <span className="sr-only">
                        {' '}
                        (posição {posicao}
                        {papel !== null ? `, ${EMPHASIS[papel].label}` : ''})
                      </span>
                    </motion.div>

                    <span className="h-5 font-mono text-xs text-slate-400" aria-hidden="true">
                      {posicao}
                    </span>
                  </li>

                  {/* Conector até o próximo nó, ou até NULL na cauda. */}
                  <li className="flex flex-col items-center" aria-hidden="true">
                    <span className="h-7" />
                    <span className={`flex ${box} flex-col items-center justify-center gap-1`}>
                      <PointerArrow
                        direction="next"
                        role={linkRole(node.id, 'next')}
                        toNull={seguinte === undefined}
                      />
                      {dupla && seguinte !== undefined && (
                        <PointerArrow direction="prev" role={linkRole(seguinte.id, 'prev')} />
                      )}
                    </span>
                    <span className="h-5" />
                  </li>

                  {/* NULL após a cauda. */}
                  {seguinte === undefined && (
                    <li className="flex flex-col items-center">
                      <span className="h-7" aria-hidden="true" />
                      <span className={`flex ${box} items-center justify-center`}>
                        <NullBadge highlighted={linkRole(node.id, 'next') !== null} />
                      </span>
                      <span className="h-5" aria-hidden="true" />
                    </li>
                  )}
                </Fragment>
              );
            })}
          </ol>
        </div>
      )}

      {/* Estado da lista, em texto. */}
      <p className="font-mono text-sm text-slate-600">
        {nomes.head} ={' '}
        <span className={`font-bold ${vazia ? 'text-rose-600' : 'text-indigo-700'}`}>
          {vazia ? 'NULL' : (nodes[0]?.value ?? 'NULL')}
        </span>
        {nomes.tail !== null && (
          <>
            <span className="mx-2 text-slate-300">|</span>
            {nomes.tail} ={' '}
            <span className={`font-bold ${vazia ? 'text-rose-600' : 'text-violet-700'}`}>
              {vazia ? 'NULL' : (nodes[nodes.length - 1]?.value ?? 'NULL')}
            </span>
          </>
        )}
        <span className="mx-2 text-slate-300">|</span>
        tamanho = <span className="font-bold text-slate-800">{state.size}</span>
      </p>
    </div>
  );
}
