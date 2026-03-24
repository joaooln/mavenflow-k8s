<div align="center">

# Mavenflow

**Gerenciador de projetos e tarefas inspirado no Trello**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## Sobre

Mavenflow é um aplicativo web de gerenciamento de projetos e tarefas com visual moderno e funcionalidades inspiradas no Trello. Organize seus projetos em boards, listas e cards, defina prioridades, datas de vencimento, responsáveis e acompanhe o progresso — tudo salvo localmente no navegador, sem precisar de backend.

---

## Funcionalidades

### Boards
- Crie múltiplos boards com **backgrounds customizáveis** (cores sólidas e gradientes)
- Renomeie e exclua boards
- Acesso rápido via sidebar

### Cards (Kanban e Lista)
- Visualize seus cards em modo **Kanban** (colunas com drag-and-drop) ou **Lista**
- Crie, reordene e mova cards entre colunas
- Adicione e renomeie colunas livremente

### Detalhe do Card
- **Título e descrição** editáveis inline
- **Labels** coloridas: crie, edite e atribua por board
- **Membros**: atribua responsáveis com avatar e cor
- **Data de vencimento** com indicadores visuais (verde / amarelo / vermelho)
- **Checklists** com progresso em barra, múltiplas por card
- **Comentários** com histórico e timestamps
- **Log de atividade** automático por ação
- **Arquivar/restaurar** cards sem excluir permanentemente

### Filtros e Busca
- Filtrar cards por label, membro, prioridade e vencimento
- Busca em tempo real por título e descrição
- Visualização de cards arquivados

### Dashboard
- Saudação personalizada com horário do dia
- Estatísticas: boards, cards totais, concluídos e atrasados
- Cards vencendo nos próximos 7 dias (de todos os boards)
- Progresso rápido por board
- Feed de atividade recente

### Perfil do Usuário
- Nome, e-mail, bio e iniciais editáveis
- Avatar com 12 cores customizáveis
- Dados persistidos no `localStorage`
- Nome refletido em comentários e atividades

---

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| [React](https://react.dev) | 19 | Framework UI |
| [Vite](https://vitejs.dev) | 8 | Build tool e dev server |
| [@dnd-kit](https://dndkit.com) | 6/10 | Drag-and-drop |
| [Lucide React](https://lucide.dev) | 0.577 | Ícones SVG |
| CSS puro + variáveis | — | Estilização |

Sem backend, sem banco de dados — persistência via `localStorage`.

---

## Instalação

```bash
# Clone o repositório
git clone https://github.com/joaooln/mavenflow.git
cd mavenflow

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse **http://localhost:5173** no navegador.

### Scripts disponíveis

```bash
npm run dev      # Servidor de desenvolvimento com HMR
npm run build    # Build de produção
npm run preview  # Preview do build de produção
npm run lint     # Verificação de código com ESLint
```

---

## Estrutura do projeto

```
src/
├── components/
│   ├── CardDetailModal.jsx   # Modal completo do card (estilo Trello)
│   ├── Sidebar.jsx           # Navegação lateral com lista de boards
│   ├── TopBar.jsx            # Barra superior com perfil do usuário
│   └── UserProfileModal.jsx  # Modal de edição de perfil
├── data/
│   └── initialData.js        # Dados iniciais de exemplo
├── hooks/
│   └── useLocalStorage.js    # Hook de persistência no localStorage
├── views/
│   ├── BoardsHomeView.jsx    # Tela inicial com grid de boards
│   ├── BoardView.jsx         # Board com Kanban/Lista e filtros
│   └── DashboardView.jsx     # Dashboard com stats e atividade
└── App.jsx                   # Estado global e roteamento
```

---

## Licença

MIT © [João](https://github.com/joaooln)
