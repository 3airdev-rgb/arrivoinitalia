# Arrivo In Itália

Plataforma de trilhas de aprendizado sobre cidadania, mudança e vida na Itália, com contas próprias de aluno e administrador.

## Funcionalidades

- Administração de trilhas, módulos, videoaulas e eventos.
- Imagens de fundo das trilhas com upload, prévia e substituição.
- Progresso por aluno e trilha, favoritos, histórico, tarefas e anotações privadas.
- Planner por trilha, com etapas, prazos, custos e anexos (PDF ou imagem).
- Fornitore: catálogo de prestadores de serviço e pedidos de agendamento.
- Convites de acesso, recuperação de senha por link e gestão de usuários.
- Dúvidas dos alunos e respostas da administração.

## Desenvolvimento local

Requer Node.js 24. As dependências são instaladas com pnpm (via `corepack pnpm`, se o pnpm não estiver instalado).

```sh
corepack pnpm install
node server/cli.js create-admin voce@exemplo.com "Seu Nome"   # pede a senha; só funciona com o banco vazio
corepack pnpm dev                                             # http://127.0.0.1:4173
corepack pnpm test
```

O banco SQLite fica em `data/arrivo.sqlite` (não versionado). As migrações em `drizzle/` são aplicadas automaticamente ao iniciar.

## Docker

```sh
docker compose up -d --build
docker compose exec arrivo node server/cli.js create-admin voce@exemplo.com "Seu Nome"
```

Abra http://127.0.0.1:4173. Os dados ficam na pasta `data/`, montada no container. Para parar: `docker compose down`.

## Configuração

Variáveis em `.env` (modelo em `.env.example`):

- `PUBLIC_URL`: endereço público em produção (ex.: `https://arrivoinitalia.com`). Vazio no desenvolvimento.
- `TRUST_PROXY=1`: quando estiver atrás de proxy reverso, para usar o IP real do visitante.
- `ARRIVO_DB_PATH`, `PORT`, `HOST`: opcionais; o container já define os valores corretos.

## Estrutura

- `public/`: interface, estilos, logo e favicon.
- `server/app.js`: API, autenticação, permissões e regras de negócio.
- `server/index.js`: servidor HTTP de produção (arquivos estáticos, IP do cliente, limites).
- `server/db.js`: acesso ao SQLite e aplicação das migrações.
- `server/cli.js`: criação da conta administradora e redefinição de senha pelo terminal.
- `server/seed.json`: catálogo inicial (3 trilhas, 24 módulos, 48 aulas em rascunho).
- `db/schema.ts` e `drizzle/`: esquema e migrações (`corepack pnpm db:generate` após mudar o esquema).
- `tests/`: testes de permissões, operação, progresso e servidor HTTP.
- `OPERACAO.md`: orientações de uso e administração.

## Limites atuais

As videoaulas são cadastradas por link YouTube, Vimeo ou MP4 HTTPS. Convites e recuperação de senha exigem compartilhamento manual do link. Ainda não há pagamentos nem envio automático de e-mail. O catálogo inicial contém aulas em rascunho, ainda a gravar.

## Créditos

Foto de Val d’Orcia: Salvatore Gerace, Wikimedia Commons, CC BY 2.0, utilizada com recorte. Fonte: https://commons.wikimedia.org/wiki/File:Landscape_in_Val_d%27Orcia.jpg
