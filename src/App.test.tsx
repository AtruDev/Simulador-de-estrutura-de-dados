/**
 * Teste de fumaça da camada visual.
 *
 * Não substitui os testes da lógica — que vivem em `core/` e cobrem os casos de
 * borda — mas garante que a árvore de componentes monta sem erro nos estados
 * iniciais e, principalmente, que os passos produzidos pelo motor conseguem ser
 * renderizados: um destaque apontando para um nó inexistente ou uma linha de
 * pseudocódigo fora do intervalo quebraria aqui.
 */

import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from './App';
import { LinkedListView } from './components/linked-list/LinkedListView';
import { QueueView } from './components/queue/QueueView';
import { StackView } from './components/stack/StackView';
import { createList, emptyList } from './core/data-structures/linked-list';
import { createQueue, enqueue } from './core/data-structures/queue';
import { createStack, push } from './core/data-structures/stack';
import {
  planDeleteTail,
  planInsertAt,
  planSearch,
} from './core/step-engine/linked-list-steps';
import { planDequeue, planEnqueue } from './core/step-engine/queue-steps';
import {
  planDequeue as planDequeueEncadeado,
  planEnqueue as planEnqueueEncadeado,
} from './core/step-engine/linked-queue-steps';
import {
  planPop as planPopEncadeado,
  planPush as planPushEncadeado,
} from './core/step-engine/linked-stack-steps';
import { planPop, planPush } from './core/step-engine/stack-steps';

describe('App', () => {
  it('monta sem erro e apresenta as três estruturas', () => {
    const html = renderToString(<App />);
    expect(html).toContain('Pilha');
    expect(html).toContain('Fila');
    expect(html).toContain('Lista Ligada');
  });
});

describe('StackView', () => {
  const vazia = createStack(4);
  const comItens = (() => {
    const r = push(vazia, { id: 'i1', value: '7' });
    return r.ok ? r.state : vazia;
  })();

  it('renderiza a pilha vazia comunicando o estado', () => {
    const html = renderToString(
      <StackView snapshot={{ state: vazia, floating: null }} highlights={[]} durationMs={1000} />,
    );
    expect(html).toContain('A pilha está vazia');
    expect(html).toContain('topo =');
  });

  it('renderiza todos os passos de push e pop sem erro', () => {
    const trilhas = [planPush(comItens, { id: 'i2', value: '9' }), planPop(comItens)];
    for (const trace of trilhas) {
      for (const step of trace.steps) {
        const html = renderToString(
          <StackView
            snapshot={step.snapshot}
            highlights={step.highlights}
            durationMs={1000}
          />,
        );
        expect(html.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('QueueView', () => {
  const vazia = createQueue(4);
  const comItens = (() => {
    const r = enqueue(vazia, { id: 'i1', value: '7' });
    return r.ok ? r.state : vazia;
  })();

  it('renderiza a fila vazia explicando o papel do contador', () => {
    const html = renderToString(
      <QueueView snapshot={{ state: vazia, floating: null }} highlights={[]} durationMs={1000} />,
    );
    expect(html).toContain('A fila está vazia');
    expect(html).toContain('início =');
  });

  it('renderiza todos os passos de enqueue e dequeue sem erro', () => {
    const trilhas = [planEnqueue(comItens, { id: 'i2', value: '9' }), planDequeue(comItens)];
    for (const trace of trilhas) {
      for (const step of trace.steps) {
        const html = renderToString(
          <QueueView
            snapshot={step.snapshot}
            highlights={step.highlights}
            durationMs={1000}
          />,
        );
        expect(html.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('LinkedListView com o vocabulário da pilha e da fila encadeadas', () => {
  const pilha = createList('singly', [
    { id: 'a', value: '7' },
    { id: 'b', value: '9' },
  ]);

  it('rotula o primeiro nó como topo e esconde o rótulo de fundo', () => {
    const html = renderToString(
      <LinkedListView
        snapshot={{ state: pilha, floating: null }}
        highlights={[]}
        durationMs={1000}
        naming={{
          head: 'topo',
          tail: null,
          empty: 'A pilha está vazia: o ponteiro de topo vale NULL.',
          aria: 'Pilha encadeada',
        }}
      />,
    );
    expect(html).toContain('topo');
    expect(html).not.toContain('cauda');
  });

  it('renderiza todos os passos das operações encadeadas sem erro', () => {
    const trilhas = [
      planPushEncadeado(pilha, { id: 'x', value: '3' }),
      planPopEncadeado(pilha),
      planEnqueueEncadeado(pilha, { id: 'x', value: '3' }),
      planDequeueEncadeado(pilha),
    ];

    for (const trace of trilhas) {
      for (const step of trace.steps) {
        const html = renderToString(
          <LinkedListView
            snapshot={step.snapshot}
            highlights={step.highlights}
            durationMs={1000}
            naming={{ head: 'topo', tail: null, empty: 'vazia', aria: 'estrutura' }}
          />,
        );
        expect(html.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('LinkedListView', () => {
  it('renderiza a lista vazia mostrando cabeça = NULL', () => {
    const html = renderToString(
      <LinkedListView
        snapshot={{ state: emptyList('singly'), floating: null }}
        highlights={[]}
        durationMs={1000}
      />,
    );
    expect(html).toContain('A lista está vazia');
    expect(html).toContain('NULL');
  });

  it.each(['singly', 'doubly'] as const)(
    'renderiza todos os passos das operações na lista %s',
    (variant) => {
      const lista = createList(variant, [
        { id: 'a', value: 'a' },
        { id: 'b', value: 'b' },
        { id: 'c', value: 'c' },
      ]);
      const trilhas = [
        planInsertAt(lista, 2, { id: 'x', value: 'x' }),
        planDeleteTail(lista),
        planSearch(lista, 'z'),
      ];

      for (const trace of trilhas) {
        for (const step of trace.steps) {
          const html = renderToString(
            <LinkedListView
              snapshot={step.snapshot}
              highlights={step.highlights}
              durationMs={1000}
            />,
          );
          expect(html).toContain('cauda');
        }
      }
    },
  );
});
