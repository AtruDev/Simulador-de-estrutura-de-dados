/**
 * Modelos de *snapshot* e de *destaque* por estrutura.
 *
 * Um snapshot é o que a visualização desenha num passo. Ele compõe o estado
 * puro da estrutura de dados com informação **transitória de apresentação** —
 * por exemplo, o elemento que ainda está "fora" da pilha durante um `push`.
 * Assim a lógica pura permanece livre de conceitos de animação.
 */

import type { LinkedListState, ListNode } from '../core/data-structures/linked-list';
import type { QueueItem, QueueState } from '../core/data-structures/queue';
import type { StackItem, StackState } from '../core/data-structures/stack';
import type { EmphasisRole, OperationTrace, Step } from './step';

/** Elemento em trânsito: chegando à estrutura ou saindo dela. */
export interface FloatingItem<TItem> {
  readonly item: TItem;
  readonly phase: 'entering' | 'leaving';
}

// ---------------------------------------------------------------------------
// Pilha
// ---------------------------------------------------------------------------

export interface StackSnapshot {
  readonly state: StackState;
  /** Elemento fora da pilha durante a animação, ou `null`. */
  readonly floating: FloatingItem<StackItem> | null;
}

export type StackHighlight =
  /** Uma posição do array, contada a partir da base (índice 0). */
  | { readonly kind: 'slot'; readonly index: number; readonly role: EmphasisRole }
  /** O elemento em trânsito, desenhado fora da estrutura. */
  | { readonly kind: 'floating'; readonly role: EmphasisRole }
  /** O marcador de topo ou de base. */
  | {
      readonly kind: 'pointer';
      readonly pointer: 'top' | 'base';
      readonly role: EmphasisRole;
    };

export type StackStep = Step<StackSnapshot, StackHighlight>;
export type StackTrace = OperationTrace<StackSnapshot, StackHighlight>;

// ---------------------------------------------------------------------------
// Fila
// ---------------------------------------------------------------------------

export interface QueueSnapshot {
  readonly state: QueueState;
  /** Elemento fora da fila durante a animação, ou `null`. */
  readonly floating: FloatingItem<QueueItem> | null;
}

export type QueueHighlight =
  /** Uma posição física do array circular. */
  | { readonly kind: 'slot'; readonly index: number; readonly role: EmphasisRole }
  /** O elemento em trânsito, desenhado fora da estrutura. */
  | { readonly kind: 'floating'; readonly role: EmphasisRole }
  /** O ponteiro de início ou de fim. */
  | {
      readonly kind: 'pointer';
      readonly pointer: 'front' | 'rear';
      readonly role: EmphasisRole;
    };

export type QueueStep = Step<QueueSnapshot, QueueHighlight>;
export type QueueTrace = OperationTrace<QueueSnapshot, QueueHighlight>;

// ---------------------------------------------------------------------------
// Lista ligada
// ---------------------------------------------------------------------------

export interface ListSnapshot {
  readonly state: LinkedListState;
  /** Nó recém-criado, ainda fora da lista, ou nó já desligado dela. */
  readonly floating: FloatingItem<ListNode> | null;
}

export type ListHighlight =
  /** Um nó da lista, identificado pelo seu id. */
  | { readonly kind: 'node'; readonly id: string; readonly role: EmphasisRole }
  /** O nó em trânsito, desenhado fora da estrutura. */
  | { readonly kind: 'floating'; readonly role: EmphasisRole }
  /** A seta que sai de um nó — o ponteiro `next` ou `prev`. */
  | {
      readonly kind: 'link';
      readonly from: string;
      readonly direction: 'next' | 'prev';
      readonly role: EmphasisRole;
    }
  /** O rótulo de cabeça ou de cauda. */
  | {
      readonly kind: 'pointer';
      readonly pointer: 'head' | 'tail';
      readonly role: EmphasisRole;
    };

export type ListStep = Step<ListSnapshot, ListHighlight>;
export type ListTrace = OperationTrace<ListSnapshot, ListHighlight>;
