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
| `WALLET_API_URL` | `http://127.0.0.1:8000` **só em desenvolvimento** | Origem da API do Wallet. **Só é lida no servidor** — nunca chega ao browser |
| `WALLET_API_PREFIX` | `/api/v1` | Prefixo de versão da API. Trocar a versão não exige mexer no código |
| `WALLET_ACCESS_TOKEN_COOKIE_NAME` | `access_token` | Nome do cookie de acesso que a API espera |
| `WALLET_REFRESH_TOKEN_COOKIE_NAME` | `refresh_token` | Nome do cookie de refresh que a API espera |

Os dois últimos espelham `ACCESS_TOKEN_COOKIE_NAME` e
`REFRESH_TOKEN_COOKIE_NAME` do `Settings` da API; só precisam ser informados se
lá forem trocados.

`WALLET_API_URL` **não tem padrão em produção**: sem a variável, a primeira
requisição estoura com um erro que diz o nome dela. Um padrão de `localhost` em
produção falharia calado — o deploy subiria, a tela mostraria erro de rede e a
causa (variável esquecida) só apareceria depois de investigar. O padrão continua
valendo em desenvolvimento, onde a API é sempre local. A checagem é feita na
requisição, não na carga do módulo, para o `npm run build` não depender do
ambiente de execução.

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

### Recuperação de senha

```
/forgot-password                 pede o link por e-mail
/reset-password/<token>          define a nova senha e já entra
```

**A rota do reset não é escolha do dashboard.** O e-mail é montado pela API com
`{frontend_origin}/reset-password/{token}`, então esse caminho é contrato: mudá-lo
quebra todo link já enviado.

O token é conferido **no servidor**, antes de a página renderizar. Um link vencido
mostra de cara que expirou, em vez de deixar o usuário digitar uma senha nova para
só então descobrir que não valia.

A tela de pedido responde a mesma coisa para e-mail cadastrado e não cadastrado,
porque a API também responde: `SendRecoveryPasswordEmailService` retorna em
silêncio quando o usuário não existe ou está inativo. Mostrar "e-mail não
encontrado" entregaria quais endereços têm conta.

Redefinir a senha **cria a sessão**, e uma conta com segundo fator recebe o
desafio na resposta do reset. Por isso a etapa do código foi extraída para um
componente que login e reset compartilham: sem ela, o reset redirecionaria para o
painel sem sessão nenhuma.

As regras de senha aparecem como dica na tela, mas quem valida é a API — as
mensagens dela já vêm em português e são exibidas como estão, sem o prefixo
`Value error,` que o Pydantic acrescenta. A conferência de senhas iguais é feita
antes de enviar, porque não precisa de rede para saber a resposta.

### Proteção de rotas

`src/proxy.ts` — no Next 16 o arquivo `middleware.ts` foi renomeado para
`proxy.ts`, e o nome não tem relação com o proxy BFF — redireciona quem não tem
cookie de sessão para `/login`, guardando o destino em `?next=`. Quem já tem
sessão e abre `/login` vai para `/resumo`.

O valor de `next` é validado contra a lista de rotas do painel antes de virar
destino (`resolveRedirect`). Um `next` apontando para fora vira `/resumo`, para
que a tela de login não possa ser usada como trampolim para outro domínio.

### Cookie presente não é sessão válida

O `proxy.ts` só sabe se o cookie **existe**; quem sabe se ele **vale** é a API.
Quando ela recusa, `apiGet` manda para `/login?expired=1`, e é o parâmetro que
quebra o ciclo: sem ele, o proxy veria o cookie, devolveria para o painel, o
painel seria recusado de novo e o browser ficaria rebatendo entre as duas
rotas — uma tela em branco com só a barra de navegação.

Ao atender essa volta, o proxy **apaga os cookies de sessão**, para a próxima
visita começar limpa em vez de repetir o desencontro. O login exibe o motivo,
porque cair numa tela de entrada sem explicação parece defeito.

Isso acontece sempre que o cookie sobrevive ao que o autenticava: segredo JWT
trocado, banco recriado, família de refresh revogada em outro dispositivo.

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

A paleta de séries dos gráficos (`--chart-1` a `--chart-11`) **não é o mesmo
conjunto de cores clareado para o escuro**: cada modo tem seus próprios passos,
escolhidos para a superfície em que são desenhados. A paleta foi validada nos
dois modos para faixa de luminosidade, piso de croma, separação sob daltonismo
(ΔE ≥ 8 entre pares adjacentes) e contraste contra a superfície.

