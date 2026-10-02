// Página de vendas editável pelo painel: descrição do conteúdo (gera o formulário e valida),
// conteúdo padrão e geração do HTML (vendas, termos, privacidade e manutenção).

// ---------- Descrição do conteúdo ----------
const text=(label,max,o={})=>({type:'text',label,max,...o});
const area=(label,max,o={})=>({type:'text',label,max,multiline:true,...o});
const email=(label,o={})=>({type:'text',label,max:254,format:'email',...o});
const lines=(label,max,maxLen,o={})=>({type:'lines',label,max,maxLen,...o});
const image=(label,o={})=>({type:'image',label,...o});
const toggle=label=>({type:'toggle',label});
const object=(label,fields,o={})=>({type:'object',label,fields,...o});
const list=(label,item,max,o={})=>({type:'list',label,item,max,...o});
const show=toggle('Exibir esta seção');

export const salesSchema=object('',[
 ['seo',object('Google e compartilhamento',[
  ['title',text('Título da aba do navegador',70,{required:true})],
  ['description',area('Descrição para o Google e redes sociais',170,{required:true})]])],
 ['hero',object('Topo da página',[
  ['eyebrow',text('Chamada pequena acima do título',60)],
  ['title',text('Título principal',120,{required:true})],
  ['highlight',text('Palavra em destaque no título',40,{help:'Precisa aparecer exatamente no título; ela fica em itálico e vermelho.'})],
  ['lead',area('Texto de apoio',400)],
  ['ctaPrimary',text('Botão principal',40,{required:true})],
  ['ctaSecondary',text('Botão secundário (vazio = sem botão)',40)],
  ['image',image('Foto principal',{help:'Horizontal ou quadrada. Sem foto, usa a paisagem da Toscana.'})],
  ['imageAlt',text('Descrição da foto (para leitores de tela)',160)],
  ['caption',text('Legenda da foto',80)],
  ['facts',list('Destaques numéricos',object('Destaque',[['value',text('Valor',20,{required:true})],['label',text('Texto',40,{required:true})]]),4)]])],
 ['pains',object('Dúvidas do público',[
  ['enabled',show],['title',text('Título',120)],['items',lines('Dúvidas (uma por linha)',8,200)],['answer',area('Resposta',300)]])],
 ['tracks',object('Trilhas',[
  ['enabled',show],['eyebrow',text('Chamada pequena',60)],['title',text('Título',120)],
  ['items',list('Trilhas',object('Trilha',[
   ['label',text('Rótulo (ex.: Trilha 1)',30)],['title',text('Nome',80,{required:true})],['stages',lines('Etapas (uma por linha)',8,80)],
   ['summary',area('Resumo dos módulos',300)],['image',image('Imagem (opcional; substitui o ícone)')],['imageAlt',text('Descrição da imagem',160)]]),6)]])],
 ['steps',object('Como funciona',[
  ['enabled',show],['eyebrow',text('Chamada pequena',60)],['title',text('Título',120)],
  ['items',list('Passos',object('Passo',[['title',text('Título',60,{required:true})],['text',area('Texto',240)]]),6)]])],
 ['addons',object('Adicionais',[
  ['enabled',show],['eyebrow',text('Chamada pequena',60)],['title',text('Título',120)],
  ['plannerTitle',text('Nome do Meu Planner',40,{required:true})],['plannerText',area('Descrição do Meu Planner',400)],
  ['fornitoreTitle',text('Nome do Fornitore',40,{required:true})],['fornitoreText',area('Descrição do Fornitore',400)],['note',area('Observação',240)]])],
 ['buy',object('Bloco de compra',[
  ['eyebrow',text('Chamada pequena',60)],['title',text('Título',120,{required:true})],['benefits',lines('Benefícios (um por linha)',10,160)],
  ['guarantee',area('Garantia',300)],['productTitle',text('Nome do produto no cartão de compra',60,{required:true})],['productSub',text('Subtítulo do produto',60)]])],
 ['faq',object('Perguntas frequentes',[
  ['enabled',show],['title',text('Título',80)],['items',list('Perguntas',object('Pergunta',[['q',text('Pergunta',160,{required:true})],['a',area('Resposta',1200,{required:true})]]),20)]])],
 ['finalCta',object('Chamada final',[['enabled',show],['title',text('Título',80)],['text',text('Texto',200)],['button',text('Botão',40)]])],
 ['footer',object('Rodapé e contato',[
  ['tagline',text('Frase do rodapé',160)],['contactEmail',email('E-mail de contato')],['whatsapp',text('WhatsApp (com DDD, só números)',20,{format:'phone'})],['credit',text('Crédito das imagens',240)]])],
 ['legal',object('Termos de uso e privacidade',[
  ['companyName',text('Razão social',160)],['cnpj',text('CNPJ',20)],['address',text('Endereço',240)],['supportEmail',email('E-mail de atendimento')],['dpo',text('Encarregado de dados (nome e e-mail)',200)],
  ['terms',list('Termos de uso',object('Cláusula',[['heading',text('Título',120,{required:true})],['text',area('Texto',4000,{required:true})]]),30)],
  ['privacy',list('Política de privacidade',object('Item',[['heading',text('Título',120,{required:true})],['text',area('Texto',4000,{required:true})]]),30)]])]
]);

