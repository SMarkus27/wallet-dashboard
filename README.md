# Wallet Dashboard

Painel web da carteira de investimentos servida pela API [Wallet](../wallet).
Mostra evolução de patrimônio, alocação real contra a ideal, histórico de
proventos e a apuração de IRPF.

O deploy é na Vercel, então o projeto é **Next.js (App Router) com TypeScript**.

## Stack

| Camada | Escolha |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Linguagem | TypeScript em modo estrito |
| Estilo | Tailwind CSS v4 com design tokens em CSS variables |
| Componentes | Primitivos no padrão shadcn/ui sobre Radix UI |
| Gráficos | Recharts |
| Estado de servidor | TanStack Query |
| Tema | `next-themes`, claro/escuro/sistema |

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # aponte WALLET_API_URL para a API
npm run dev
```

A API precisa estar no ar (`uvicorn main:app --reload` no projeto `wallet`), com
o banco migrado.

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe o dashboard em `http://localhost:3000` |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

### Variáveis de ambiente

| Variável | Padrão | Para que serve |
|---|---|---|
| `WALLET_API_URL` | `http://127.0.0.1:8000` | Origem da API do Wallet. **Só é lida no servidor** — nunca chega ao browser |
| `WALLET_ACCESS_TOKEN_COOKIE_NAME` | `access_token` | Nome do cookie de acesso que a API espera |
| `WALLET_REFRESH_TOKEN_COOKIE_NAME` | `refresh_token` | Nome do cookie de refresh que a API espera |

Os dois últimos espelham `ACCESS_TOKEN_COOKIE_NAME` e
`REFRESH_TOKEN_COOKIE_NAME` do `Settings` da API; só precisam ser informados se
lá forem trocados.

## Por que um BFF em vez de chamar a API do browser

A API autentica por **cookie httpOnly**. Com o dashboard na Vercel e a API em
outro domínio, o cookie seria de terceiros: exigiria `SameSite=None`, e ainda
assim quebraria em qualquer browser com bloqueio de cookies cross-site ligado —
que hoje é o padrão em Safari e Firefox.

Por isso o browser fala **apenas com o Next.js**. O Route Handler
`src/app/api/wallet/[...path]/route.ts` encaminha qualquer rota para a API,
anexando os tokens como cookie na requisição de saída. O cookie do dashboard é
first-party, o middleware consegue lê-lo para proteger rotas, e o
`WALLET_API_URL` nunca é exposto.

O proxy também **retira os tokens do corpo da resposta**: o login da API devolve
`access_token` e `refresh_token` em JSON, e eles são convertidos em cookies
httpOnly do dashboard antes de a resposta chegar ao browser. Nenhum token é
acessível por JavaScript.

```
browser ──/api/wallet/**──► Next.js Route Handler ──cookie──► API Wallet
                                     │
                          grava wd_access_token / wd_refresh_token (httpOnly)
```

Server Components não passam pelo proxy: usam `apiGet` (`src/lib/api/server.ts`),
que fala direto com a API a partir do servidor, lendo os mesmos cookies.

## Temas claro e escuro

Os tokens vivem em `src/app/globals.css`, declarados em `:root` e redefinidos em
`.dark`. A troca é feita pelo `next-themes` com a estratégia de classe, e a
opção "Sistema" acompanha o `prefers-color-scheme`.

A paleta de séries dos gráficos (`--chart-1` a `--chart-8`) **não é o mesmo
conjunto de cores clareado para o escuro**: cada modo tem seus próprios passos,
escolhidos para a superfície em que são desenhados. A paleta foi validada nos
dois modos para faixa de luminosidade, piso de croma, separação sob daltonismo
(ΔE ≥ 8 entre pares adjacentes) e contraste contra a superfície.

No modo claro três séries ficam abaixo de 3:1 contra a superfície. Isso é
aceitável porque nenhum gráfico usa cor como único canal: toda série tem rótulo
direto ou legenda, e todo gráfico tem a tabela equivalente na mesma tela.

## Estrutura

```
src/
├── app/
│   ├── api/wallet/[...path]/   # proxy BFF para a API
│   ├── globals.css             # design tokens e tema
│   └── layout.tsx
├── components/
│   ├── theme/                  # provider e alternador de tema
│   └── ui/                     # primitivos (button, card, table, select, ...)
└── lib/
    ├── api/                    # tipos da API, cliente do browser e do servidor
    ├── auth/                   # cookies de sessão
    ├── format.ts               # moeda, percentual e datas em pt-BR
    └── utils.ts
```

## Convenções

- Código em `src/` não leva comentário nem docstring: o porquê de uma decisão
  fica no corpo do commit ou neste README.
- Valores monetários chegam da API como **string** (`Decimal` serializado) e são
  convertidos por `toNumber` antes de qualquer conta — nunca somados como texto.
- Rotas são tipadas (`typedRoutes`), então um link para rota inexistente quebra
  o build em vez de só dar 404 em produção.

## Estado da implementação

| Etapa | Situação |
|---|---|
| Setup, temas, camada de API e BFF | Pronto |
| Tela de login | A fazer |
| Aba Resumo | A fazer |
| Aba Proventos | A fazer |
| Aba Gráficos | A fazer |
| Aba IRPF | A fazer |
