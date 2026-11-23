// Identidade exibida no programa, nas páginas de acesso, nos e-mails e nos relatórios.
// Altere aqui para trocar nome, telefone ou e-mail em todo o sistema.
// Marca ativa: 'silsec' (SilSec Engenharia, silsec-engenharia.com.br) ou 'tes' (Traffic Estimator System, trafficestimatorsystem.com).
// No servidor vem de SILSEC_MARCA; no navegador, o servidor troca a linha abaixo ao entregar /brand.js (server/platform/marca.mjs).
const MARCA_SERVIDOR = 'silsec';
const escolhida = (typeof process !== 'undefined' && process.env?.SILSEC_MARCA) || MARCA_SERVIDOR;

const SILSEC = Object.freeze({
  id: 'silsec',
  name: 'SilSec Engenharia',
  short: 'SilSec',
  tagline: 'Estudos de tráfego de elevadores',
  phone: '+55 (11) 98313-0055',
  phoneHref: 'tel:+5511983130055',
  whatsappHref: 'https://wa.me/5511983130055',
  email: 'contato@silsec-engenharia.com.br',
  site: 'https://silsec-engenharia.com.br',
  // ?v=… força navegador e CDN a buscarem o logo novo; troque o número quando o arquivo do logo mudar.
  logo: '/marca/silsec-engenharia.svg?v=9.5.7',
  logoWidth: 480,
  logoHeight: 200,
  credit: '',
  creditPhone: '',
  // Vídeos exibidos no site (seção "Veja em vídeo"), sempre pelo YouTube sem cookies (youtube-nocookie.com), sem autoplay.
  // Cada vídeo aparece no player do site, um abaixo do outro, na ordem desta lista. Para incluir um vídeo novo,
  // publique no canal SilSec Engenharia e acrescente o ID (o trecho depois de youtu.be/).
  // 9.5.7 · 19l (Fabio, 20/11/2026): vídeo do canal SilSec Engenharia no lugar do vídeo antigo (2NFZdsuN4_4).
  // 9.5.7 · 19m (Fabio, 21/11/2026): segundo vídeo, logo abaixo do primeiro.
  videos: Object.freeze([
    Object.freeze({id: 'y_fxuLWYFJk', title: 'Por que fazer um estudo de tráfego de elevadores'}),
    // 19q (Fabio, 22/11/2026): a SilSec não vende mais o sistema; saiu o vídeo "Apresentação do Sistema de estudo de tráfego SilSec" (2ndckRtA65k).
  ]),
});

// TES · Traffic Estimator System: plataforma de cálculo de tráfego. Sem referências à SilSec, exceto a menção de produto
// "Produto da SilSec Engenharia" no rodapé (aprovação do Fabio para publicação, 22/11/2026).
// Logo e ícones = Downloads\Logotipo TES (sem fundo).png, PNG transparente (reduzido para o site; ícones com o símbolo).
const TES = Object.freeze({
  id: 'tes',
  name: 'Traffic Estimator System',
  short: 'TES',
  tagline: 'Cálculo de tráfego de elevadores',
  phone: '+55 (11) 98313-0055',
  phoneHref: 'tel:+5511983130055',
  whatsappHref: 'https://wa.me/5511983130055',
  email: 'contato@trafficestimatorsystem.com',
  site: 'https://trafficestimatorsystem.com',
  logo: '/marca/tes/logo-tes-512.png?v=2',
  logoWidth: 512,
  logoHeight: 512,
  credit: 'Produto da SilSec Engenharia',
  creditPhone: '',
  // Vídeos do canal Traffic Estimator System: incluir os IDs quando o Fabio enviar (os da SilSec não entram aqui).
  videos: Object.freeze([]),
});

export const MARCAS = Object.freeze({silsec: SILSEC, tes: TES});
export const BRAND = MARCAS[escolhida] || SILSEC;

export const contactLine = () => `${BRAND.phone} · ${BRAND.email}`;
export const creditLine = () => '';
