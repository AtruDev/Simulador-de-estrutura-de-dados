import { useState } from 'react';
import { LinkedListSimulator } from './components/linked-list/LinkedListSimulator';
import { QueueSimulator } from './components/queue/QueueSimulator';
import { StackSimulator } from './components/stack/StackSimulator';

interface StructureTab {
  readonly id: string;
  readonly label: string;
  readonly render: () => React.ReactNode;
}

const TABS: readonly StructureTab[] = [
  { id: 'pilha', label: 'Pilha', render: () => <StackSimulator /> },
  { id: 'fila', label: 'Fila', render: () => <QueueSimulator /> },
  { id: 'lista-ligada', label: 'Lista Ligada', render: () => <LinkedListSimulator /> },
];

export default function App() {
  const [activeId, setActiveId] = useState<string>(TABS[0]?.id ?? '');
  const active = TABS.find((tab) => tab.id === activeId) ?? TABS[0];

  return (
    <div className="min-h-screen">
      <nav
        className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur"
        aria-label="Estruturas de dados"
      >
        <div className="mx-auto flex max-w-[104rem] items-center gap-6 px-4 py-3">
          <span className="text-sm font-bold tracking-tight text-slate-900">
            Simulador de Estruturas de Dados
            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
              AED
            </span>
          </span>

          <ul className="flex gap-1" role="tablist">
            {TABS.map((tab) => {
              const selecionada = tab.id === active?.id;
              return (
                <li key={tab.id} role="presentation">
                  <button
                    type="button"
                    role="tab"
                    id={`aba-${tab.id}`}
                    aria-selected={selecionada}
                    aria-controls={`painel-${tab.id}`}
                    onClick={() => {
                      setActiveId(tab.id);
                    }}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                      selecionada
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <main className="mx-auto max-w-[104rem] p-4">
        {active !== undefined && (
          <div role="tabpanel" id={`painel-${active.id}`} aria-labelledby={`aba-${active.id}`}>
            {active.render()}
          </div>
        )}
      </main>
    </div>
  );
}
