# Roadmap — cobertura da ementa de AED

Este documento mapeia a ementa da disciplina para o simulador: o que já está
pronto, o que falta e em que ordem construir. A especificação original
([`especificacoes.MD`](especificacoes.MD)) descreve a v1; aqui está o caminho
até cobrir o programa inteiro.

O critério que ordena as fases não é a sequência da ementa, e sim a
**dependência técnica**: cada fase entrega algo utilizável em aula e prepara o
terreno da seguinte.

## Situação atual (v1)

| Unidade da ementa | Situação |
|---|---|
| Tipos de Dados, Estrutura de Dados e TAD | Parcial — implícito nas estruturas, sem tratamento explícito |
| Complexidade algorítmica | Parcial — Big-O por operação; falta análise e curvas |
| Paradigmas de projeto de algoritmos | Não iniciado |
| Estruturas lineares — alocação sequencial (vetores) | **Pronto** — pilha e fila em array (fila circular) |
| Estruturas lineares — alocação dinâmica (ponteiros) | **Parcial** — listas simples e dupla prontas; falta pilha e fila encadeadas |
| Ordenação interna e externa | Não iniciado |
| Pesquisa em memória primária | Não iniciado |
| Pesquisa em memória secundária | Não iniciado |

## Capacidades transversais que faltam

Três recursos aparecem em quase todas as unidades restantes e não existem hoje.
Construí-los uma vez, na fase 1, evita reconstruí-los em cada módulo:

- **Contadores por passo** — comparações, movimentações/trocas e acessos.
  Sustentam *Técnicas de Análise de Algoritmos* empiricamente: o aluno conta 190
  comparações num bubble sort de 20 elementos e confere com n²/2.
- **Painel de curvas assintóticas** — O(1), O(log n), O(n), O(n log n), O(n²),
  com o ponto da execução atual plotado sobre elas. Cobre *Comportamento
  Assintótico* e *Classes de Comportamento* numa tela só.
- **Pilha de chamadas** — base da recursividade, reaproveitando a visualização
  da pilha que já existe. É o gancho didático mais forte do projeto: a recursão
  usa exatamente a estrutura vista na primeira aula.

E um item de arquitetura: **três abas não escalam para vinte tópicos**. A
navegação precisa virar um menu agrupado pelas unidades da ementa — barato agora,
caro depois de seis módulos.

---

## Fase 0 — Publicar a v1

Colocar o simulador na mão dos alunos antes de aumentar o escopo.

- [x] Acessibilidade: navegação por setas nas abas, foco visível, `prefers-reduced-motion`
- [x] README com funcionalidades, arquitetura e decisões
- [x] Deploy contínuo na Vercel, a cada push na `main`
- [x] Descrição e topics no repositório

## Fase 1 — Fundamentos transversais

Nenhuma estrutura nova; tudo que vem depois depende desta fase.

- [x] Contadores de operação no modelo de passo (`Step`), exibidos junto da
  complexidade e acumulados por operação.
- Painel de curvas assintóticas, com a execução atual marcada sobre a curva.
- Pilha e fila **encadeadas** (alocação dinâmica), completando as estruturas
  lineares da ementa.
- Painel **TAD × implementação** em cada estrutura: as operações do tipo abstrato
  de um lado, a implementação concreta do outro. Não vira módulo próprio — como
  tela isolada seria texto que ninguém lê.
- Navegação agrupada pelas unidades da ementa.

**Pronto quando:** o mesmo TAD (pilha) pode ser visto nas duas implementações,
lado a lado, com os contadores mostrando onde elas diferem.

## Fase 2 — Ordenação interna

- Método da bolha e método da inserção — os dois quadráticos, para o aluno ver
  os contadores explodirem.
- QuickSort e MergeSort.
- Comparação lado a lado: mesmo vetor, dois algoritmos, contadores em confronto.

**Decisão pendente:** quicksort com 20 elementos gera passos demais para uma
aula. Será preciso granularidade ajustável — passo por comparação, por troca ou
por partição.

**Pronto quando:** um mesmo vetor pode ser ordenado pelos quatro métodos com os
contadores comparáveis entre eles.

## Fase 3 — Paradigmas de projeto de algoritmos

- **Recursividade** com pilha de chamadas visível (fatorial, Fibonacci, Hanói).
- **Divisão e conquista** — merge e quick da fase 2 são os exemplos; aqui ganham
  a leitura em árvore de recursão.
- **Tentativa e erro** (backtracking) — N-rainhas ou labirinto, com o retrocesso
  visível na pilha.
- **Balanceamento** — introduz o conceito que a fase 4 usa nas árvores AVL.

## Fase 4 — Pesquisa em memória primária

- Pesquisa sequencial e binária sobre vetor (reaproveita o visual da fase 2), com
  o contraste de contadores mostrando por que a ordenação prévia compensa.
- Árvore binária de pesquisa sem balanceamento: inserção, busca, remoção e os
  três percursos.
- Árvore binária com balanceamento (AVL): rotações passo a passo.
- Árvores digitais (trie).

**Novidade técnica:** layout em árvore (SVG), o primeiro desenho não linear do
projeto.

## Fase 5 — Tabela hash

- Funções de transformação: resto da divisão, dobra e multiplicação — as três
  visíveis, com o mesmo conjunto de chaves, para comparar a dispersão.
- Formas de encadeamento e tratamento de colisões.
- Fator de carga e seu efeito no número de acessos.

Independente da fase 4 — pode trocar de lugar com ela.

## Fase 6 — Pesquisa em memória secundária

- Modelo de computação para memória secundária, com **contador de acessos a
  disco** (o contador da fase 1 aplicado a blocos).
- Métodos de intercalação externa. A ementa os lista em Ordenação, mas só fazem
  sentido depois do modelo de acesso em blocos — por isso estão aqui.
- Árvores B, B+ e B*.
