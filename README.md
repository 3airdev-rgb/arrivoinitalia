# Arrivo In Itália

Plataforma de trilhas de aprendizado sobre cidadania, mudança e vida na Itália, com contas próprias de aluno e administrador.

## Funcionalidades

- Administração de trilhas, módulos, videoaulas e eventos.
- Imagens de fundo das trilhas com upload, prévia e substituição.
- Progresso por aluno e trilha, favoritos, histórico, tarefas e anotações privadas.
- Convites de acesso, recuperação de senha por link e gestão de usuários.
- Dúvidas dos alunos e respostas da administração.
- Interface responsiva com a identidade Arrivo In Itália.

## Desenvolvimento local

Requer Node.js 24 e pnpm.

```sh
pnpm install
pnpm build
node tests/seed-preview.mjs
pnpm dev
```

Abra http://127.0.0.1:4173. O script de preparação cria apenas uma conta de teste local. Consulte `tests/seed-preview.mjs` para suas credenciais. O banco local fica em `arrivo.sqlite` e não é versionado.

```sh
pnpm test
```

## Estrutura

- `public/`: interface, estilos, logo e favicon.
- `server/`: autenticação, permissões, API e catálogo inicial.
- `db/` e `drizzle/`: esquema e migrações do banco.
- `scripts/`: construção e ambiente local.
- `tests/`: testes de permissões, operação e progresso.
- `OPERACAO.md`: orientações de uso e publicação.

## Hospedagem atual

A aplicação usa Worker e banco D1 na hospedagem atual. O build gera `dist/server/index.js` e copia as migrações para `dist/.openai/`.

A adaptação para Docker e uma futura VPS Hostinger ainda não foi implementada. Não basta publicar estes arquivos como um site estático para disponibilizar as contas e o banco de dados.

Este repositório contém o código, os recursos visuais e as migrações. Não contém o banco de produção, contas reais, senhas ou variáveis secretas da hospedagem. A configuração de exemplo está em `.env.example`.

## Limites atuais

As videoaulas são cadastradas por link YouTube, Vimeo ou MP4 HTTPS. Convites e recuperação de senha exigem compartilhamento manual do link. Ainda não há pagamentos, envio automático de e-mail ou upload direto de vídeos. O catálogo inicial contém aulas em rascunho, ainda a gravar.

## Créditos

Foto de Val d’Orcia: Salvatore Gerace, Wikimedia Commons, CC BY 2.0, utilizada com recorte. Fonte: https://commons.wikimedia.org/wiki/File:Landscape_in_Val_d%27Orcia.jpg

## Docker Desktop (desenvolvimento local)

O banco SQLite local fica em `arrivo.sqlite`. O Docker Compose executa a aplicação e monta esse arquivo para manter os dados entre reinicializações.

```sh
docker compose up -d --build
```

Abra http://127.0.0.1:4173. Para parar: `docker compose down`. Para criar a conta inicial em um banco novo, execute `docker compose exec arrivo node tests/seed-preview.mjs`.
