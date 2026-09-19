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

## Autenticação

O login tem duas etapas, porque a API pode exigir segundo fator:

```
POST /investor/auth/signin
  ├─ 202 { mfa_signin_token }  -> pede o código do autenticador
  │     └─ POST /investor/auth/signin/mfa  -> sessão criada
  └─ 200                        -> sessão criada direto
```

Em nenhum dos dois caminhos o token chega ao browser. O proxy reconhece a
resposta que carrega `access_token` e `refresh_token`, converte os dois em
cookies httpOnly do próprio dashboard e **troca o corpo** por
`{ "authenticated": true }` antes de responder. É por isso que o formulário de
login não guarda nada: ele só olha o status e o `mfa_signin_token`.

### Proteção de rotas

`src/proxy.ts` — no Next 16 o arquivo `middleware.ts` foi renomeado para
`proxy.ts`, e o nome não tem relação com o proxy BFF — redireciona quem não tem
cookie de sessão para `/login`, guardando o destino em `?next=`. Quem já tem
sessão e abre `/login` vai para `/resumo`.

O valor de `next` é validado contra a lista de rotas do painel antes de virar
destino (`resolveRedirect`). Um `next` apontando para fora vira `/resumo`, para
que a tela de login não possa ser usada como trampolim para outro domínio.

O arquivo de rotas (`src/lib/routes.ts`) é a fonte única das abas: alimenta a
navegação, o destino padrão e essa validação de redirecionamento.

### Mensagens de erro

A API responde em inglês e distingue os casos pelo status. A tradução fica em
`src/lib/auth/messages.ts`, num só lugar:

| Situação | Status da API | Mensagem exibida |
|---|---|---|
| E-mail ou senha errados | 401 | E-mail ou senha incorretos |
| Conta desativada | 403 | Conta desativada, fale com o suporte |
| E-mail mal formado | 422 | Informe um e-mail válido |
| Código do autenticador errado | 400 | Código inválido |
| Confirmação expirada | 400 | A confirmação expirou, entre novamente |

Os dois últimos compartilham o status 400 e só se distinguem pelo texto que a
API devolve, então `challengeExpired` procura por `login token` na mensagem.
Quando é a confirmação que expirou, o formulário volta para a etapa de senha —
o `mfa_signin_token` vale cinco minutos e não adianta insistir no código.

---

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
├── proxy.ts                    # proteção de rotas (era middleware.ts)
├── app/
│   ├── (auth)/login/           # tela de login e segundo fator
│   ├── (dashboard)/            # layout do painel e as quatro abas
│   ├── api/wallet/[...path]/   # proxy BFF para a API
│   ├── globals.css             # design tokens e tema
│   └── layout.tsx
├── components/
│   ├── auth/                   # formulário de login
│   ├── charts/                 # gráficos e tokens de série
│   ├── earnings/               # filtros e tabela de proventos
│   ├── summary/                # blocos da aba Resumo
│   ├── layout/                 # cabeçalho, navegação e sair
│   ├── theme/                  # provider e alternador de tema
│   └── ui/                     # primitivos (button, card, table, select, ...)
└── lib/
    ├── api/                    # tipos da API, cliente do browser e do servidor
    ├── auth/                   # cookies de sessão e mensagens de erro
    ├── format.ts               # moeda, percentual e datas em pt-BR
    ├── portfolio/              # agrupamento da carteira e dos proventos
    ├── routes.ts               # abas do painel
    └── utils.ts
