# Simulador de Estruturas de Dados — AED

Aplicação web educacional que ilustra, passo a passo, o funcionamento de
**pilha**, **fila** e **lista ligada** (simples e dupla). Cada operação é
decomposta em passos discretos, com descrição em português, pseudocódigo
sincronizado e complexidade Big-O, para uso em aula (projeção) ou estudo
individual.

## Como rodar

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # build estático em dist/
npm run preview  # serve o build
npm test         # testes unitários
npm run lint     # ESLint
```

O build é 100% estático e não depende de backend: a pasta `dist/` pode ser
publicada em Vercel, Netlify ou GitHub Pages sem configuração adicional.

## Arquitetura

O princípio que organiza o projeto é a separação entre **lógica** e
**apresentação**:

```
src/
  core/
    data-structures/   Lógica pura: funções sobre estado imutável, sem React.
    step-engine/       Decompõe cada operação em passos narrados.
  hooks/               Reprodução da animação e orquestração do simulador.
  components/          Camada visual (React + Framer Motion).
  types/               Modelo de passo e snapshots por estrutura.
```

**`core/data-structures`** não importa React nem conhece animação. Cada operação
é uma função pura `(estado, argumentos) → resultado`, o que a torna testável
isoladamente — é onde está a maior parte dos testes.

**`core/step-engine`** é a única camada que conhece as duas pontas: chama a
lógica pura e narra o que aconteceu, produzindo uma `OperationTrace` — a
operação decomposta em passos.

Cada passo carrega um **snapshot completo e imutável** da estrutura naquele
instante. É essa decisão que torna "voltar um passo" uma simples indexação num
array, sem lógica de desfazer. Com estruturas de até ~20 elementos, o custo é
irrelevante.

**`components/`** nunca chama `push`, `pop` ou `insertAt` diretamente: pede uma
trilha ao planejador e renderiza `trace.steps[i].snapshot`. Trocar a forma de
visualização não toca em uma linha de lógica.

### Casos de borda não são exceções

Pilha vazia, fila cheia, índice inválido e busca sem resultado **não lançam
erro**: produzem uma trilha normal, com um passo final que explica ao aluno por
que a operação não pôde ser concluída. Nos controles, as operações inaplicáveis
ficam desabilitadas e um aviso explica o motivo em termos da estrutura
("um `pop()` aqui causaria underflow").

## Decisões de implementação

| Decisão | Motivo |
|---|---|
| Fila como **array circular** | É o que se ensina em AED, torna `isFull()` significativo e mantém `dequeue` em O(1). O ponteiro `fim` marca a próxima posição livre; o contador `total` distingue fila vazia de cheia quando os ponteiros coincidem. |
| Lista ligada como **mapa `id → nó`** | Mantém o estado imutável e serializável sem esconder a manipulação de ponteiros `next`/`prev`, que é justamente o que se quer ensinar. |
| Lista ligada **sem capacidade máxima** | Uma lista ligada nunca fica "cheia" — cada nó é alocado individualmente. O limite de 20 nós é da visualização, e o aviso na interface deixa isso explícito. |
| Pseudocódigo **gerado por variante** | As linhas de ponteiro `prev` só aparecem na lista duplamente ligada, para não confundir quem estuda a variante simples. |

## Atalhos de teclado

| Tecla | Ação |
|---|---|
| `Espaço` | Reproduzir / pausar |
| `→` | Próximo passo |
| `←` | Passo anterior |
| `Home` | Voltar ao primeiro passo |

Os atalhos são ignorados enquanto o foco está num campo de texto.

## Fora do escopo desta versão

Árvores (BST/AVL), grafos, tabelas hash, editor de código integrado e exportação
de animação — conforme a seção 10 da especificação.
