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
  logo: '/marca/silsec-engenharia.svg',
  credit: '',
  creditPhone: '',
  // Vídeos exibidos no site (seção "Vídeos"). O primeiro aparece grande; os demais em lista.
  // Para incluir um vídeo novo, publique no YouTube e acrescente o ID (o trecho depois de youtu.be/).
  videos: Object.freeze([
    Object.freeze({id: '2NFZdsuN4_4', title: 'Cálculo de tráfego em elevadores'}),
  ]),
});
export const contactLine = () => `${BRAND.phone} · ${BRAND.email}`;
export const creditLine = () => '';
