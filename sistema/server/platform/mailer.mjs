// Envio de e-mails transacionais (confirmação de cadastro e recuperação de senha) via SMTP.
// Na Hostinger: smtp.hostinger.com, porta 465, caixa contato@silsec-engenharia.com.br (padrão) — basta definir SMTP_PASSWORD.
// Sem SMTP configurado, o link é registrado no log do servidor (hPanel → Node.js → Logs) para o administrador.
export function createMailer(smtp, log = console) {
  let transport = null;
  async function getTransport() {
    if (!smtp) return null;
    if (!transport) {
      const nodemailer = (await import('nodemailer')).default;
      transport = nodemailer.createTransport({
        host: smtp.host, port: smtp.port, secure: smtp.secure,
        auth: smtp.user ? {user: smtp.user, pass: smtp.password} : undefined,
        connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000,
      });
    }
    return transport;
  }
  return {
    configured: !!smtp,
    async send({to, subject, text, html, replyTo}) {
      const t = await getTransport();
      if (!t) {
        log.warn(`[e-mail não enviado: SMTP não configurado] Para: ${to} · Assunto: ${subject}\n${text}`);
        return {delivered: false};
      }
      try {
        await t.sendMail({from: smtp.from, replyTo: replyTo || smtp.replyTo || undefined, to, subject, text, html});
        return {delivered: true};
      } catch (error) {
        // Senha errada ou servidor fora do ar não derrubam a tela; o motivo e o link ficam no log.
        log.error(`[e-mail não enviado: ${error.code || ''} ${error.message}] Para: ${to} · Assunto: ${subject}\n${text}`);
        return {delivered: false};
      }
    },
  };
}
