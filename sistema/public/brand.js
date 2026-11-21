// Identidade exibida no programa, nas páginas de acesso, nos e-mails e nos relatórios.
// Altere aqui para trocar nome, telefone ou e-mail em todo o sistema.
export const BRAND = Object.freeze({
  name: 'SilSec Engenharia',
  short: 'SilSec',
  tagline: 'Estudos de tráfego de elevadores',
  phone: '(11) 98313-0055',
  phoneHref: 'tel:+5511983130055',
  whatsappHref: 'https://wa.me/5511983130055',
  email: 'contato@silsec-engenharia.com.br',
  site: 'https://silsec-engenharia.com.br',
  // ?v=… força navegador e CDN a buscarem o logo novo; troque o número quando o arquivo do logo mudar.
  logo: '/marca/silsec-engenharia.svg?v=9.5.7',
  credit: '',
  creditPhone: '',
  // Vídeos exibidos no site (seção "Veja em vídeo"), sempre pelo YouTube sem cookies (youtube-nocookie.com), sem autoplay.
  // Cada vídeo aparece no player do site, um abaixo do outro, na ordem desta lista. Para incluir um vídeo novo,
  // publique no canal SilSec Engenharia e acrescente o ID (o trecho depois de youtu.be/).
  // 9.5.7 · 19l (Fabio, 20/11/2026): vídeo do canal SilSec Engenharia no lugar do vídeo antigo (2NFZdsuN4_4).
  // 9.5.7 · 19m (Fabio, 21/11/2026): segundo vídeo, logo abaixo do primeiro.
  videos: Object.freeze([
    Object.freeze({id: 'y_fxuLWYFJk', title: 'Por que fazer um estudo de tráfego de elevadores'}),
    Object.freeze({id: '2ndckRtA65k', title: 'Apresentação do Sistema de estudo de tráfego SilSec'}),
  ]),
});
export const contactLine = () => `${BRAND.phone} · ${BRAND.email}`;
export const creditLine = () => '';
