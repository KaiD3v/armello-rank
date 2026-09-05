# Armello Rank

Ranking privado para um grupo fixo de jogadores de [Armello](https://armello.com/). Marque vitórias no pergaminho, acompanhe posições em tempo real e abra o quadro com um código compartilhado — sem contas individuais.

## O que faz

- **Acesso por código** — um `ACCESS_CODE` no ambiente destrava a sessão (cookie httpOnly assinado).
- **Quadro dos heróis** — quatro jogadores fixos (Kaique, Pedro, Henrique, Afonso) com botões **+1** / **−1** (pontos nunca abaixo de 0).
- **Ordenação** — pontos decrescentes; empate resolve por nome (`pt-BR`).
- **Tempo real** — alterações de pontuação são propagadas aos navegadores conectados via WebSocket.
- **UI medieval** — pergaminho, selos, trono atual e crônica da partida.

Regras de domínio e contrato de API: [`APP_CONTEXT.md`](APP_CONTEXT.md).

## Stack

| Camada | Tecnologia |
|--------|------------|
| App | Next.js 16 (App Router), React 19, TypeScript |
| Estilo | Tailwind CSS 4 + CSS customizado (Cinzel / Spectral) |
| Dados | Prisma 6 + MongoDB |
| Auth | JWT (`jose`) em cookie `armello_session` com `codeHash` |
| Realtime | Servidor Node customizado (`server.ts`) + `ws` |
| Testes | Jest (unitário) · Playwright (e2e) |

> **Importante:** use sempre `npm run dev` / `npm start` (via `server.ts`). `next dev` / `next start` isolados **não** sobem o WebSocket.

O realtime funciona em **um processo Node** (local, Railway, VPS). Não é adequado para Vercel/serverless multi-instância sem pub/sub compartilhado.

## Estrutura

```
armello-rank/
├── APP_CONTEXT.md          # Regras de negócio e contrato da API
├── server.ts               # HTTP + Next + WebSocket (/api/ws)
├── prisma/
│   ├── schema.prisma       # Model Player
│   └── seed.ts             # Quatro heróis iniciais
├── public/realm/           # Arte (pergaminho, heróis, cenário)
├── src/
│   ├── app/
│   │   ├── page.tsx        # SPA: unlock → ranking
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/            # Route Handlers (auth, players)
│   ├── components/         # Unlock, Ledger, Ranking, Trono, Crônica
│   ├── hooks/              # useRankingRealtime
│   └── lib/                # auth, ranking, prisma, realtime hub
├── e2e/                    # Playwright
└── .cursor/skills/         # Skills de agente (backend/frontend/QA)
```

### Fluxo resumido

1. `POST /api/auth/unlock` com o código → cookie de sessão.
2. `GET /api/players` → lista ranqueada.
3. `POST /api/players/[id]/points` com `{ delta: 1 | -1 }` → atualiza Mongo e publica no hub WS.
4. Clientes autenticados em `WS /api/ws` recebem o snapshot (e o `change` opcional para a crônica).

## Instalação

### Pré-requisitos

- Node.js 20+ (recomendado)
- Conta MongoDB (Atlas ou local) com database **`armello-rank`** na URI

### Passos

```bash
# 1. Dependências
npm install

# 2. Ambiente
cp .env.example .env
```

Edite `.env`:

```env
MONGODB_URI="mongodb+srv://USER:PASSWORD@cluster.mongodb.net/armello-rank?retryWrites=true&w=majority"
ACCESS_CODE="seu-codigo-compartilhado"
ACCESS_SECRET="segredo-longo-e-aleatorio"
PORT="3000"
```

```bash
# 3. Schema + seed dos 4 jogadores
npm run db:setup

# 4. Desenvolvimento (Next + WebSocket)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e entre com o `ACCESS_CODE`.

### Produção

```bash
npm run build
npm start
```

`npm start` executa `tsx server.ts --prod` na porta `PORT` (padrão `3000`).

## Scripts úteis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento com WS |
| `npm run build` | `prisma generate` + build Next |
| `npm start` | Servidor de produção com WS |
| `npm run db:push` | Aplica schema no Mongo |
| `npm run db:seed` | Recria/atualiza os 4 jogadores |
| `npm run db:setup` | push + seed |
| `npm test` | Jest |
| `npm run test:e2e` | Playwright (sobe `server.ts` automaticamente) |
| `npm run lint` | ESLint |

Para e2e, se necessário:

```bash
npx playwright install chromium
```

## Segurança (resumo)

- Não há login por usuário: só o código compartilhado.
- Trocar `ACCESS_CODE` invalida todas as sessões existentes.
- Nunca committe `.env`; use `.env.example` como modelo.
- Em produção o cookie usa `secure` quando `NODE_ENV=production`.

## Produção (Vercel + MongoDB Atlas)

O erro `ReplicaSetNoPrimary` / `received fatal alert: InternalError` em `prisma.player.findMany()` significa que **a função serverless da Vercel não consegue falar com o Atlas** (quase sempre rede/IP, não bug de ranking).

### Checklist no Atlas

1. **Network Access** → *Add IP Address* → permita **`0.0.0.0/0`** (Allow access from anywhere). A Vercel usa IPs dinâmicos.
2. Confirme que o cluster **não está pausado** (Free tier pausa após inatividade).
3. URI com o database **`armello-rank`**:
   `mongodb+srv://USER:PASSWORD@cluster...mongodb.net/armello-rank?retryWrites=true&w=majority`
4. Se a senha tiver caracteres especiais (`@`, `#`, `/`, etc.), use [URL-encoding](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding).

### Checklist na Vercel

Defina em *Project → Settings → Environment Variables* (Production):

- `MONGODB_URI`
- `ACCESS_CODE`
- `ACCESS_SECRET`

Depois faça **Redeploy**. Localmente rode `npm run db:setup` pelo menos uma vez contra o mesmo cluster para criar/seedar os jogadores.

### Limite importante

Nesta arquitetura o **WebSocket (`server.ts`) não roda na Vercel**. Unlock + ranking HTTP podem funcionar; sync em tempo real entre abas exige host Node contínuo (Railway/VPS) com `npm start`.

## Licença

Projeto privado / uso interno do clã.
