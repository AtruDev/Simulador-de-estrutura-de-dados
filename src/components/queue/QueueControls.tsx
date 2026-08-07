import { useId, useState } from 'react';
import {
  QUEUE_MAX_CAPACITY,
  type QueueState,
  capacity,
  isEmpty,
  isFull,
} from '../../core/data-structures/queue';
import { randomValue } from '../../core/sample-data';
import {
  ControlDivider,
  ControlPanel,
  OperationButton,
  SetupButton,
  ValueInput,
} from '../shared/controls';

interface QueueControlsProps {
  readonly state: QueueState;
  readonly onEnqueue: (value: string) => void;
  readonly onDequeue: () => void;
  readonly onPeek: () => void;
  readonly onIsEmpty: () => void;
  readonly onIsFull: () => void;
  readonly onCapacityChange: (capacity: number) => void;
  /** Povoa a fila com valores aleatórios, para montar o cenário da explicação. */
  readonly onFill: () => void;
  readonly onReset: () => void;
}

const CAPACIDADES = [4, 6, 8, 10, 15, QUEUE_MAX_CAPACITY] as const;

/** Painel de controles da fila. */
export function QueueControls({
  state,
  onEnqueue,
  onDequeue,
  onPeek,
  onIsEmpty,
  onIsFull,
  onCapacityChange,
  onFill,
  onReset,
}: QueueControlsProps) {
  const [valor, setValor] = useState('');
  const campoValor = useId();
  const campoCapacidade = useId();

  const vazia = isEmpty(state);
  const cheia = isFull(state);
  const semValor = valor.trim().length === 0;

  function enfileirar() {
    const limpo = valor.trim();
    if (limpo.length === 0 || cheia) return;
    onEnqueue(limpo);
    setValor('');
  }

  return (
    <ControlPanel label="Operações da fila">
      <ValueInput
        id={campoValor}
        label="Valor"
        value={valor}
        onChange={setValor}
        onSubmit={enfileirar}
        onRandom={() => {
          setValor(randomValue());
        }}
      />

      <OperationButton
        variant="insert"
        onClick={enfileirar}
        disabled={semValor || cheia}
        disabledReason={
          cheia
            ? 'a fila está cheia; um enqueue() causaria overflow'
            : 'informe um valor para enfileirar'
        }
      >
        enqueue(valor)
      </OperationButton>

      <OperationButton
        variant="remove"
        onClick={onDequeue}
        disabled={vazia}
        disabledReason="a fila está vazia; um dequeue() causaria underflow"
      >
        dequeue()
      </OperationButton>

      <OperationButton
        variant="inspect"
        onClick={onPeek}
        disabled={vazia}
        disabledReason="a fila está vazia; não há elemento no início para consultar"
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
          value={capacity(state)}
          onChange={(event) => {
            onCapacityChange(Number(event.target.value));
          }}
          title="Alterar a capacidade reinicia a fila"
          className="h-10 rounded-lg border border-slate-300 bg-white px-2 font-mono text-sm font-semibold text-slate-800"
        >
          {CAPACIDADES.map((valorCapacidade) => (
            <option key={valorCapacidade} value={valorCapacidade}>
              {valorCapacidade}
            </option>
          ))}
        </select>
      </div>

      <SetupButton onClick={onFill} hint="monta uma fila com valores aleatórios, reiniciando a atual">
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
  );
}