```

## Aba Resumo

Uma requisição por pergunta, disparadas em paralelo num Server Component:
`/portfolio/overview` para os números de topo, `/portfolio/allocation` para a
composição e as tabelas, `/portfolio/equity/history` para a série mensal.

### O gráfico mostra duas linhas, não uma pilha

O ganho de capital é a **distância entre patrimônio e valor aplicado**, e não uma
faixa empilhada. Empilhar só funcionaria enquanto o ganho fosse positivo: num mês
de prejuízo a faixa desceria abaixo do eixo e a pilha deixaria de somar o
patrimônio. Com duas linhas, o prejuízo aparece como a linha do patrimônio
cruzando para baixo da área do aplicado — que é exatamente o que se quer ver.

### De onde sai cada coluna da tabela

Todas vêm de `/portfolio/allocation`, **menos a "% ideal"**. A API guarda meta por
classe (`wallet_asset_class`) e por setor dentro da classe (`wallet_sectors`), e
não tem meta por ticker — é por isso que o próprio `/portfolio/rebalance` divide a
fatia do setor proporcionalmente ao valor de cada papel.

Então a coluna mostra a meta do **setor** daquele ativo, já convertida em fatia da
carteira (`wallet_ideal_percentage`), e o cabeçalho diz "do setor". Dois ativos do
mesmo setor mostram a mesma meta, e isso é o correto: é o alvo que existe.

### A rosca sempre vem acompanhada da tabela

Três cores do modo claro ficam abaixo de 3:1 contra a superfície, então a rosca
nunca carrega a informação sozinha: a tabela ao lado repete cada fatia com
percentual real, ideal e saldo. Acima de seis classes a cauda vira "Outros" —
passar disso põe na tela cores que ninguém distingue.

### Nomes de classe

`/portfolio/allocation` devolve `asset_type` como **nome** do enum (`STOCKS`),
enquanto o parâmetro de query e o `asset_type` de `/portfolio/equity/history`
usam o **valor** (`AÇÃO`). A tradução entre os dois, e para o rótulo exibido
("Ações"), fica em `ASSET_TYPES` (`src/lib/api/types.ts`) — um lugar só, para a
inconsistência não vazar pelos componentes.

---

## Aba Proventos

Duas requisições em paralelo: `/portfolio/earnings` traz o que já foi pago e
`/portfolio/earnings/scheduled` o que está anunciado. A tela junta as duas listas
numa só e filtra **no cliente** — os dados de uma carteira cabem de sobra na
memória, e filtrar sem ida ao servidor deixa o ajuste instantâneo.

### O que cada filtro alcança

| Filtro | Tabela | Gráfico |
|---|---|---|
| Ticker | sim | sim |
| Tipo de ativo | sim | sim |
| Situação (recebidos / futuros / ambos) | sim | **não** |

Ticker e tipo de ativo são recortes da carteira e valem para tudo que está na
tela. A situação não alcança o gráfico porque ele é, por definição, de proventos
**recebidos**: filtrar por "futuros" o deixaria vazio, o que seria um resultado
sem sentido em vez de um filtro. O texto do cartão de filtros diz isso, e o
título do gráfico repete.

### Por que a tabela agrupa por mês num cabeçalho só

O pedido é um histórico **mensal**, então o mês precisa aparecer como grupo, não
como coluna repetida em cada linha. A primeira versão repetia o cabeçalho da
tabela a cada mês — com trinta meses em tela, trinta faixas de "Data · Ticker ·
Tipo…". Agora o cabeçalho é único e o mês entra como uma linha que atravessa as
colunas, carregando o total do período.

### O gráfico agrupa por mês ou por ano

Dividendos e JCP empilhados, no valor líquido. As duas séries somam o total do
período, então empilhar é honesto — diferente do gráfico de patrimônio, onde o
ganho pode ser negativo e a pilha deixaria de fechar.

O alternador troca a granularidade em vez de recortar um intervalo: com anos, a
mesma série responde "quanto entrou por ano" sem precisar de outro endpoint.

## Convenções

- Código em `src/` não leva comentário nem docstring: o porquê de uma decisão
  fica no corpo do commit ou neste README.
- Valores monetários chegam da API como **string** (`Decimal` serializado) e são
  convertidos por `toNumber` antes de qualquer conta — nunca somados como texto.
- Rotas são tipadas (`typedRoutes`), então um link para rota inexistente quebra
  o build em vez de só dar 404 em produção.
- `agentRules: false` no `next.config.ts`: o Next 16 escreve um `AGENTS.md` e um
  `CLAUDE.md` na raiz ao subir o dev server, e as convenções deste repositório
  já moram no `CLAUDE.local.md`.

## Estado da implementação

| Etapa | Situação |
|---|---|
| Setup, temas, camada de API e BFF | Pronto |
| Tela de login, segundo fator e proteção de rotas | Pronto |
| Aba Resumo | Pronto |
| Aba Proventos | Pronto |
| Aba Gráficos | A fazer |
| Aba IRPF | A fazer |

A recuperação de senha (`/auth/recovery/*`) existe na API e ainda não tem tela.
Os proventos futuros dependem do catálogo `announced_earnings`, alimentado pelas
rotas internas da API — a aba mostra a coluna vazia enquanto ele estiver vazio.