Os oito primeiros matizes são os originais, na mesma ordem — trocar a ordem
repintaria todo gráfico já existente, e cor deve seguir a entidade, não a
posição dela na lista. Ciano, oliva e magenta foram anexados como 9, 10 e 11
nessa ordem porque é a única que passa a checagem de daltonismo: ciano encostado
em magenta ou em roxo colapsa sob deuteranopia (ΔE 3,9), e roxo teve de ficar
fora — onze é o teto que a validação aceita, não uma escolha estética.

### Além de onze séries, o matiz repete com outro passo

Uma carteira de trinta ativos precisa de trinta cores distintas, e trinta
matizes distinguíveis não existem. Então `seriesColor` combina dois canais: o
matiz cicla de onze em onze e o **passo** muda a cada volta — o segundo passo
mistura 74% do matiz com `--foreground`, o terceiro com `--background`, via
`color-mix(in oklab, …)`.

Como `--foreground` é quase preto no claro e branco no escuro, o segundo passo
sempre anda **para longe da superfície** (escurece no claro, clareia no escuro) e
o terceiro para o lado oposto. São 11 × 3 = 33 combinações, nenhuma igual à
outra, e dois ativos do mesmo matiz ficam sempre onze posições distantes na
ordem por tamanho.

Isso é encoding composto, não paleta categórica: acima de onze fatias o matiz
deixa de identificar sozinho, e quem carrega a identidade exata é a tabela ao
lado, sincronizada com o desenho no hover e no clique. Se algum dia a pergunta
virar "comparar trinta ativos entre si" em vez de "ver a composição", a forma
certa deixa de ser rosca e passa a ser barra — trinta barras se leem, trinta
arcos não.

No modo claro três séries ficam abaixo de 3:1 contra a superfície. Isso é
aceitável porque nenhum gráfico usa cor como único canal: toda série tem rótulo
direto ou legenda, e todo gráfico tem a tabela equivalente na mesma tela.

## Gráficos interativos

Nenhum gráfico é só desenho: em todos, a legenda é controle e o gesto do mouse
muda o que está em foco. As regras são as mesmas nas três formas, para o leitor
não precisar reaprender a tela em cada aba.

### A legenda é um botão

Clicar em uma série a esconde (`hide` do Recharts, com o eixo recalculando o
domínio); passar o mouse esmaece as outras. É a forma mais direta de responder
"quanto disso é JCP?" ou "como fica a linha de patrimônio sem a área de valor
aplicado?" sem outro filtro na tela.

A última série visível não pode ser desligada — um gráfico vazio não é um
estado útil, é um beco sem saída de onde o leitor só sai tentando clicar de
novo. O estado vive em `useChartLegend`, compartilhado pelos dois gráficos
cartesianos.

### Séries longas ganham faixa de recorte

Acima de oito pontos (patrimônio) ou quatorze (proventos) entra um `Brush`: com
trinta meses em tela as barras ficam finas demais para comparar duas vizinhas.
O recorte é visual e local ao gráfico — diferente do filtro de `period` da aba
Gráficos, que refaz a busca no servidor e muda a série inteira.

### A rosca não tem tooltip

Ela tem leitor no centro. O tooltip do Recharts nasce sob o ponteiro, e o
ponteiro está sobre a rosca: a caixa cobria exatamente o buraco do meio, onde o
valor da fatia é mostrado. Então a fatia sob o mouse cresce, as outras esmaecem,
e o centro passa a exibir rótulo, percentual e saldo daquela fatia. Nada se
perde: "Classe" e "Meta", que o tooltip mostrava, são duas colunas da tabela ao
lado.

Passar o mouse em uma linha da tabela destaca a fatia correspondente, e clicar
**fixa** o destaque — útil para olhar a rosca e a tabela sem manter o mouse
parado. O clique é num botão dentro da linha, não na linha inteira:
`role="button"` no `<tr>` trocaria o papel da linha na tabela, e é justamente a
tabela que garante a leitura sem cor.

### O arco é desenhado pelo saldo, não pelo percentual

