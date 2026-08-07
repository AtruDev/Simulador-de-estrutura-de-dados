import { describe, expect, it } from 'vitest';
import { toArray as listValues, toNodes } from './data-structures/linked-list';
import { capacity, toArray as queueValues, size as queueSize } from './data-structures/queue';
import { STACK_MAX_CAPACITY, toArray as stackValues } from './data-structures/stack';
import {
  SAMPLE_MAX,
  SAMPLE_MIN,
  type Rng,
  randomList,
  randomQueue,
  randomStack,
  randomValue,
  randomValues,
  sampleSize,
} from './sample-data';

/** Sorteador determinístico: percorre a sequência dada e depois a repete. */
function rngDe(sequencia: readonly number[]): Rng {
  let i = 0;
  return () => {
    const valor = sequencia[i % sequencia.length] ?? 0;
    i += 1;
    return valor;
  };
}

/** Identificadores previsíveis, para asserções estáveis. */
function contadorDeIds(prefixo: string): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `${prefixo}-${n}`;
  };
}

describe('randomValue', () => {
  it('cobre os extremos da faixa', () => {
    expect(randomValue(() => 0)).toBe(String(SAMPLE_MIN));
    expect(randomValue(() => 0.999999)).toBe(String(SAMPLE_MAX));
  });

  it('não estoura a faixa quando o sorteador devolve 1', () => {
    expect(randomValue(() => 1)).toBe(String(SAMPLE_MAX));
  });

  it('devolve sempre um inteiro dentro da faixa', () => {
    for (let i = 0; i < 200; i += 1) {
      const numero = Number(randomValue());
      expect(Number.isInteger(numero)).toBe(true);
      expect(numero).toBeGreaterThanOrEqual(SAMPLE_MIN);
      expect(numero).toBeLessThanOrEqual(SAMPLE_MAX);
    }
  });
});

describe('randomValues', () => {
  it('devolve a quantidade pedida', () => {
    expect(randomValues(5)).toHaveLength(5);
  });

  it('não repete valores — valores iguais atrapalhariam a demonstração de search', () => {
    for (const sorteador of [rngDe([0]), rngDe([0.999999]), rngDe([0, 0.5]), Math.random]) {
      const valores = randomValues(20, sorteador);
      expect(new Set(valores).size).toBe(20);
    }
  });

  it('é determinístico para um sorteador determinístico', () => {
    const sequencia = [0.1, 0.7, 0.42, 0.9];
    expect(randomValues(4, rngDe(sequencia))).toEqual(randomValues(4, rngDe(sequencia)));
  });

  it('trata contagens inválidas sem laço infinito', () => {
    expect(randomValues(0)).toEqual([]);
    expect(randomValues(-3)).toEqual([]);
    expect(randomValues(2.7)).toHaveLength(2);
  });

  it('limita a contagem ao tamanho da faixa disponível', () => {
    expect(randomValues(500)).toHaveLength(SAMPLE_MAX - SAMPLE_MIN + 1);
  });
});

describe('sampleSize', () => {
  it('preenche cerca de 60% da capacidade, deixando espaço para inserir', () => {
    expect(sampleSize(4)).toBe(3);
    expect(sampleSize(10)).toBe(6);
    expect(sampleSize(20)).toBe(12);
  });

  it('nunca excede a capacidade nem devolve zero', () => {
    for (let capacidade = 1; capacidade <= STACK_MAX_CAPACITY; capacidade += 1) {
      const total = sampleSize(capacidade);
      expect(total).toBeGreaterThanOrEqual(1);
      expect(total).toBeLessThanOrEqual(capacidade);
    }
  });
});

describe('randomStack', () => {
  it('povoa a pilha preservando a capacidade e deixando espaço livre', () => {
    const state = randomStack(10, contadorDeIds('item'));
    expect(state.capacity).toBe(10);
    expect(stackValues(state)).toHaveLength(sampleSize(10));
  });

  it('atribui um identificador distinto a cada item', () => {
    const state = randomStack(10, contadorDeIds('item'));
    const ids = new Set(state.items.map((item) => item.id));
    expect(ids.size).toBe(state.items.length);
  });

  it('respeita o intervalo de capacidade suportado', () => {
    expect(randomStack(999, contadorDeIds('item')).capacity).toBe(STACK_MAX_CAPACITY);
  });
});

describe('randomQueue', () => {
  it('povoa a fila a partir da posição 0, com os ponteiros que os enqueue produziriam', () => {
    const state = randomQueue(8, contadorDeIds('item'));
    const total = sampleSize(8);

    expect(capacity(state)).toBe(8);
    expect(queueSize(state)).toBe(total);
    expect(state.front).toBe(0);
    expect(state.rear).toBe(total % 8);
    expect(queueValues(state)).toHaveLength(total);
  });
});

describe('randomList', () => {
  it('povoa a lista na ordem do sorteio, da cabeça à cauda', () => {
    const sequencia = [0, 0.5, 0.99];
    const state = randomList('singly', 3, contadorDeIds('no'), rngDe(sequencia));

    expect(state.size).toBe(3);
    expect(listValues(state)).toEqual(randomValues(3, rngDe(sequencia)));
  });

  it('preserva a variante e mantém prev nulo na lista simplesmente ligada', () => {
    const state = randomList('singly', 4, contadorDeIds('no'));
    expect(state.variant).toBe('singly');
    expect(toNodes(state).every((node) => node.prev === null)).toBe(true);
  });

  it('liga os ponteiros prev na lista duplamente ligada', () => {
    const nos = toNodes(randomList('doubly', 4, contadorDeIds('no')));
    expect(nos[0]?.prev).toBeNull();
    expect(nos[1]?.prev).toBe(nos[0]?.id);
    expect(nos[3]?.prev).toBe(nos[2]?.id);
  });

  it('devolve lista vazia para contagens inválidas', () => {
    expect(randomList('singly', 0, contadorDeIds('no')).size).toBe(0);
    expect(randomList('singly', -2, contadorDeIds('no')).size).toBe(0);
  });
});
