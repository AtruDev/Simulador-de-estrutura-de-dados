import type { ReactNode } from 'react';

interface SimulatorLayoutProps {
  readonly title: string;
  readonly subtitle: string;
  /** Painel de controles (input + botões de operação). */
  readonly controls: ReactNode;
  /** Área central de visualização da estrutura. */
  readonly canvas: ReactNode;
  /** Controles de reprodução da animação. */
  readonly playback: ReactNode;
  /** Painel lateral: passo atual, complexidade, pseudocódigo e log. */
  readonly side: ReactNode;
}

/**
 * Disposição comum às três estruturas: controles no topo, visualização ao
 * centro e painel de apoio à direita (abaixo, em telas estreitas).
 */
export function SimulatorLayout({
  title,
  subtitle,
  controls,
  canvas,
  playback,
  side,
}: SimulatorLayoutProps) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        </header>

        {controls}

        <div className="painel min-h-[26rem] p-6">{canvas}</div>

        {playback}
      </div>

      <div className="flex flex-col gap-4">{side}</div>
    </div>
  );
}
