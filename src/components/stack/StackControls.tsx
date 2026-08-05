import { useId, useState } from 'react';
import {
  STACK_MAX_CAPACITY,
  type StackState,
  isEmpty,
  isFull,
} from '../../core/data-structures/stack';
import {
  ControlDivider,
  ControlPanel,
  OperationButton,
  ValueInput,
} from '../shared/controls';

interface StackControlsProps {
  readonly state: StackState;
  readonly onPush: (value: string) => void;
  readonly onPop: () => void;
  readonly onPeek: () => void;
  readonly onIsEmpty: () => void;
  readonly onIsFull: () => void;
  readonly onCapacityChange: (capacity: number) => void;
  readonly onReset: () => void;
}

const CAPACIDADES = [4, 6, 8, 10, 15, STACK_MAX_CAPACITY] as const;

/** Painel de controles da pilha: valor a empilhar e botões de cada operação. */
export function StackControls({
  state,
  onPush,
  onPop,
  onPeek,
  onIsEmpty,
  onIsFull,
  onCapacityChange,
  onReset,
}: StackControlsProps) {
  const [valor, setValor] = useState('');
  const campoValor = useId();
  const campoCapacidade = useId();

  const vazia = isEmpty(state);
  const cheia = isFull(state);
  const semValor = valor.trim().length === 0;

  function empilhar() {
    const limpo = valor.trim();
    if (limpo.length === 0 || cheia) return;
    onPush(limpo);
    setValor('');
  }

  return (
    <ControlPanel label="Operações da pilha">
      <ValueInput
        id={campoValor}
        label="Valor"
        value={valor}
        onChange={setValor}
        onSubmit={empilhar}
      />

      <OperationButton
        variant="insert"
        onClick={empilhar}
        disabled={semValor || cheia}
        disabledReason={
          cheia
            ? 'a pilha está cheia; um push() causaria overflow'
            : 'informe um valor para empilhar'
        }
      >
        push(valor)
      </OperationButton>

      <OperationButton
        variant="remove"
        onClick={onPop}
        disabled={vazia}
        disabledReason="a pilha está vazia; um pop() causaria underflow"
      >
        pop()
      </OperationButton>

      <OperationButton
        variant="inspect"
        onClick={onPeek}
        disabled={vazia}
        disabledReason="a pilha está vazia; não há topo para consultar"
      >
        peek()
      </OperationButton>

      <ControlDivider />

      <OperationButton variant="inspect" onClick={onIsEmpty}>
        isEmpty()
      </OperationButton>

      <OperationButton variant="inspect" onClick={onIsFull}>
        isFull()
      </OperationButton>

      <ControlDivider />

      <div className="flex flex-col gap-1">
        <label htmlFor={campoCapacidade} className="text-xs font-semibold text-slate-600">
          Capacidade
        </label>
        <select
          id={campoCapacidade}
          value={state.capacity}
          onChange={(event) => {
            onCapacityChange(Number(event.target.value));
          }}
          title="Alterar a capacidade reinicia a pilha"
          className="h-10 rounded-lg border border-slate-300 bg-white px-2 font-mono text-sm font-semibold text-slate-800"
        >
          {CAPACIDADES.map((capacidade) => (
            <option key={capacidade} value={capacidade}>
              {capacidade}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-500 underline-offset-4 transition-colors hover:text-slate-800 hover:underline"
      >
        Reiniciar
      </button>
    </ControlPanel>
  );
}
