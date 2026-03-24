<div align="center">

# Mavenflow

**Gerenciador de projetos e tarefas colaborativo — inspirado no Trello**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-on--prem-326CE5?style=flat-square&logo=kubernetes&logoColor=white)](https://kubernetes.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## Sobre

Mavenflow é uma aplicação web full-stack de gerenciamento de projetos com boards Kanban, colaboração em tempo real via WebSockets e controle de acesso por board. Projetado para rodar on-premises em Kubernetes com Traefik como ingress controller.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cluster Kubernetes                        │
│                        namespace: mavenflow                      │
│                                                                  │
│   ┌──────────┐     ┌─────────────────────────────────────────┐  │
│   │  Traefik │────▶│           IngressRoute                   │  │
│   │ (ingress)│     │  /api  ──▶  mavenflow-api:3001           │  │
│   └──────────┘     │  /ws   ──▶  mavenflow-api:3001 (WS)     │  │
│                    │  /     ──▶  mavenflow-frontend:80        │  │
│                    └─────────────────────────────────────────┘  │
│                                                                  │
│   ┌────────────────┐   ┌───────────────┐   ┌─────────────────┐  │
│   │    Frontend    │   │      API      │   │   PostgreSQL    │  │
│   │  nginx:alpine  │   │  Node.js 22   │   │   v16 + PVC     │  │
│   │  React 19 SPA  │   │  Express +    │   │   5 Gi RWO      │  │
│   │  2 réplicas    │   │  WebSocket    │   │   1 réplica     │  │
│   └────────────────┘   │  2 réplicas   │   └─────────────────┘  │
│                        └───────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de dados

```
Browser
  │
  ├── REST  HTTP/HTTPS  ──▶  /api/*  ──▶  Express Routes  ──▶  PostgreSQL
  │                                                │
  └── WebSocket  ws(s)://  ──▶  /ws?token=JWT     │
           │                         │             │
           │   board:update ◀────────┤  broadcastBoardUpdate()
           │   notification ◀────────┘  pushNotification(userId)
```

---

## Funcionalidades

### Autenticação
- Cadastro e login com e-mail + senha (bcrypt + JWT 7 dias)
- Sessão restaurada automaticamente via token no `localStorage`
- Logout com invalidação local do token

### Boards e Controle de Acesso
- Crie boards com backgrounds customizáveis (cores/gradientes)
- Convide membros por e-mail — notificação em tempo real ao convidado
- Papéis: **owner** (criador) e **member**
- Somente membros do board acessam seus dados

### Cards (Kanban e Lista)
- Modo **Kanban** com drag-and-drop entre colunas
- Modo **Lista** compacto
- Crie, reordene e mova cards entre colunas

### Detalhe do Card
- Título e descrição editáveis inline
- Labels coloridas por board (criar/renomear/excluir)
- Membros com avatar e cor
- Data de vencimento com indicadores visuais
- Checklists com barra de progresso
- Comentários com histórico — notifica membros do card em tempo real
- Log de atividade automático
- Arquivar / restaurar sem excluir

### Colaboração em Tempo Real
- Qualquer alteração num board (card movido, criado, editado) é propagada imediatamente para todos os membros conectados via WebSocket
- Notificações push: convite para board, atribuição a card, novo comentário
- Painel de notificações na TopBar com contador de não lidas

### Dashboard
- Saudação personalizada com período do dia
- Estatísticas: boards, cards totais, concluídos, atrasados
- Cards vencendo nos próximos 7 dias
- Progresso por board
- Feed de atividade recente

---

## Stack

### Frontend

| Tecnologia | Versão | Uso |
|---|---|---|
| [React](https://react.dev) | 19 | Framework UI |
| [Vite](https://vitejs.dev) | 8 | Build + dev server |
| [@dnd-kit](https://dndkit.com) | 6/10 | Drag-and-drop |
| [Lucide React](https://lucide.dev) | latest | Ícones SVG |
| CSS puro + custom properties | — | Estilização |

### Backend

| Tecnologia | Versão | Uso |
|---|---|---|
| [Node.js](https://nodejs.org) | 22 | Runtime |
| [Express](https://expressjs.com) | 5 | REST API |
| [ws](https://github.com/websockets/ws) | 8 | WebSocket server |
| [PostgreSQL](https://postgresql.org) | 16 | Banco de dados |
| [pg](https://node-postgres.com) | 8 | Driver PostgreSQL |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | 9 | JWT auth |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 3 | Hash de senhas |

### Infraestrutura

| Componente | Tecnologia |
|---|---|
| Container runtime | Docker (multi-stage build) |
| Orquestração | Kubernetes (on-premises) |
| Ingress controller | Traefik v2/v3 (IngressRoute CRD) |
| Namespace | `mavenflow` |
| Persistência | PersistentVolumeClaim 5Gi (PostgreSQL) |

---

## Desenvolvimento local

### Pré-requisitos

- Node.js 22+
- Docker e Docker Compose

### Subir com Docker Compose

```bash
# Clone o repositório
git clone https://github.com/joaooln/mavenflow-k8s.git
cd mavenflow-k8s

# Copie e edite as variáveis de ambiente
cp backend/.env.example backend/.env

# Suba todos os serviços
docker compose up --build
```

| Serviço | Endereço |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001 |
| PostgreSQL | localhost:5432 |

### Desenvolvimento sem Docker

```bash
# Frontend
npm install
npm run dev          # http://localhost:5173

# Backend (em outro terminal)
cd backend
npm install
# configure backend/.env com DATABASE_URL e JWT_SECRET
node src/app.js      # http://localhost:3001
```

### Variáveis de ambiente do backend

```env
PORT=3001
DATABASE_URL=postgresql://mavenflow:senha@localhost:5432/mavenflow
JWT_SECRET=sua_chave_secreta_longa
CORS_ORIGIN=http://localhost:5173
```

---

## Deploy em Kubernetes

### Pré-requisitos

- Cluster Kubernetes com Traefik como ingress controller
- `kubectl` configurado apontando para o cluster
- Imagens publicadas em um registry acessível ao cluster

### 1. Build e push das imagens

```bash
# Frontend
docker build -t seu-registry/mavenflow-frontend:latest .
docker push seu-registry/mavenflow-frontend:latest

# Backend
docker build -t seu-registry/mavenflow-api:latest ./backend
docker push seu-registry/mavenflow-api:latest
```

### 2. Configurar secrets

Edite os secrets com seus valores reais (base64):

```bash
# Gerar valores base64
echo -n "sua_senha_postgres" | base64
echo -n "sua_chave_jwt_longa_e_aleatoria" | base64
```

Atualize `k8s/postgres/secret.yaml` e `k8s/api/secret.yaml` com os valores gerados.

### 3. Aplicar os manifests

```bash
# Namespace primeiro
kubectl apply -f k8s/namespace.yaml

# PostgreSQL
kubectl apply -f k8s/postgres/

# API
kubectl apply -f k8s/api/

# Frontend
kubectl apply -f k8s/frontend/

# Ingress (Traefik IngressRoute)
kubectl apply -f k8s/ingress.yaml
```

### 4. Verificar deploy

```bash
kubectl -n mavenflow get pods
kubectl -n mavenflow get ingress
kubectl -n mavenflow logs -l app=mavenflow-api
```

### Estrutura dos manifests

```
k8s/
├── namespace.yaml
├── ingress.yaml              # Traefik IngressRoute + Middleware WS
├── postgres/
│   ├── secret.yaml           # POSTGRES_USER, PASSWORD, DB
│   ├── pvc.yaml              # 5Gi ReadWriteOnce
│   ├── deployment.yaml       # Recreate strategy, health checks
│   └── service.yaml          # ClusterIP :5432
├── api/
│   ├── secret.yaml           # DB_PASSWORD, JWT_SECRET
│   ├── configmap.yaml        # DB_HOST, CORS_ORIGIN, PORT
│   ├── deployment.yaml       # 2 réplicas, readiness /api/health
│   └── service.yaml          # ClusterIP :3001
└── frontend/
    ├── deployment.yaml       # 2 réplicas, nginx SPA
    └── service.yaml          # ClusterIP :80
```

---

## Estrutura do projeto

```
mavenflow-k8s/
├── src/                          # Frontend React
│   ├── api/
│   │   ├── client.js             # Fetch base com JWT header
│   │   ├── auth.js               # register, login, logout, getMe
│   │   ├── boards.js             # CRUD boards, columns, cards, labels
│   │   └── notifications.js      # Listar, marcar lida
│   ├── contexts/
│   │   └── AuthContext.jsx       # Estado global de autenticação
│   ├── hooks/
│   │   └── useWebSocket.js       # Conexão WS + auto-reconnect
│   ├── components/
│   │   ├── CardDetailModal.jsx   # Modal completo do card
│   │   ├── Sidebar.jsx           # Navegação lateral
│   │   ├── TopBar.jsx            # Barra superior + notificações
│   │   └── UserProfileModal.jsx  # Edição de perfil
│   ├── views/
│   │   ├── LoginView.jsx         # Tela de login/cadastro
│   │   ├── DashboardView.jsx     # Estatísticas e atividade
│   │   ├── BoardsHomeView.jsx    # Grid de boards
│   │   └── BoardView.jsx         # Kanban/Lista com filtros
│   └── App.jsx                   # Roteamento + estado global
│
├── backend/                      # API Node.js
│   ├── src/
│   │   ├── app.js                # Entry point, Express + WS server
│   │   ├── db/
│   │   │   ├── schema.sql        # Schema PostgreSQL completo
│   │   │   └── index.js          # Pool + getBoardFull()
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT + requireBoardMember/Owner
│   │   ├── routes/
│   │   │   ├── auth.js           # POST /register, /login
│   │   │   ├── users.js          # GET/PUT /me, GET /search
│   │   │   ├── boards.js         # CRUD boards + membros
│   │   │   ├── columns.js        # CRUD colunas
│   │   │   ├── cards.js          # CRUD cards + move + archive
│   │   │   ├── labels.js         # CRUD labels por board
│   │   │   ├── checklists.js     # CRUD checklists + itens
│   │   │   ├── comments.js       # Comentários + notificações
│   │   │   └── notifications.js  # Listar + marcar lida
│   │   └── websocket/
│   │       └── index.js          # Salas por board + push por userId
│   ├── Dockerfile
│   └── .env.example
│
├── k8s/                          # Manifests Kubernetes
├── Dockerfile                    # Frontend multi-stage
├── nginx.conf                    # SPA fallback + gzip + cache
├── docker-compose.yml            # Dev local completo
└── README.md
```

---

## Schema do banco

O schema cobre 13 tabelas com UUID como PK em todas:

`users` · `boards` · `board_members` · `labels` · `columns` · `cards` · `card_labels` · `card_members` · `checklists` · `checklist_items` · `comments` · `activity` · `notifications`

O backend aplica o schema automaticamente na inicialização via `initSchema()`.

---

## Licença

MIT © [João](https://github.com/joaooln)
