# Simulador de Estruturas de Dados — AED

Aplicação web educacional que ilustra, passo a passo, o funcionamento de
**pilha**, **fila** e **lista ligada** (simples e dupla). Cada operação é
decomposta em passos discretos, com descrição em português, pseudocódigo
sincronizado e complexidade Big-O, para uso em aula (projeção) ou estudo
individual.

Sem backend, sem login, sem banco de dados: é uma página estática que roda
inteiramente no navegador.

## Como rodar

Requer **Node.js 20 ou superior**.

```bash
npm install
npm run dev      # servidor de desenvolvimento (http://localhost:5173)
npm run build    # build estático em dist/
npm run preview  # serve o build
npm test         # testes unitários (Vitest)
npm run lint     # ESLint
```

O build é 100% estático: a pasta `dist/` pode ser publicada em Vercel, Netlify
ou GitHub Pages sem configuração adicional.

## O que dá para fazer

A navegação superior alterna entre as três estruturas. Cada simulador tem o
mesmo formato: controles no topo, visualização ao centro, e um painel lateral
com passo atual, complexidade, pseudocódigo e log da sessão.

### Pilha (array com capacidade fixa)

`push(valor)` · `pop()` · `peek()` · `isEmpty()` · `isFull()`

Desenhada verticalmente, da base ao topo, com todas as posições do array
visíveis — inclusive as vazias, para que a capacidade seja concreta. Capacidade
ajustável (4 a 20 posições; padrão 10), o que permite demonstrar *overflow* sem
empilhar dezenas de elementos.

### Fila (array circular)

`enqueue(valor)` · `dequeue()` · `peek()` · `isEmpty()` · `isFull()`

Desenhada horizontalmente, com os ponteiros de **início** e **fim** rotulados
sobre as posições físicas do array. Como o array é circular, dá para mostrar os
ponteiros dando a volta — o momento em que a maioria dos alunos trava.
Capacidade ajustável (4 a 20; padrão 8).

### Lista ligada (simples e duplamente ligada)

`insertHead` · `insertTail` · `insertAt(i)` · `deleteHead` · `deleteTail` ·
`deleteAt(i)` · `search(valor)`

Nós como caixas conectadas por setas, com `head`, `tail` e o `NULL` das
extremidades explícitos. Na variante dupla, as setas `prev` aparecem também no
pseudocódigo. `search` percorre nó a nó, destacando cada visita — é a forma mais
direta de mostrar por que a busca é O(n).

Trocar de variante reinicia a lista. A visualização comporta 20 nós; o aviso na
interface deixa claro que esse limite é da tela, não da estrutura.

### Montar o cenário em um clique

Demonstrar `pop`, `dequeue` ou `search` exige uma estrutura já povoada, e digitar
meia dúzia de valores no projetor custa tempo de aula. Dois atalhos resolvem
isso:

- **Preencher** povoa a estrutura com valores aleatórios distintos e vira o novo
  ponto de partida — é preparação, não operação, então não gera passos nem
  entrada no log (e reinicia o log atual). Na pilha e na fila ocupa cerca de 60%
  da capacidade, deixando espaço para demonstrar inserções; na lista, cria cinco
  nós. A fila fica com `início` e `fim` nos índices que os mesmos `enqueue`
  teriam produzido.
- **Botão de dado** ao lado do campo de valor sorteia um número e o coloca no
  campo. A operação seguinte roda normalmente, passo a passo.

Os valores sorteados vão de 1 a 99 e nunca se repetem dentro de uma mesma
estrutura — repetição atrapalharia a demonstração de `search`, em que o aluno
precisa saber se o percurso parou na primeira ocorrência.

### Reprodução

Play/pause, próximo/anterior passo, reiniciar e velocidade (0,5× a 3×). Toda
operação registrada no log pode ser **revista** com um clique, sem alterar o
estado atual da estrutura.

| Tecla | Ação |
|---|---|
| `Espaço` | Reproduzir / pausar |
| `→` | Próximo passo |
| `←` | Passo anterior |
| `Home` | Voltar ao primeiro passo |

Os atalhos são ignorados enquanto o foco está num campo de texto.

### Legenda de cores

O mesmo vocabulário visual vale nas três estruturas — o aluno aprende uma vez:

| Cor | Significado |
|---|---|
| Verde | Entrando na estrutura / valor encontrado |
| Vermelho | Saindo da estrutura |
| Âmbar | Sendo examinado (peek, percurso de busca) |
| Violeta | Posição alvo da operação |
| Índigo | Ponteiro em foco (topo, início, fim, cabeça, cauda) |

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
| Capacidade **ajustável** na pilha e na fila | Demonstrar overflow com capacidade 4 leva quatro cliques, não vinte. |

## Stack e qualidade

React 19 + TypeScript estrito, Vite, Tailwind CSS v4, Framer Motion para as
animações, Vitest para os testes. Estado local aos componentes — o escopo não
justifica Redux nem Context global.

Os testes cobrem a lógica pura das três estruturas, os planejadores de passos
(quantidade de passos, complexidade anunciada, tratamento dos casos de borda) e
um teste de fumaça da camada visual. Rode com `npm test`.

Acessibilidade: navegação por abas com `role="tablist"`, foco de teclado em
todos os controles, `aria-label` descrevendo o estado das estruturas para
leitores de tela e cores com contraste adequado para projeção.

## Fora do escopo desta versão

Árvores (BST/AVL), grafos, tabelas hash, editor de código integrado e exportação
de animação — conforme a seção 10 da [especificação](especificacoes.MD).