export const maintenanceSchema=object('',[
 ['title',text('Título',100,{required:true})],
 ['message',area('Mensagem',600)],
 ['returnText',text('Previsão de retorno (opcional)',100)],
 ['contactEmail',email('E-mail de contato')],
 ['whatsapp',text('WhatsApp (com DDD, só números)',20,{format:'phone'})]
]);

// ---------- Conteúdo padrão ----------
export const defaultContent={
 seo:{title:'Arrivo In Itália · Da cidadania à nova vida na Itália',description:'Curso online com trilhas passo a passo para reconhecer sua cidadania italiana, planejar a mudança e construir sua vida na Itália. 1 ano de acesso.'},
 hero:{eyebrow:'Do Brasil para a Itália',title:'Sua vida na Itália começa com um plano bem feito.',highlight:'plano',lead:'Trilhas em vídeo, passo a passo, para reconhecer sua cidadania, planejar a mudança e construir a vida italiana — com a equipe do Arrivo respondendo suas dúvidas pelo caminho.',ctaPrimary:'Quero começar minha jornada',ctaSecondary:'Ver as trilhas',image:'',imageAlt:'Colinas da Val d’Orcia, na Toscana, ao entardecer',caption:'Val d’Orcia, Toscana',
  facts:[{value:'1 ano',label:'de acesso'},{value:'3',label:'trilhas'},{value:'24',label:'módulos'},{value:'Equipe',label:'para dúvidas'}]},
 pains:{enabled:true,title:'Você se reconhece em alguma destas dúvidas?',items:['Não sei por onde começar a buscar os documentos do meu antenato.','Via consular, judicial ou na Itália: qual é o caminho certo para mim?','Quero me mudar, mas tenho medo de chegar sem planejamento.','Residência, permesso, escola, trabalho… são muitas etapas ao mesmo tempo.'],answer:'O Arrivo In Itália organiza tudo isso em uma sequência clara, para você avançar uma etapa de cada vez.'},
 tracks:{enabled:true,eyebrow:'Três trilhas, uma jornada',title:'Do primeiro documento à nova rotina na Itália',items:[
  {label:'Trilha 1',title:'Reconhecer minha cidadania',stages:['Seu ponto de partida','Prepare sua documentação','Conheça as vias de reconhecimento','Depois do reconhecimento'],summary:'História familiar, certidões, traduções e apostilas, via consular, judicial e na Itália, AIRE e passaporte.',image:'',imageAlt:''},
  {label:'Trilha 2',title:'Planejar minha mudança',stages:['Planejamento da mudança','Organize sua chegada','Estabeleça sua residência'],summary:'Onde morar, planejamento financeiro, encontrar seu lar, documentos para a chegada e até a viagem do seu pet.',image:'',imageAlt:''},
  {label:'Trilha 3',title:'Construir minha vida na Itália',stages:['Prepare seu novo começo','Trabalho e formação','Vida em família'],summary:'Italiano para o dia a dia, trabalho, diplomas e profissões, escola dos filhos, saúde e uma nova rotina.',image:'',imageAlt:''}]},
 steps:{enabled:true,eyebrow:'Como funciona',title:'Simples do primeiro clique à primeira aula',items:[
  {title:'Escolha seu plano',text:'Curso com 1 ano de acesso e, se quiser, os adicionais. Pague com cartão, Pix ou boleto.'},
  {title:'Crie sua senha',text:'Assim que o pagamento é confirmado, sua conta é criada e você define a senha de acesso.'},
  {title:'Siga no seu ritmo',text:'Assista às aulas, marque o que concluiu, salve anotações e retome de onde parou.'},
  {title:'Tire suas dúvidas',text:'Pergunte em cada aula e participe dos encontros da agenda. A equipe responde na sua conta.'}]},
 addons:{enabled:true,eyebrow:'Adicionais',title:'Ferramentas para colocar o plano em prática',plannerTitle:'Meu Planner',plannerText:'Cada etapa da sua trilha vira uma tarefa com prazo, responsável, custo em euro ou real e situação. Guarde certidões e comprovantes em PDF ou imagem junto da etapa certa.',fornitoreTitle:'Fornitore',fornitoreText:'Rede de especialistas — assessoria de cidadania, tradutores, imobiliárias e outros profissionais — para reuniões online agendadas e pagas com segurança pela plataforma.',note:'Os adicionais valem até o fim do seu acesso ao curso e podem ser incluídos agora ou depois, dentro da plataforma.'},
 buy:{eyebrow:'Comece agora',title:'Um ano para transformar o plano em endereço italiano',benefits:['Acesso às 3 trilhas e a todos os módulos publicados durante 1 ano','Novas aulas incluídas assim que forem lançadas','Dúvidas respondidas pela equipe dentro de cada aula','Encontros ao vivo divulgados na agenda','Desconto especial para renovar ao fim do período'],guarantee:'7 dias para desistir. Se o curso não for para você, peça o reembolso integral em até 7 dias após a compra.',productTitle:'Curso Arrivo In Itália',productSub:'1 ano de acesso'},
 faq:{enabled:true,title:'Perguntas frequentes',items:[
  {q:'Por quanto tempo tenho acesso?',a:'Por 1 ano a partir da confirmação do pagamento. Durante esse período, você assiste às aulas quantas vezes quiser, inclusive às novas aulas publicadas.'},
  {q:'O que acontece quando o acesso vence?',a:'Seu progresso, suas anotações e seu planner ficam guardados. Você pode renovar por mais um ano com desconto especial de renovação e continuar de onde parou.'},
  {q:'Os adicionais precisam ser comprados junto com o curso?',a:'Não. Você pode incluí-los na compra ou depois, dentro da plataforma. Eles valem até o fim do seu acesso ao curso; na renovação, são contratados novamente se você quiser mantê-los.'},
  {q:'Quais são as formas de pagamento?',a:'Cartão de crédito, Pix ou boleto, processados com segurança pelo Stripe. No Pix e no boleto, o acesso é liberado assim que o pagamento é compensado.'},
  {q:'O curso substitui um advogado ou assessor?',a:'Não. O conteúdo é educativo: ele explica as etapas, os documentos e as opções para você tomar decisões com segurança. Para o seu caso específico, conte com profissionais — e, se quiser, encontre especialistas no adicional Fornitore.'},
  {q:'E se eu desistir?',a:'Você tem 7 dias após a compra para pedir o reembolso integral, conforme o Código de Defesa do Consumidor. Basta falar com a nossa equipe.'}]},
 finalCta:{enabled:true,title:'Un passo alla volta.',text:'Comece hoje a jornada que vai levar você até a Itália.',button:'Quero começar'},
 footer:{tagline:'Un passo alla volta verso una nuova vita che ci attende.',contactEmail:'',whatsapp:'',credit:'Foto: Val d’Orcia, Salvatore Gerace, Wikimedia Commons, CC BY 2.0 (recorte).'},
 legal:{companyName:'',cnpj:'',address:'',supportEmail:'',dpo:'',
  terms:[
   {heading:'O que é oferecido',text:'Acesso, pelo prazo contratado (1 ano a partir da confirmação do pagamento), às trilhas, módulos e aulas publicados na plataforma, à agenda de encontros e ao canal de dúvidas dentro das aulas. Os adicionais Meu Planner e Fornitore, quando contratados, valem até o fim do acesso ao curso.'},
   {heading:'Natureza educativa',text:'O conteúdo tem caráter educativo e informativo. Não constitui assessoria jurídica, contábil ou migratória individual e não garante resultado em processos de cidadania, residência ou qualquer outro procedimento perante autoridades brasileiras ou italianas.'},
   {heading:'Conta e uso pessoal',text:'O acesso é pessoal e intransferível. É proibido compartilhar a senha, gravar, copiar, baixar ou redistribuir as aulas e materiais. O descumprimento pode levar à suspensão do acesso, sem reembolso.'},
   {heading:'Pagamento, renovação e adicionais',text:'Os pagamentos são processados pelo Stripe, por cartão, Pix ou boleto. O acesso é liberado após a confirmação do pagamento. Ao fim do período, o acesso pode ser renovado por mais um ano, com as condições de renovação vigentes; os adicionais são contratados novamente, se desejado.'},
   {heading:'Direito de arrependimento',text:'Você pode desistir da compra em até 7 dias a partir da confirmação do pagamento, com reembolso integral, conforme o artigo 49 do Código de Defesa do Consumidor. Basta solicitar pelo e-mail de atendimento.'},
   {heading:'Fornitore',text:'Os especialistas do Fornitore são profissionais independentes. As reuniões são agendadas e pagas pela plataforma, que repassa o valor ao profissional, descontada a taxa de intermediação. A responsabilidade técnica pelos serviços prestados é do profissional.'},
   {heading:'Alterações',text:'Estes termos podem ser atualizados. Mudanças relevantes serão comunicadas na plataforma.'}],
  privacy:[
   {heading:'Dados tratados',text:'Cadastro: nome, e-mail e senha (armazenada de forma criptografada, sem possibilidade de leitura).\nCompra: produtos adquiridos, valores e situação do pagamento. Os dados de cartão, Pix e boleto são tratados diretamente pelo Stripe e não ficam na plataforma.\nUso: progresso nas aulas, anotações, favoritos, dúvidas, itens e anexos do Meu Planner e agendamentos do Fornitore.'},
   {heading:'Finalidades',text:'Prestar o serviço contratado, liberar e controlar o acesso, processar pagamentos e reembolsos, responder dúvidas, comunicar informações sobre a conta e cumprir obrigações legais.'},
   {heading:'Compartilhamento',text:'Com o Stripe (pagamentos), com o provedor de hospedagem e de vídeo, e com o profissional do Fornitore escolhido por você, apenas no necessário para a reunião agendada. Não vendemos dados pessoais.'},
   {heading:'Seus direitos',text:'Você pode pedir acesso, correção, portabilidade ou exclusão dos seus dados, além de informações sobre o tratamento, pelo e-mail do encarregado.'},
   {heading:'Segurança e retenção',text:'Usamos conexão criptografada, senhas protegidas e controle de acesso por conta. Os dados são mantidos enquanto a conta existir e pelo prazo exigido por obrigações legais e fiscais.'},
   {heading:'Cookies',text:'Usamos apenas o cookie necessário para manter você conectado. Não usamos cookies de publicidade.'}]}
};
export const defaultMaintenance={title:'Estamos preparando novidades',message:'A página do Arrivo In Itália está passando por ajustes e volta em breve. Se você já é aluno, a sua área de estudos continua funcionando normalmente.',returnText:'',contactEmail:'',whatsapp:''};

