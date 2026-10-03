# Arrivo In Itália — perfis e administração

## Primeiro acesso

A conta proprietária é criada pelo terminal do servidor, nunca pela web:

```sh
docker compose exec arrivo node server/cli.js create-admin voce@exemplo.com "Seu Nome"
```

A senha é pedida no terminal. O comando só funciona com o banco vazio e importa o catálogo inicial: 3 trilhas, 24 módulos e 48 aulas planejadas, que começam como rascunhos sem vídeo. Depois, entre no site e use Administração.

Se perder a senha da conta proprietária:

```sh
docker compose exec arrivo node server/cli.js reset-password voce@exemplo.com
```

## Acesso dos alunos

O curso libera a plataforma até uma data de validade (normalmente 1 ano). Meu Planner e Fornitore são adicionais que vencem junto com o curso. Sem o curso ativo, o aluno consegue entrar, mas só vê o próprio perfil e um aviso de acesso inativo; o progresso e as anotações continuam guardados. Sem um adicional, a página correspondente mostra o aviso de adicional, e o servidor recusa as operações dele.

- No convite de aluno, marque "Liberar acesso ao curso na ativação", escolha a validade e os adicionais.
- Em Alunos e acessos → Gerenciar, ajuste a validade, inclua ou retire adicionais, ou remova o acesso. Cada mudança fica no histórico do aluno e no registro de ações.
- Os dados de contato dos prestadores (e-mail e telefone) aparecem apenas para a administração.

## Vendas

- A página de vendas fica na raiz do site (`/`); a plataforma fica em `/app`. Termos de uso e privacidade estão em `/termos` e `/privacidade`.
- Em Administração → Página de vendas, edite textos, imagens, perguntas frequentes, seções exibidas, contato e os textos de Termos e Privacidade (inclusive razão social e CNPJ). As alterações ficam em rascunho: use "Salvar e ver prévia" e depois "Publicar". As últimas 10 versões publicadas podem ser restauradas.
- Status da página: "Publicada" ou "Em manutenção". Em manutenção, visitantes veem a página de manutenção (editável no mesmo painel) e todas as compras ficam suspensas, inclusive renovações e adicionais; alunos continuam estudando e administradores veem a página real com um aviso no topo.
- Em Administração → Vendas, defina os preços do curso e dos adicionais, o desconto de renovação e por quantos dias após o vencimento ele vale. A renovação abre 60 dias antes do vencimento; o novo ano começa quando o atual termina. Os adicionais não renovam sozinhos.
- O pagamento é feito no Stripe (cartão, Pix ou boleto, conforme ativado no painel do Stripe). Quando o pagamento é confirmado, a conta é criada e o comprador recebe, na página de retorno, o link para criar a senha. Enquanto o envio de e-mail não estiver pronto, o administrador pode gerar esse link em Vendas → "Link de acesso".
- Reembolso total feito no Stripe encerra automaticamente o acesso daquele pedido.
- Configuração: `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` no `.env`; no Stripe, cadastre o webhook `https://arrivoinitalia.com/api/stripe/webhook` com os eventos listados em `.env.example`.

## Grade das trilhas (arquivos de catálogo)

A grade de cada trilha (etapas, módulos e aulas com título, descrição e duração) fica em `server/catalog/<trilha>.json`. Uma instalação nova já nasce com esse conteúdo. Para aplicar uma grade nova ou corrigida num banco existente:

```sh
docker compose exec arrivo node server/cli.js import-track server/catalog/cidadania.json
```

Reimportar atualiza títulos, descrições, durações, ordem e o módulo de cada aula, sem perder vídeo, materiais, links, status de publicação e o progresso dos alunos. Módulos e aulas que saíram do arquivo são **arquivados**, nunca apagados (voltando ao arquivo, retornam como rascunho com o que tinham). Aulas que pertencem ao arquivo de outra trilha não são tocadas. A categoria escolhida no painel é preservada; para aplicar as categorias do arquivo numa reorganização planejada, use `--sync-categories`. Atenção: mover uma aula para outro módulo pelo painel é desfeito na próxima reimportação — mudanças de estrutura devem ser feitas no arquivo da trilha. `node server/cli.js clear-modules --confirm` apaga todos os módulos e aulas (use com cuidado; faça backup de `data/` antes).

## Operação

- Cadastre módulos e aulas; os vídeos aceitam YouTube, Vimeo ou MP4 HTTPS. Publique quando estiverem prontos.
- Categorias (Administração → Categorias) são as seções da página inicial do aluno. A sequência das seções é definida na lista com os botões ↑ ↓; cada categoria pode ser ocultada da página inicial. Todo módulo pertence a uma categoria, e a “Ordem de exibição” do módulo define a posição do cartão dentro da seção. A ordem dentro das trilhas continua vindo das etapas da trilha.
- O cartão do módulo pode mostrar um símbolo ou uma imagem (ajustada automaticamente no envio).
- Na aula, anexe materiais (PDF, imagens, Office/LibreOffice, TXT, CSV, ZIP, MP3; até 25 MB cada, 15 por aula), cadastre links para consulta e vincule tarefas do Meu Planner. Tudo aparece abaixo do vídeo; o botão “Acesse sua tarefa aqui” só aparece para quem tem o adicional Meu Planner. Os arquivos ficam em `data/files/` (faça backup da pasta `data/` inteira).
- Monte trilhas com etapas e módulos ordenados. Arquive registros para retirá-los da área dos alunos.
- Cadastre eventos com início, término e link; cada aluno vê o horário no próprio fuso.
- Convide alunos e outros administradores, suspenda acessos e gere links de recuperação de senha.
- Responda dúvidas e acompanhe o registro de alterações administrativas.
- Alunos têm perfil, senha, progresso, notas privadas, favoritos e histórico sincronizados na conta.

## Desenvolvimento

Execute `corepack pnpm install` e `corepack pnpm test`. Gere migrações com `corepack pnpm db:generate` somente após mudar `db/schema.ts`. Não altere migrações já aplicadas.

## Segurança e limites

Senhas com bcrypt custo 12, mínimo de 12 caracteres e máximo de 72 bytes. Tokens de sessão e convite aleatórios armazenados como SHA-256; cookies Secure/HttpOnly/SameSite=Strict; expiração de 24 horas; validação de origem nas escritas; limites de tentativas no banco; saída HTML escapada; controle de revisão para edições concorrentes. Autorizações são verificadas no servidor e dados pessoais são filtrados por usuário autenticado. O container roda sem privilégios de administrador e o corpo das requisições é limitado a 4 MB.

Convites e recuperação geram links para entrega manual pelo administrador. Ainda não há envio automático de e-mail nem pagamentos.

O teste integrado verifica criação única da conta proprietária, acesso sem sessão, bloqueio de aluno em operações administrativas, origem indevida, convite de uso único, filtragem de rascunhos, validação de vídeo/agenda, conflitos de revisão, isolamento de notas, dúvidas, suspensão, recuperação, logout e o servidor HTTP. Isso não substitui uma auditoria independente de segurança.

Referências: https://github.com/dcodeIO/bcrypt.js e https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
