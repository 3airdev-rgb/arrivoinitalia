# Partiu Itália — perfis e administração

Esta versão substitui a prévia estática descrita originalmente no README. Possui contas próprias e persistência no D1.

## Primeiro acesso

Abra o site privado usando a conta proprietária. A tela oferece configuração inicial de nome e senha. Depois, use Administração. Os 24 módulos e as 3 trilhas são importados; as 48 aulas planejadas começam como rascunhos sem vídeo. Nenhuma senha real foi definida pelo agente.

## Operação

- Cadastre módulos e aulas; os vídeos aceitam YouTube, Vimeo ou MP4 HTTPS. Publique quando estiverem prontos.
- Monte trilhas com etapas e módulos ordenados. Arquive registros para retirá-los da área dos alunos.
- Cadastre eventos com início, término e link; cada aluno vê o horário no próprio fuso.
- Convide alunos e outros administradores, suspenda acessos e gere links de recuperação de senha.
- Responda dúvidas e acompanhe o registro de alterações administrativas.
- Alunos têm perfil, senha, progresso, notas privadas, favoritos e histórico sincronizados na conta.

## Desenvolvimento

Execute `pnpm install`, `pnpm build` e `pnpm test`. Gere migrações com `pnpm db:generate` somente após mudar o esquema. Não altere migrações já aplicadas.

`node tests/seed-preview.mjs` cria uma conta apenas no banco local `.local/partiu.sqlite`; `node scripts/dev.mjs` abre http://127.0.0.1:4173. As credenciais locais de teste não são incluídas no Worker ou banco de produção.

O Worker gerado em `dist/server/index.js` incorpora `public/`. Publique apenas `dist/server/` e `dist/.openai/`, incluindo migrações. Os arquivos estáticos antigos em `dist/` não são usados nem incluídos na nova publicação. A configuração inicial usa a variável de hospedagem `OWNER_EMAIL` e a identidade encaminhada pelo serviço, não um e-mail declarado pelo navegador.

## Segurança e limites

Senhas com bcrypt custo 12, mínimo de 12 caracteres e máximo de 72 bytes. Tokens de sessão e convite aleatórios armazenados como SHA-256; cookies Secure/HttpOnly/SameSite=Strict; expiração de 24 horas; validação de origem nas escritas; limites de tentativas no banco; saída HTML escapada; controle de revisão para edições concorrentes. Autorizações são verificadas no servidor e dados pessoais são filtrados por usuário autenticado.

Convites e recuperação geram links para entrega manual pelo administrador. Não há envio automático de e-mail, Google, pagamentos nem upload direto de vídeos. A privacidade da hospedagem permanece restrita até a abertura explícita para alunos. As anotações locais da antiga prévia não são importadas automaticamente.

O teste integrado verifica configuração única, acesso sem sessão, bloqueio de aluno em operações administrativas, origem indevida, convite de uso único, filtragem de rascunhos, validação de vídeo/agenda, conflitos de revisão, isolamento de notas, dúvidas, suspensão, recuperação e logout. Isso não substitui uma auditoria independente de segurança.

Referências: https://github.com/dcodeIO/bcrypt.js e https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