// ---------- Validação ----------
export class ContentError extends Error{}
export function cleanContent(node,value,label='',assets=new Set()){
 const where=label||node.label||'conteúdo';
 if(node.type==='object'){const v=value&&typeof value==='object'&&!Array.isArray(value)?value:{};return Object.fromEntries(node.fields.map(([k,f])=>[k,cleanContent(f,v[k],f.label?`${label?label+' › ':''}${f.label}`:label,assets)]));}
 if(node.type==='toggle')return value===true;
 if(node.type==='image'){if(!value)return '';if(typeof value!=='string'||!assets.has(value))throw new ContentError(`${where}: imagem não encontrada. Envie de novo.`);return value;}
 if(node.type==='lines'){const items=(Array.isArray(value)?value:String(value||'').split('\n')).map(s=>String(s).trim()).filter(Boolean);if(items.length>node.max)throw new ContentError(`${where}: no máximo ${node.max} linhas.`);for(const s of items)if(s.length>node.maxLen)throw new ContentError(`${where}: cada linha pode ter até ${node.maxLen} caracteres.`);return items;}
 if(node.type==='list'){const items=Array.isArray(value)?value:[];if(items.length>node.max)throw new ContentError(`${where}: no máximo ${node.max} itens.`);return items.map((item,i)=>cleanContent(node.item,item,`${where} › ${node.item.label} ${i+1}`,assets));}
 const s=typeof value==='string'?value.replace(/\r\n/g,'\n').trim():'';
 if(node.required&&!s)throw new ContentError(`${where}: preencha este campo.`);
 if(s.length>node.max)throw new ContentError(`${where}: até ${node.max} caracteres (agora ${s.length}).`);
 if(!node.multiline&&s.includes('\n'))throw new ContentError(`${where}: use uma única linha.`);
 if(s&&node.format==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))throw new ContentError(`${where}: informe um e-mail válido.`);
 if(s&&node.format==='phone'&&!/^\+?\d{10,15}$/.test(s.replace(/[\s().-]/g,'')))throw new ContentError(`${where}: informe o número com DDD (ex.: 11 91234-5678).`);
 return node.format==='phone'?s.replace(/[\s().-]/g,''):s;
}
// Completa conteúdo salvo com campos novos do padrão (quando a estrutura ganha campos).
export function withDefaults(node,value,fallback){
 if(node.type==='object'){const v=value&&typeof value==='object'?value:{},f=fallback||{};return Object.fromEntries(node.fields.map(([k,n])=>[k,k in v?withDefaults(n,v[k],f[k]):structuredClone(f[k]??emptyFor(n))]));}
 if(node.type==='list')return Array.isArray(value)?value.map((x,i)=>withDefaults(node.item,x,fallback?.[i])):structuredClone(fallback??[]);
 return value??fallback??emptyFor(node);
}
export function emptyFor(node){return node.type==='object'?Object.fromEntries(node.fields.map(([k,n])=>[k,emptyFor(n)])):node.type==='list'||node.type==='lines'?[]:node.type==='toggle'?false:'';}
export function assetIds(content){return [...JSON.stringify(content).matchAll(/"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/g)].map(m=>m[1]);}

// ---------- HTML ----------
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paragraphs=s=>String(s||'').split(/\n{2,}/).map(p=>p.trim()).filter(Boolean).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
const imageUrl=id=>`/media/site/${id}`;
const defaultHero='https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Landscape_in_Val_d%27Orcia.jpg/1280px-Landscape_in_Val_d%27Orcia.jpg';
const whatsappLink=n=>`https://wa.me/${n.replace(/^\+/,'').replace(/^(?!55)(\d{10,11})$/,'55$1')}`;
const fonts='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Serif+Display:ital@0;1&display=swap">';
const icons=['<rect x="10" y="6" width="28" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="24" cy="21" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M16 34h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>','<rect x="7" y="15" width="34" height="25" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M18 15v-4a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4M7 25h34" fill="none" stroke="currentColor" stroke-width="2.5"/>','<path d="M8 22 24 9l16 13v17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 41V29h8v12" fill="none" stroke="currentColor" stroke-width="2.5"/>'];
const header=(nav=true)=>`<header class="site-header"><div class="wrap header-row"><a class="logo" href="/" aria-label="Arrivo In Itália — página inicial"><img src="/logo-header.svg" alt="Arrivo In Itália" width="150" height="43"></a>${nav?`<nav class="site-nav" aria-label="Seções"><a href="#trilhas">Trilhas</a><a href="#como-funciona">Como funciona</a><a href="#adicionais">Adicionais</a><a href="#duvidas">Dúvidas</a></nav><div class="header-actions"><a class="link-quiet" href="/app#entrar">Entrar</a><a class="btn btn-small" href="#comprar">Quero começar</a></div>`:'<div class="header-actions"><a class="link-quiet" href="/app#entrar">Área do aluno</a></div>'}</div></header>`;
const footer=c=>`<footer class="site-footer"><div class="wrap footer-row"><div><strong>Arrivo In Itália</strong><p>${esc(c.footer.tagline)}</p>${c.footer.contactEmail||c.footer.whatsapp?`<p class="footer-contact">${c.footer.contactEmail?`<a href="mailto:${esc(c.footer.contactEmail)}">${esc(c.footer.contactEmail)}</a>`:''}${c.footer.whatsapp?`<a href="${esc(whatsappLink(c.footer.whatsapp))}" target="_blank" rel="noopener">WhatsApp</a>`:''}</p>`:''}</div><nav aria-label="Rodapé"><a href="/termos">Termos de uso</a><a href="/privacidade">Privacidade</a><a href="/app#entrar">Área do aluno</a></nav></div><div class="wrap credit">${esc(c.footer.credit)} © ${new Date().getFullYear()} Arrivo In Itália.</div></footer>`;
const page=({title,description,body,robots,banner='',script=true})=>`<!doctype html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>${description?`<meta name="description" content="${esc(description)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:locale" content="pt_BR">`:''}${robots?`<meta name="robots" content="${robots}">`:''}<link rel="icon" type="image/jpeg" href="/favicon.jpg">${fonts}<link rel="stylesheet" href="/landing.css">${script?'<script src="/landing.js" defer></script>':''}</head><body>${banner}${body}</body></html>`;
export const adminBanner=(kind)=>`<div class="admin-banner" role="status">${kind==='draft'?'<strong>Prévia do rascunho.</strong> Visitantes ainda veem a versão publicada.':kind==='maintenance-preview'?'<strong>Prévia da página de manutenção.</strong>':'<strong>Modo manutenção ativo.</strong> Visitantes veem a página de manutenção; você vê a página real porque é administrador.'} <a href="/app#admin/site">Voltar ao painel</a></div>`;

export function renderSalesPage(c,{banner=''}={}){
 const h=c.hero,hl=h.highlight&&h.title.includes(h.highlight)?h.title.indexOf(h.highlight):-1;
 const title=hl<0?esc(h.title):`${esc(h.title.slice(0,hl))}<em>${esc(h.highlight)}</em>${esc(h.title.slice(hl+h.highlight.length))}`;
 const heroImage=h.image?imageUrl(h.image):defaultHero;
 const body=`<a class="skip" href="#conteudo">Ir para o conteúdo</a>${header()}<main id="conteudo">
<section class="hero"><div class="wrap hero-grid"><div class="hero-copy">${h.eyebrow?`<p class="eyebrow"><span class="flag-dot" aria-hidden="true"></span>${esc(h.eyebrow)}</p>`:''}<h1>${title}</h1>${h.lead?`<p class="lead">${esc(h.lead)}</p>`:''}<div class="hero-cta"><a class="btn" href="#comprar">${esc(h.ctaPrimary)}</a>${h.ctaSecondary&&c.tracks.enabled?`<a class="btn btn-ghost" href="#trilhas">${esc(h.ctaSecondary)}</a>`:''}</div>${h.facts.length?`<ul class="facts" aria-label="Destaques">${h.facts.map(f=>`<li><strong>${esc(f.value)}</strong><span>${esc(f.label)}</span></li>`).join('')}</ul>`:''}</div>
<figure class="hero-art"><img class="photo" src="${esc(heroImage)}" alt="${esc(h.imageAlt)}" fetchpriority="high"><svg class="route" viewBox="0 0 420 300" aria-hidden="true" focusable="false"><defs><linearGradient id="arc" x1="0" x2="1"><stop offset="0" stop-color="#2f8f5b"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#cd3a3a"/></linearGradient></defs><path d="M58 238 C 120 40, 300 20, 360 92" fill="none" stroke="url(#arc)" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 12"/><g transform="translate(236 47) rotate(14)"><path d="M-14 0 L14 0 M2 0 L-6 -10 L-2 -10 L8 0 L-2 10 L-6 10 Z M-14 0 L-18 -5 L-15 -5 L-10 0 L-15 5 L-18 5 Z" fill="#fffdf8" stroke="#24453a" stroke-width="1.6" stroke-linejoin="round"/></g><g transform="translate(58 238)"><circle r="18" fill="#fffdf8" opacity=".95"/><circle r="7" fill="#2f8f5b"/></g><g transform="translate(360 92)"><circle r="18" fill="#fffdf8" opacity=".95"/><circle r="7" fill="#cd3a3a"/></g></svg><span class="pin pin-br">Brasil</span><span class="pin pin-it">Itália</span>${h.caption?`<figcaption>${esc(h.caption)}</figcaption>`:''}</figure></div></section>
${c.pains.enabled?`<section class="pains"><div class="wrap"><h2 class="section-title">${esc(c.pains.title)}</h2><ul class="pain-list">${c.pains.items.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>${c.pains.answer?`<p class="pain-answer">${esc(c.pains.answer)}</p>`:''}</div></section>`:''}
${c.tracks.enabled?`<section class="tracks" id="trilhas"><div class="wrap">${c.tracks.eyebrow?`<p class="eyebrow">${esc(c.tracks.eyebrow)}</p>`:''}<h2 class="section-title">${esc(c.tracks.title)}</h2><div class="track-grid">${c.tracks.items.map((t,i)=>`<article class="track${t.image?' has-image':''}">${t.image?`<img class="track-image" src="${imageUrl(t.image)}" alt="${esc(t.imageAlt)}" loading="lazy">`:`<svg class="track-icon" viewBox="0 0 48 48" aria-hidden="true">${icons[i%icons.length]}</svg>`}${t.label?`<span class="track-num">${esc(t.label)}</span>`:''}<h3>${esc(t.title)}</h3>${t.stages.length?`<ol>${t.stages.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:''}${t.summary?`<p class="track-modules">${esc(t.summary)}</p>`:''}</article>`).join('')}</div></div></section>`:''}
${c.steps.enabled?`<section class="steps" id="como-funciona"><div class="wrap">${c.steps.eyebrow?`<p class="eyebrow">${esc(c.steps.eyebrow)}</p>`:''}<h2 class="section-title">${esc(c.steps.title)}</h2><ol class="step-list">${c.steps.items.map((s,i)=>`<li><span>${i+1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ol></div></section>`:''}
${c.addons.enabled?`<section class="addons" id="adicionais"><div class="wrap">${c.addons.eyebrow?`<p class="eyebrow">${esc(c.addons.eyebrow)}</p>`:''}<h2 class="section-title">${esc(c.addons.title)}</h2><div class="addon-grid"><article class="addon"><h3>${esc(c.addons.plannerTitle)}</h3><p>${esc(c.addons.plannerText)}</p><p class="addon-price" data-price="planner">&nbsp;</p></article><article class="addon"><h3>${esc(c.addons.fornitoreTitle)}</h3><p>${esc(c.addons.fornitoreText)}</p><p class="addon-price" data-price="fornitore">&nbsp;</p></article></div>${c.addons.note?`<p class="note">${esc(c.addons.note)}</p>`:''}</div></section>`:''}
<section class="buy" id="comprar"><div class="wrap buy-grid"><div class="buy-copy">${c.buy.eyebrow?`<p class="eyebrow">${esc(c.buy.eyebrow)}</p>`:''}<h2 class="section-title">${esc(c.buy.title)}</h2>${c.buy.benefits.length?`<ul class="checks">${c.buy.benefits.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}${c.buy.guarantee?`<p class="guarantee">${esc(c.buy.guarantee)}</p>`:''}</div>
<form class="buy-card" id="buy-form" novalidate><h3>${esc(c.buy.productTitle)}</h3>${c.buy.productSub?`<p class="buy-sub">${esc(c.buy.productSub)}</p>`:''}<p class="buy-price" data-price="course" aria-live="polite">&nbsp;</p><fieldset class="extras"><legend>Adicionais (opcional)</legend><label><input type="checkbox" name="planner"><span>${esc(c.addons.plannerTitle)}</span><b data-price="planner"></b></label><label><input type="checkbox" name="fornitore"><span>${esc(c.addons.fornitoreTitle)}</span><b data-price="fornitore"></b></label></fieldset><div class="total"><span>Total</span><strong id="total" aria-live="polite">—</strong></div><label class="field">Nome completo<input name="name" autocomplete="name" required minlength="2" maxlength="120"></label><label class="field">E-mail<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label class="consent"><input type="checkbox" name="terms" required><span>Li e aceito os <a href="/termos" target="_blank" rel="noopener">Termos de uso</a> e a <a href="/privacidade" target="_blank" rel="noopener">Política de privacidade</a>.</span></label><p class="form-message" id="buy-message" role="alert"></p><button class="btn btn-block" type="submit" id="buy-button">Ir para o pagamento seguro</button><p class="secure">Pagamento processado pelo Stripe. Cartão, Pix ou boleto. O acesso é liberado após a confirmação.</p><p class="already">Já é aluno? <a href="/app#entrar">Entre para renovar ou incluir adicionais</a>.</p></form></div></section>
${c.faq.enabled&&c.faq.items.length?`<section class="faq" id="duvidas"><div class="wrap narrow"><h2 class="section-title">${esc(c.faq.title)}</h2>${c.faq.items.map(f=>`<details><summary>${esc(f.q)}</summary>${paragraphs(f.a)}</details>`).join('')}</div></section>`:''}
${c.finalCta.enabled?`<section class="final-cta"><div class="wrap">${c.finalCta.title?`<h2>${esc(c.finalCta.title)}</h2>`:''}${c.finalCta.text?`<p>${esc(c.finalCta.text)}</p>`:''}${c.finalCta.button?`<a class="btn btn-light" href="#comprar">${esc(c.finalCta.button)}</a>`:''}</div></section>`:''}
</main>${footer(c)}`;
 return page({title:c.seo.title,description:c.seo.description,body,banner,robots:banner?'noindex':''});
}

export function renderLegal(c,which,{banner=''}={}){
 const L=c.legal,terms=which==='termos',items=terms?L.terms:L.privacy,missing=!L.companyName||!L.cnpj;
 const who=terms?`<h2>Quem somos</h2><p>O Arrivo In Itália é uma plataforma de cursos online oferecida por ${esc(L.companyName||'[razão social]')}, CNPJ ${esc(L.cnpj||'[número]')}${L.address?`, com sede em ${esc(L.address)}`:''}. Atendimento: ${esc(L.supportEmail||'[e-mail de atendimento]')}.</p>`:`<h2>Controlador</h2><p>${esc(L.companyName||'[razão social]')}, CNPJ ${esc(L.cnpj||'[número]')}, é a controladora dos dados pessoais tratados na plataforma Arrivo In Itália, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018). Encarregado: ${esc(L.dpo||'[nome e e-mail]')}.</p>`;
 const body=`${header(false)}<main class="wrap narrow doc"><h1>${terms?'Termos de uso':'Política de privacidade'}</h1>${missing?'<p class="draft">Versão preliminar: dados da empresa ainda não preenchidos.</p>':''}${who}${items.map(s=>`<h2>${esc(s.heading)}</h2>${paragraphs(s.text)}`).join('')}<p><a href="/">← Voltar ao início</a></p></main>${footer(c)}`;
 return page({title:`${terms?'Termos de uso':'Política de privacidade'} · Arrivo In Itália`,body,banner,script:false});
}

export function renderMaintenance(m,{banner=''}={}){
 const contacts=[m.contactEmail&&`<a class="btn btn-ghost" href="mailto:${esc(m.contactEmail)}">${esc(m.contactEmail)}</a>`,m.whatsapp&&`<a class="btn btn-ghost" href="${esc(whatsappLink(m.whatsapp))}" target="_blank" rel="noopener">WhatsApp</a>`].filter(Boolean).join('');
 const body=`${header(false)}<main class="wrap"><section class="status-card maintenance-card"><div class="status-icon wait" aria-hidden="true">✦</div><h1>${esc(m.title)}</h1>${paragraphs(m.message)}${m.returnText?`<p class="maintenance-return">${esc(m.returnText)}</p>`:''}<div class="maintenance-actions"><a class="btn" href="/app#entrar">Já sou aluno → Entrar</a>${contacts}</div></section></main>`;
 return page({title:`${m.title} · Arrivo In Itália`,body,banner,robots:'noindex',script:false});
}
