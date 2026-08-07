import { useRef, useState } from 'react';
import { LinkedListSimulator } from './components/linked-list/LinkedListSimulator';
import { LinkedQueueSimulator } from './components/queue/LinkedQueueSimulator';
import { QueueSimulator } from './components/queue/QueueSimulator';
import { LinkedStackSimulator } from './components/stack/LinkedStackSimulator';
import { StackSimulator } from './components/stack/StackSimulator';
import type { Implementation } from './components/shared/ImplementationSwitch';

interface StructureTab {
  readonly id: string;
  readonly label: string;
  readonly render: () => React.ReactNode;
}

/**
 * A aba é do **tipo abstrato**, não da implementação: pilha é pilha, tenha ela
 * sido feita com vetor ou com ponteiros. A escolha da implementação vive dentro
 * da aba, para que trocar entre as duas seja um gesto de comparação — que é
 * exatamente o que a unidade de TAD da disciplina pede.
 */
function StackTab() {
  const [implementacao, setImplementacao] = useState<Implementation>('array');
  return implementacao === 'array' ? (
    <StackSimulator implementation={implementacao} onImplementationChange={setImplementacao} />
  ) : (
    <LinkedStackSimulator
      implementation={implementacao}
      onImplementationChange={setImplementacao}
    />
  );
}

function QueueTab() {
  const [implementacao, setImplementacao] = useState<Implementation>('array');
  return implementacao === 'array' ? (
    <QueueSimulator implementation={implementacao} onImplementationChange={setImplementacao} />
  ) : (
    <LinkedQueueSimulator
      implementation={implementacao}
      onImplementationChange={setImplementacao}
    />
  );
}

const TABS: readonly StructureTab[] = [
  { id: 'pilha', label: 'Pilha', render: () => <StackTab /> },
  { id: 'fila', label: 'Fila', render: () => <QueueTab /> },
  { id: 'lista-ligada', label: 'Lista Ligada', render: () => <LinkedListSimulator /> },
];

export default function App() {
  const [activeId, setActiveId] = useState<string>(TABS[0]?.id ?? '');
  const active = TABS.find((tab) => tab.id === activeId) ?? TABS[0];
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Navegação por setas dentro da barra de abas, como manda o padrão ARIA de
   * `tablist`. Sem isso o `role="tab"` prometeria ao leitor de tela um
   * comportamento que não existe.
   */
  function aoTeclar(event: React.KeyboardEvent<HTMLUListElement>) {
    const atual = TABS.findIndex((tab) => tab.id === active?.id);
    if (atual < 0) return;

    const destino =
      event.key === 'ArrowRight'
        ? (atual + 1) % TABS.length
        : event.key === 'ArrowLeft'
          ? (atual - 1 + TABS.length) % TABS.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? TABS.length - 1
              : -1;

    if (destino < 0) return;
    event.preventDefault();
    // `stopPropagation` impede que a mesma seta chegue ao atalho global do
    // reprodutor e avance a animação junto com a troca de aba.
    event.stopPropagation();

    const alvo = TABS[destino];
    if (alvo === undefined) return;
    setActiveId(alvo.id);
    botoes.current[destino]?.focus();
  }

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

          <ul className="flex gap-1" role="tablist" onKeyDown={aoTeclar}>
            {TABS.map((tab, posicao) => {
              const selecionada = tab.id === active?.id;
              return (
                <li key={tab.id} role="presentation">
                  <button
                    type="button"
                    role="tab"
                    id={`aba-${tab.id}`}
                    ref={(elemento) => {
                      botoes.current[posicao] = elemento;
                    }}
                    aria-selected={selecionada}
                    aria-controls={`painel-${tab.id}`}
                    // Tabulação roving: o Tab entra e sai da barra de abas de
                    // uma vez; a navegação entre elas é pelas setas.
                    tabIndex={selecionada ? 0 : -1}
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
