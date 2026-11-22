// 9.5.7 (Fabio, 20/11/2026): toda sigla exibida ganha, no rodapé da tela ou da página, o descritivo no formato "* TIV – Tempo de Ida e Volta".
// O rodapé lista só as siglas que aparecem no conteúdo daquela tela ou página, na ordem desta tabela.
export const SIGLAS=[
 ['ABNT','Associação Brasileira de Normas Técnicas'],
 ['NBR','Norma Brasileira (ABNT)'],
 ['ISO','International Organization for Standardization (Organização Internacional de Normalização)'],
 ['TIV','Tempo de Ida e Volta'],
 ['PSH','Pessoas por hora no pico equivalente'],
 ['PPH','Partidas por hora, por elevador'],
 ['FAB','Cálculo com os dados do fabricante'],
 ['FC','Fator de ocupação da cabina'],
 ['FU','Fator de utilização da área'],
 ['ADS','Antecipador de Destino'],
 ['CT','Capacidade de tráfego dos grupos'],
 ['Ct','Capacidade de transporte do grupo'],
 ['TME','Tempo médio de espera'],
 ['TMD','Tempo médio até o destino'],
 ['VVVF','Tensão e frequência variáveis'],
 ['AC2','Corrente alternada, duas velocidades'],
 ['CC','Corrente contínua'],
 ['IA','Inteligência artificial'],
 ['CNPJ','Cadastro Nacional da Pessoa Jurídica'],
 ['CPF','Cadastro de Pessoas Físicas'],
 ['PDF','Portable Document Format (documento para impressão)'],
 ['JSON','JavaScript Object Notation (arquivo de dados do estudo)'],
 ['CSV','Valores separados por vírgula (planilha de texto)'],
 ['HTML','Formato de página da internet'],
];
const plain=html=>String(html??'').replace(/<footer class="siglas-rodape"[\s\S]*?<\/footer>/g,' ').replace(/<(script|style|template)[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');
const found=(text,sigla)=>new RegExp('(?<![A-Za-zÀ-ÿ0-9])'+sigla+'(?![A-Za-zÀ-ÿ0-9])').test(text);
export function siglasUsed(html){const text=plain(html);return SIGLAS.filter(([s])=>found(text,s));}
export function siglasFooter(html,{className='siglas-rodape'}={}){const list=siglasUsed(html);if(!list.length)return '';return `<footer class="${className}" aria-label="Siglas"><strong>Siglas</strong><br>${list.map(([s,d])=>`* ${s} – ${d}`).join('<br>')}</footer>`;}