A API arredonda percentual em duas casas (`PERCENTAGE_PRECISION = 0.01`). Com a
rosca desenhada por `dataKey="percentage"`, qualquer fatia abaixo de 0,005%
virava `0,00%` e saía com **ângulo zero** — invisível no desenho, mas com saldo
na tabela ao lado. Uma posição de R$ 20 numa classe de R$ 480 mil desaparecia
exatamente assim.

Agora o `dataKey` é `value`: o ângulo é o dinheiro, e o percentual continua
sendo só o que se **lê**. Os dois coincidem quando o arredondamento não morde, e
quando morde é o desenho que está certo.

### A cauda dobrada é um grupo, não uma fila de cores iguais

A primeira versão dava a cor do arco "Outros" para cada linha dobrada. Numa
carteira de doze ativos isso virava sete quadradinhos verdes idênticos empilhados
na tabela — a coluna de cor deixava de identificar qualquer coisa e parecia erro
de renderização.

Agora a cor mora só onde existe arco: a tabela ganha uma linha "Outros (N)" com o
quadrado verde e os valores somados, e as dobradas entram **abaixo dela**,
recuadas e com um traço em vez de cor. Passar o mouse ou clicar em qualquer uma
delas destaca o arco de "Outros" inteiro, que é onde elas estão desenhadas.

### Clicar numa barra de proventos filtra a tabela

A pergunta que segue o gráfico é sempre "de onde veio esse mês?". O clique na
coluna recorta o histórico abaixo (`startsWith` na referência, o que serve tanto
para `2025-03` quanto para `2025` no agrupamento por ano), as outras barras
esmaecem e um botão com o nome do período desfaz o recorte. Trocar a
granularidade limpa a seleção, e uma seleção que sai do recorte atual é
descartada sozinha — não existe estado filtrando a tabela sem barra acesa
correspondente.

### Animação é opt-out do sistema

As entradas e o crescimento da fatia usam o padrão `isAnimationActive: "auto"`
do Recharts 3: em quem tem `prefers-reduced-motion: reduce`, nada anima. O foco
por mouse dentro do gráfico não desenha anel (`:focus:not(:focus-visible)` em
`globals.css`) — o Recharts move o foco para camadas internas ao clicar, e o
anel aparecia em volta da barra clicada como se fosse artefato. Pelo teclado o
anel continua.

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
│   ├── auth/                   # login, segundo fator e recuperação de senha
│   ├── charts/                 # gráficos e tokens de série
│   ├── earnings/               # filtros e tabela de proventos
│   ├── filters/                # linha de seletores reaproveitada
│   ├── graficos/               # cartões da aba Gráficos
│   ├── irpf/                   # apuração, detalhe do mês e ação da DARF
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
percentual real, ideal e saldo. **Todo ativo é desenhado**: a rosca tem 33 cores
distintas (11 matizes × 3 passos), e só acima disso a cauda vira "Outros (n)" —
agrupada na tabela, nunca omitida.

