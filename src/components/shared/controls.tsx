/**
 * Peças básicas do painel de controles, compartilhadas pelas três estruturas.
 */

import type { ReactNode } from 'react';
import type { StepTone } from '../../types/step';

// ---------------------------------------------------------------------------
// Campo de valor
// ---------------------------------------------------------------------------

interface ValueInputProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Disparado ao pressionar Enter, quando há valor válido. */
  readonly onSubmit?: () => void;
  readonly placeholder?: string;
  readonly maxLength?: number;
}

export function ValueInput({
  id,
  label,
  value,
  onChange,
  onSubmit,
  placeholder = 'ex.: 42',
  maxLength = 6,
}: ValueInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-slate-600">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="text"
        autoComplete="off"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && onSubmit) {
            event.preventDefault();
            onSubmit();
          }
        }}
        className="h-10 w-28 rounded-lg border border-slate-300 bg-white px-3 text-center font-mono text-base font-semibold text-slate-900 placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-slate-400"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Campo de índice
// ---------------------------------------------------------------------------

interface IndexInputProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit?: () => void;
  readonly max: number;
}

export function IndexInput({ id, label, value, onChange, onSubmit, max }: IndexInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-slate-600">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        max={max}
        value={value}
        autoComplete="off"
        placeholder="0"
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && onSubmit) {
            event.preventDefault();
            onSubmit();
          }
        }}
        className="h-10 w-20 rounded-lg border border-slate-300 bg-white px-3 text-center font-mono text-base font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Botão de operação
// ---------------------------------------------------------------------------

export type OperationVariant = 'insert' | 'remove' | 'inspect';

const VARIANT_CLASSES: Record<OperationVariant, string> = {
  insert: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:hover:bg-emerald-600',
  remove: 'bg-rose-600 text-white hover:bg-rose-700 disabled:hover:bg-rose-600',
  inspect: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:hover:bg-white',
};

interface OperationButtonProps {
  readonly children: ReactNode;
  readonly onClick: () => void;
  readonly variant: OperationVariant;
  readonly disabled?: boolean;
  /**
   * Explicação do motivo do bloqueio. Vira `title` e texto acessível, para que
   * o aluno entenda *por que* a operação não está disponível.
   */
  readonly disabledReason?: string;
}

export function OperationButton({
  children,
  onClick,
  variant,
  disabled = false,
  disabledReason,
}: OperationButtonProps) {
  const bloqueado = disabled && disabledReason !== undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={bloqueado ? disabledReason : undefined}
      className={`inline-flex h-10 items-center justify-center rounded-lg px-3.5 font-mono text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]}`}
    >
      {children}
      {bloqueado ? <span className="sr-only"> — {disabledReason}</span> : null}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Aviso de estado da estrutura
// ---------------------------------------------------------------------------

export interface Notice {
  readonly tone: StepTone;
  readonly text: string;
}

const NOTICE_CLASSES: Record<StepTone, string> = {
  info: 'border-slate-200 bg-slate-50 text-slate-600',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-amber-300 bg-amber-50 text-amber-900',
};

interface StatusBannerProps {
  readonly notices: readonly Notice[];
}

/**
 * Comunica visualmente os estados de borda (vazia, cheia, busca sem resultado).
 * Sem avisos, não ocupa espaço.
 */
export function StatusBanner({ notices }: StatusBannerProps) {
  if (notices.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" role="status" aria-live="polite">
      {notices.map((notice) => (
        <p
          key={notice.text}
          className={`rounded-lg border px-3 py-1.5 text-sm ${NOTICE_CLASSES[notice.tone]}`}
        >
          {notice.text}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agrupador do painel de controles
// ---------------------------------------------------------------------------

interface ControlPanelProps {
  readonly children: ReactNode;
  readonly label: string;
}

export function ControlPanel({ children, label }: ControlPanelProps) {
  return (
    <section className="painel flex flex-wrap items-end gap-3 p-4" aria-label={label}>
      {children}
    </section>
  );
}

/** Separador vertical entre grupos de controles. */
export function ControlDivider() {
  return <div className="h-10 w-px shrink-0 self-end bg-slate-200" aria-hidden="true" />;
}
