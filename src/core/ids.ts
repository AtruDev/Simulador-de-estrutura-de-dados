/**
 * Geração de identificadores. Mantida fora dos módulos de estrutura de dados
 * para que estes permaneçam **funções puras** — os identificadores são sempre
 * fornecidos de fora, o que torna os testes determinísticos.
 */

let counter = 0;

/** Identificador único dentro da sessão, com prefixo legível para depuração. */
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}`;
}
