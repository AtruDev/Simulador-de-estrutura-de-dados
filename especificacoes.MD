# Especificação — Simulador Web de Estruturas de Dados (AED)

## 1. Visão geral

Aplicação web educacional para ilustrar, de forma visual e interativa, o funcionamento de estruturas de dados básicas ensinadas em uma disciplina de Algoritmos e Estruturas de Dados (AED). O foco é a **visualização passo a passo** de cada operação (inserção, remoção, busca), permitindo que o aluno acompanhe exatamente o que acontece internamente na estrutura a cada instante.

Público-alvo: alunos de graduação em uma disciplina introdutória de AED, para uso em aula (projeção) ou individualmente (estudo/revisão).

## 2. Escopo funcional (v1)

Estruturas cobertas nesta primeira versão:

- **Pilha (Stack)** — baseada em array.
- **Fila (Queue)** — baseada em array (com ponteiros de início/fim, ou array circular).
- **Lista ligada** — lista simplesmente ligada e lista duplamente ligada.

Fora de escopo da v1 (roadmap futuro, ver seção 9): árvores (BST/AVL), grafos, tabelas hash.

## 3. Requisitos funcionais por estrutura

### 3.1 Pilha (Stack)

Operações suportadas:
- `push(valor)` — insere no topo.
- `pop()` — remove do topo.
- `peek()` — mostra o elemento do topo sem remover.
- `isEmpty()` / `isFull()` (se capacidade limitada, ex. 10 elementos, para deixar claro o conceito de overflow).

Visualização: pilha representada verticalmente (ou horizontalmente), topo destacado. Ao fazer `push`, o novo elemento deve "entrar" com animação vindo de fora da estrutura até a posição do topo. Ao fazer `pop`, o elemento do topo deve ser destacado e depois "sair" com animação antes de ser removido do estado.

### 3.2 Fila (Queue)

Operações suportadas:
- `enqueue(valor)` — insere no fim.
- `dequeue()` — remove do início.
- `peek()` — mostra o elemento da frente sem remover.
- `isEmpty()` / `isFull()`.

Visualização: fila representada horizontalmente, com rótulos claros de "início/frente" e "fim/traseira". Animação equivalente à da pilha, mas respeitando a ordem FIFO.

### 3.3 Lista ligada

Duas variantes selecionáveis: **simplesmente ligada** e **duplamente ligada**.

Operações suportadas:
- `insertHead(valor)`
- `insertTail(valor)`
- `insertAt(indice, valor)`
- `deleteHead()`
- `deleteTail()`
- `deleteAt(indice)`
- `search(valor)` — percorre nó a nó destacando cada nó visitado até encontrar (ou não) o valor.

Visualização: nós desenhados como caixas conectadas por setas (ponteiro `next`, e `prev` no caso da lista dupla). Cabeça (`head`) e cauda (`tail`) explicitamente rotuladas. Ponteiro `NULL`/`nullptr` visível nas extremidades.

## 4. Requisito central: passo a passo (step-by-step)

Este é o requisito mais importante do produto. Cada operação, ao ser disparada, deve:

1. Ser decomposta em **passos discretos e didáticos** (ex.: `push` = "1. cria novo elemento" → "2. verifica espaço disponível" → "3. posiciona no topo" → "4. atualiza ponteiro/índice de topo").
2. Cada passo deve ter uma **descrição textual curta** exibida junto à animação (o que está acontecendo e por quê).
3. O usuário deve poder controlar o ritmo: **Play/Pause**, **Próximo passo / Passo anterior**, e um controle de **velocidade da animação**.
4. Ao final da operação, mostrar um **log de operações** (histórico) que o aluno pode revisar depois.
5. Sempre que fizer sentido, exibir a **complexidade (Big-O)** da operação realizada (ex.: `push` em pilha por array = O(1); `insertAt(i)` em lista ligada = O(n)).

## 5. Requisitos de interface

