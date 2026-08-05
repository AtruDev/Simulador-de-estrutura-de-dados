import { SPEED_OPTIONS, type PlaybackSpeed, type StepPlayer } from '../../hooks/useStepPlayer';

interface PlaybackControlsProps {
  readonly player: StepPlayer;
  /** Desabilitado enquanto nenhuma operação foi executada. */
  readonly disabled: boolean;
}

const BOTAO =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white';

/** Play/pause, passo a passo e velocidade da animação. */
export function PlaybackControls({ player, disabled }: PlaybackControlsProps) {
  const { index, totalSteps, isPlaying, isAtStart, isAtEnd } = player;

  return (
    <section
      className="painel flex flex-wrap items-center gap-x-4 gap-y-3 p-3"
      aria-label="Controles da animação"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={BOTAO}
          onClick={player.restart}
          disabled={disabled}
          aria-label="Reiniciar a operação do primeiro passo"
          title="Reiniciar do primeiro passo"
        >
          <IconeReiniciar />
        </button>

        <button
          type="button"
          className={BOTAO}
          onClick={player.previous}
          disabled={disabled || isAtStart}
          aria-label="Passo anterior"
          title="Passo anterior"
        >
          <IconeAnterior />
        </button>

        <button
          type="button"
          className="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-indigo-600"
          onClick={player.togglePlay}
          disabled={disabled || totalSteps <= 1}
          aria-label={isPlaying ? 'Pausar a animação' : 'Reproduzir a animação'}
        >
          {isPlaying ? <IconePausa /> : <IconePlay />}
          {isPlaying ? 'Pausar' : 'Reproduzir'}
        </button>

        <button
          type="button"
          className={BOTAO}
          onClick={player.next}
          disabled={disabled || isAtEnd}
          aria-label="Próximo passo"
          title="Próximo passo"
        >
          <IconeProximo />
        </button>
      </div>

      {/* Trilha de passos: cada marcador leva direto ao passo correspondente. */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <ol className="flex flex-wrap items-center gap-1.5" aria-label="Passos da operação">
          {Array.from({ length: totalSteps }, (_, posicao) => {
            const atual = posicao === index;
            const percorrido = posicao < index;
            return (
              <li key={posicao}>
                <button
                  type="button"
                  onClick={() => {
                    player.goTo(posicao);
                  }}
                  disabled={disabled}
                  aria-label={`Ir para o passo ${posicao + 1}`}
                  aria-current={atual ? 'step' : undefined}
                  className={`h-2.5 rounded-full transition-all disabled:cursor-not-allowed ${
                    atual
                      ? 'w-8 bg-indigo-600'
                      : percorrido
                        ? 'w-2.5 bg-indigo-300 hover:bg-indigo-400'
                        : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              </li>
            );
          })}
        </ol>
        <span className="ml-auto shrink-0 text-sm tabular-nums text-slate-500">
          {disabled ? '—' : `${index + 1} / ${totalSteps}`}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span id="rotulo-velocidade" className="text-sm text-slate-500">
          Velocidade
        </span>
        <div
          className="flex overflow-hidden rounded-lg border border-slate-300"
          role="group"
          aria-labelledby="rotulo-velocidade"
        >
          {SPEED_OPTIONS.map((opcao: PlaybackSpeed) => (
            <button
              key={opcao}
              type="button"
              onClick={() => {
                player.setSpeed(opcao);
              }}
              aria-pressed={player.speed === opcao}
              className={`h-10 px-2.5 text-sm font-medium tabular-nums transition-colors ${
                player.speed === opcao
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opcao}×
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Ícones (SVG inline, para não depender de biblioteca externa) ------------

function IconePlay() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3.5 2.5v11l10-5.5z" />
    </svg>
  );
}

function IconePausa() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />
    </svg>
  );
}

function IconeAnterior() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M12.5 2.5v11l-8-5.5zM3.5 2.5H5v11H3.5z" />
    </svg>
  );
}

function IconeProximo() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3.5 2.5v11l8-5.5zM11 2.5h1.5v11H11z" />
    </svg>
  );
}

function IconeReiniciar() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
      <path d="M13.2 1.8v2.9h-2.9" />
    </svg>
  );
}
