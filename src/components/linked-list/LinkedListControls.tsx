import { useId, useState } from 'react';
import {
  type LinkedListState,
  type ListVariant,
  isEmpty,
} from '../../core/data-structures/linked-list';
import { randomValue } from '../../core/sample-data';
import {
  ControlDivider,
  ControlPanel,
  IndexInput,
  OperationButton,
  SetupButton,
  ValueInput,
} from '../shared/controls';

/**
 * Limite de nós exibidos. Não é uma restrição da estrutura — uma lista ligada
 * não tem capacidade máxima — mas do que cabe legivelmente na tela.
 */
export const LIMITE_VISUAL = 20;

interface LinkedListControlsProps {
  readonly state: LinkedListState;
  readonly onInsertHead: (value: string) => void;
  readonly onInsertTail: (value: string) => void;
  readonly onInsertAt: (index: number, value: string) => void;
  readonly onDeleteHead: () => void;
  readonly onDeleteTail: () => void;
  readonly onDeleteAt: (index: number) => void;
  readonly onSearch: (value: string) => void;
  readonly onVariantChange: (variant: ListVariant) => void;
  /** Povoa a lista com nós aleatórios, para montar o cenário da explicação. */
  readonly onFill: () => void;
  readonly onReset: () => void;
}

const VARIANTES: readonly { readonly id: ListVariant; readonly label: string }[] = [
  { id: 'singly', label: 'Simplesmente ligada' },
  { id: 'doubly', label: 'Duplamente ligada' },
];

export function LinkedListControls({
  state,
  onInsertHead,
  onInsertTail,
  onInsertAt,
  onDeleteHead,
  onDeleteTail,
  onDeleteAt,
  onSearch,
  onVariantChange,
  onFill,
  onReset,
}: LinkedListControlsProps) {
  const [valor, setValor] = useState('');
  const [indice, setIndice] = useState('0');
  const campoValor = useId();
  const campoIndice = useId();
  const grupoVariante = useId();

  const vazia = isEmpty(state);
  const semValor = valor.trim().length === 0;
  const cheiaNaTela = state.size >= LIMITE_VISUAL;
  const indiceNumerico = Number.parseInt(indice, 10);
  const indiceValido = Number.isInteger(indiceNumerico) && indiceNumerico >= 0;

  const motivoInsercao = cheiaNaTela
    ? `a visualização comporta no máximo ${LIMITE_VISUAL} nós`
    : 'informe um valor para inserir';

  /** Executa uma inserção e limpa o campo de valor. */
  function inserir(acao: (limpo: string) => void) {
    const limpo = valor.trim();
    if (limpo.length === 0 || cheiaNaTela) return;
    acao(limpo);
    setValor('');
  }

  return (
    <div className="flex flex-col gap-3">
      <ControlPanel label="Operações de inserção e busca da lista ligada">
        <ValueInput
          id={campoValor}
          label="Valor"
          value={valor}
          onChange={setValor}
          onSubmit={() => {
            inserir(onInsertTail);
          }}
          onRandom={() => {
            setValor(randomValue());
          }}
        />

        <OperationButton
          variant="insert"
          onClick={() => {
            inserir(onInsertHead);
          }}
          disabled={semValor || cheiaNaTela}
          disabledReason={motivoInsercao}
        >
          insertHead
        </OperationButton>

        <OperationButton
          variant="insert"
          onClick={() => {
            inserir(onInsertTail);
          }}
          disabled={semValor || cheiaNaTela}
          disabledReason={motivoInsercao}
        >
          insertTail
        </OperationButton>

        <ControlDivider />

        <IndexInput
          id={campoIndice}
          label="Índice"
          value={indice}
          onChange={setIndice}
          max={state.size}
        />

        <OperationButton
          variant="insert"
          onClick={() => {
            inserir((limpo) => {
              onInsertAt(indiceNumerico, limpo);
            });
          }}
          disabled={semValor || !indiceValido || cheiaNaTela}
          disabledReason={
            indiceValido ? motivoInsercao : 'informe um índice não negativo'
          }
        >
          insertAt
        </OperationButton>

        <OperationButton
          variant="remove"
          onClick={() => {
            onDeleteAt(indiceNumerico);
          }}
          disabled={vazia || !indiceValido}
          disabledReason={
            vazia ? 'a lista está vazia' : 'informe um índice não negativo'
          }
        >
          deleteAt
        </OperationButton>

        <ControlDivider />

        <OperationButton
          variant="inspect"
          onClick={() => {
            onSearch(valor.trim());
          }}
          disabled={semValor || vazia}
          disabledReason={
            vazia ? 'a lista está vazia; não há nós para percorrer' : 'informe um valor para buscar'
          }
        >
          search(valor)
        </OperationButton>
      </ControlPanel>

      <ControlPanel label="Remoções e configuração da lista ligada">
        <OperationButton
          variant="remove"
          onClick={onDeleteHead}
          disabled={vazia}
          disabledReason="a lista está vazia; não há cabeça para remover"
        >
          deleteHead
        </OperationButton>

        <OperationButton
          variant="remove"
          onClick={onDeleteTail}
          disabled={vazia}
          disabledReason="a lista está vazia; não há cauda para remover"
        >
          deleteTail
        </OperationButton>

        <ControlDivider />

        <fieldset className="flex flex-col gap-1">
          <legend id={grupoVariante} className="text-xs font-semibold text-slate-600">
            Variante
          </legend>
          <div
            className="flex overflow-hidden rounded-lg border border-slate-300"
            role="group"
            aria-labelledby={grupoVariante}
          >
            {VARIANTES.map((opcao) => (
              <button
                key={opcao.id}
                type="button"
                onClick={() => {
                  onVariantChange(opcao.id);
                }}
                aria-pressed={state.variant === opcao.id}
                title="Trocar a variante reinicia a lista"
                className={`h-10 px-3 text-sm font-medium transition-colors ${
                  state.variant === opcao.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opcao.label}
              </button>
            ))}
          </div>
        </fieldset>

        <SetupButton
          onClick={onFill}
          hint="monta uma lista com nós aleatórios, reiniciando a atual"
        >
          Preencher
        </SetupButton>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-500 underline-offset-4 transition-colors hover:text-slate-800 hover:underline"
        >
          Reiniciar
        </button>
      </ControlPanel>
    </div>
  );
}