- Seleção da estrutura ativa via navegação/abas (Pilha, Fila, Lista Ligada).
- Painel de controles: campo de input do valor + botões de cada operação, desabilitados quando a operação não é aplicável (ex. `pop` com pilha vazia).
- Área central de visualização (canvas da estrutura).
- Painel lateral/inferior: descrição do passo atual + log de operações + complexidade.
- Opcional (desejável, não bloqueante): exibir o pseudocódigo ou trecho de código da operação em execução, com a linha atual destacada em sincronia com o passo da animação.
- Responsivo o suficiente para funcionar em projeção de sala de aula (telas grandes) e em notebook do aluno. Não é prioridade suportar celular.
- Modo claro por padrão; dark mode é um "nice to have", não obrigatório.

## 6. Requisitos não funcionais

- **Sem backend** — aplicação 100% client-side, estado em memória (React state), nada precisa ser persistido no servidor.
- **Sem necessidade de login/autenticação.**
- Performance: animações fluidas mesmo com estruturas de até ~20 elementos.
- Acessibilidade básica: contraste adequado, foco de teclado nos controles, textos alternativos para leitores de tela nos elementos interativos.
- Código em **TypeScript com tipagem estrita** (sem `any` desnecessário).
- Deploy simples: build estático (Vite) publicável em qualquer hosting estático (Vercel, Netlify, GitHub Pages).

## 7. Stack técnica

- **React + TypeScript**, bundler **Vite**.
- Estilização: Tailwind CSS (ou CSS Modules — decisão do time de implementação, mas manter consistência em todo o projeto).
- Animação: biblioteca de animação declarativa (ex. Framer Motion) para as transições de entrada/saída dos elementos e movimentação de ponteiros.
- Gerenciamento de estado: local ao componente / Context API é suficiente — não há necessidade de Redux ou bibliotecas externas de estado global dado o escopo.
- Sem dependência de backend, banco de dados ou APIs externas.

## 8. Arquitetura sugerida

```
src/
  components/
    stack/          # visualização + controles da Pilha
    queue/          # visualização + controles da Fila
    linked-list/     # visualização + controles da Lista Ligada
    shared/          # controles comuns (Play/Pause, step controls, log, badge de complexidade)
  core/
    data-structures/ # implementação "pura" das estruturas (lógica, sem UI)
    step-engine/      # motor que decompõe cada operação em passos e expõe estado do passo atual
  hooks/
  types/
  App.tsx
```

Princípio chave: a **lógica da estrutura de dados** deve ser separada da **camada de visualização**. Isso permite testar as estruturas de forma isolada (unit tests) e trocar a forma de visualização sem reescrever a lógica.

## 9. Critérios de aceite (definição de pronto da v1)

- [ ] As três estruturas (Pilha, Fila, Lista Ligada simples e dupla) funcionam com todas as operações listadas na seção 3.
- [ ] Toda operação é visualizada passo a passo, com texto explicativo por passo.
- [ ] Usuário controla play/pause, avançar/voltar passo e velocidade.
- [ ] Complexidade Big-O é exibida para cada operação.
- [ ] Log de operações persiste durante a sessão (não precisa sobreviver a refresh).
- [ ] Estados de borda tratados e comunicados visualmente: estrutura vazia, estrutura cheia (quando aplicável), valor não encontrado em busca.
- [ ] Projeto builda sem erros (`npm run build`) e roda localmente (`npm run dev`).
- [ ] Sem erros de tipagem TypeScript, sem warnings de lint não justificados.

## 10. Fora de escopo / roadmap futuro

Planejado para versões futuras, não fazem parte do MVP:

- Árvores (BST, AVL) com rotações visualizadas.
- Grafos (BFS, DFS, Dijkstra).
- Tabelas hash com tratamento de colisão.
- Editor de código integrado (playground) para o aluno escrever e executar contra a estrutura.
- Modo de exportação de animação em GIF/vídeo para uso em slides.

## 11. Notas de uso pedagógico

- Os textos explicativos de cada passo devem usar a terminologia normalmente ensinada em AED (ex. "topo", "base", "nó", "ponteiro `next`", "cabeça", "cauda"), em português, para que o material seja diretamente utilizável em sala de aula.
- Evitar jargão de implementação desnecessário na explicação ao aluno (ex. não expor detalhes de React/estado interno — a explicação é sobre a estrutura de dados, não sobre a aplicação).