O componente (`ShareDonut`) é o mesmo que a aba Gráficos usa para setores e
ativos: a pergunta é a mesma, composição percentual, e duas formas diferentes
para a mesma pergunta só custariam ao leitor. Rosca e tabela são sincronizadas
nos dois sentidos — ver [Gráficos interativos](#gráficos-interativos).

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

Clicar numa coluna recorta a tabela de histórico naquele período — ver
[Gráficos interativos](#gráficos-interativos).

## Aba Gráficos

Quatro leituras, com filtros que vivem em camadas diferentes porque as fontes de
dados são diferentes.

### O gráfico de patrimônio filtra no servidor

`period` e `asset_type` mudam a **série inteira**: cada ponto é a carteira
reconstruída naquele mês, e recortar por classe muda até onde a série começa.
Nada disso dá para derivar no cliente a partir da série cheia, então os dois
filtros viram `queryKey` do TanStack Query e refazem a busca. A série que o
servidor já renderizou entra como `initialData`, para o primeiro desenho não
piscar.

É o oposto da aba Proventos, onde tudo é filtrado na memória: lá os pagamentos
já vieram todos e filtrar é escolher quais mostrar.

### Setores e ativos dividem um filtro só

Os dois saem do mesmo `/portfolio/allocation`, que traz a carteira inteira, então
o recorte por classe é feito no cliente e o mesmo estado alimenta os dois
gráficos — como pedido.

A tela **abre na classe com a maior posição**, não em "Todas as classes". Sem
recorte, os cinco maiores papéis da carteira ficam com todos os arcos e o resto
cai em "Outros": quem tem FII menor que as ações não vê nenhum FII desenhado, só
listado. Já recortado por classe, o denominador é a própria classe e cada papel
dela ganha seu arco. "Todas as classes" continua a um clique, para a visão da
carteira inteira.

O denominador acompanha o recorte: sem filtro, o percentual é **sobre a
carteira** (`wallet_real_percentage`); com uma classe escolhida, é **sobre a
classe** (`real_percentage`), e os valores passam a somar 100%. O subtítulo de
cada gráfico diz qual das duas leituras está na tela, senão 47% de Logística
seria confundido com 47% do patrimônio.

### Setor repetido leva o nome da classe

`OUTROS` existe em mais de uma classe, e `wallet_sectors` é único por
`(carteira, classe, setor)` justamente por isso. Sem desambiguar, o gráfico
mostrava duas barras "Outros" sem como saber qual era qual — agora só as
etiquetas repetidas ganham o sufixo da classe, e as únicas seguem limpas.

### Rosca, com a tabela ao lado

São percentuais de uma composição, então a forma é a rosca — a mesma do Resumo, e
por isso o componente é um só.

A rosca sozinha não daria conta: acima de onze fatias o matiz deixa de
identificar, e uma carteira com trinta ativos é confete por definição. Quem
resolve é o par: **a rosca desenha todas as fatias e a tabela ao lado lista
todas**, com percentual real, meta e saldo, as duas sincronizadas no hover e no
clique. Acima de trinta e três fatias — o teto da paleta — a cauda vira
"Outros (n)", com as dobradas agrupadas sob essa linha.

Acima de doze fatias a rosca cresce e afina: o vão entre arcos cai de 2° para
0,5° e o anel ganha largura, senão o próprio vão comeria as fatias pequenas.

## Aba IRPF

A lista de períodos vem inteira de `/taxes/periods` — são poucos registros, um
por mês e classe — e os filtros de ano e classe são resolvidos na memória. O
detalhe de um mês (`/taxes/periods/{ano}/{mes}`) só é buscado quando a linha é
aberta.

### O mês é a linha; a classe é o detalhe

A API grava um período por **classe**, mas a DARF é do **mês**: o código 6015
consolida ações e FIIs. Por isso a tabela lista meses, somando as classes, e a
apuração por classe aparece ao abrir a linha — junto das operações que a
formaram e do prejuízo que sobra para compensar depois.

O prejuízo não consolida: ele é compensado dentro da própria classe, e é por isso
que o saldo a compensar aparece separado por classe no detalhe.

### A situação é por classe, o total pendente também

Marcar como paga é uma ação por classe, então um mês pode ter a DARF de ações
quitada e a de FII em aberto. O indicador de pendente soma **só as classes em
aberto** — somar o mês inteiro faria o total parar de cair ao quitar a primeira,
e o número deixaria de responder "quanto ainda devo".

### Três jeitos de a DARF ser zero

| Situação exibida | O que aconteceu |
|---|---|
| Isento | Vendas de ações abaixo do limite mensal de R$ 20.000 |
| Sem imposto | Não houve resultado a tributar no mês |
| Não recolhida | Há imposto, mas a DARF ficou abaixo de R$ 10 |

As três zeram a coluna da DARF e dizem coisas diferentes, então a linha mostra
qual delas é. A de menos de R$ 10 ainda exibe o valor apurado, com a nota de que
não é recolhida — some-o à DARF de um mês seguinte, é o que a Receita espera.

### O recálculo ficou de fora

`POST /taxes/periods/{ano}/{mes}/recalculate` reapura o mês **e todos os
seguintes**, porque a compensação de prejuízo encadeia os períodos. É uma ação
destrutiva o suficiente para não morar atrás de um botão de tabela sem uma
confirmação pensada.

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
| Recuperação de senha | Pronto |
| Aba Resumo | Pronto |
| Aba Proventos | Pronto |
| Aba Gráficos | Pronto |
| Aba IRPF | Pronto |

Os proventos futuros dependem do catálogo `announced_earnings`, alimentado pelas
rotas internas da API — a aba mostra a coluna vazia enquanto ele estiver vazio.
