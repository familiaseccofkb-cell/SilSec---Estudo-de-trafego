// Envio de e-mails transacionais (confirmação de cadastro, recuperação de senha, chaves de acesso, contato) via SMTP.
// Na Hostinger: smtp.hostinger.com, porta 465, caixa contato@silsec-engenharia.com.br (padrão) — basta definir SMTP_PASSWORD.
// Sem SMTP configurado, o link é registrado no log do servidor (hPanel → Node.js → Logs) para o administrador.
// Biblioteca: nodemailer 10 (createTransport/sendMail; a importação aceita o módulo em ESM ou CommonJS).

// Motivo da falha em português, para a tela do administrador e para os avisos ao usuário.
export function describeMailError(error) {
  if (!error) return 'Falha desconhecida no envio.';
  const code = String(error.code || ''), resp = String(error.response || error.message || '');
  if (code === 'EAUTH' || /535|authentication failed|invalid login/i.test(resp)) return `O servidor de e-mail recusou o usuário ou a senha da caixa (EAUTH${/535/.test(resp) ? ' 535' : ''}). Confira SMTP_USER e SMTP_PASSWORD nas variáveis de ambiente — a senha deve ser a mesma da caixa de e-mail no hPanel.`;
  if (code === 'ECONNECTION' || code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'EDNS') return `Não foi possível conectar ao servidor de e-mail ${error.address || ''} (${code}). Confira SMTP_HOST e SMTP_PORT.`;
  if (code === 'ETIMEDOUT' || code === 'ESOCKET' || /timeout/i.test(resp)) return `O servidor de e-mail não respondeu a tempo (${code || 'tempo esgotado'}). Confira porta e SMTP_SECURE (465 = conexão segura direta; 587 = STARTTLS).`;
  if (code === 'EENVELOPE' || /recipient|sender address rejected|550|553/i.test(resp)) return `O servidor recusou o remetente ou o destinatário (${code || 'EENVELOPE'}). Confira SMTP_FROM: precisa ser um endereço da mesma caixa ou domínio autorizado.`;
  if (code === 'EMESSAGE') return 'A mensagem foi recusada pelo servidor de e-mail (EMESSAGE).';
  if (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND') return 'A biblioteca de e-mail (nodemailer) não está instalada: rode npm install.';
  return `Falha no envio${code ? ' (' + code + ')' : ''}: ${String(error.message || '').slice(0, 300)}`;
}

export function createMailer(smtp, log = console, {createTransport} = {}) {
  let transport = null, lastError = null, lastDeliveredAt = null;
  async function getTransport() {
    if (!smtp) return null;
    if (!transport) {
      const options = {
        host: smtp.host, port: smtp.port, secure: smtp.secure,
        auth: smtp.user ? {user: smtp.user, pass: smtp.password} : undefined,
        connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000,
      };
      if (createTransport) transport = createTransport(options);
      else {
        const mod = await import('nodemailer');
        const nodemailer = mod.default && typeof mod.default.createTransport === 'function' ? mod.default : mod;
        transport = nodemailer.createTransport(options);
      }
    }
    return transport;
  }
  function failure(error, to, subject, text) {
    const reason = describeMailError(error);
    lastError = {at: new Date().toISOString(), code: error?.code || '', reason, to};
    log.error(`[e-mail não enviado: ${error?.code || ''} ${error?.message || ''}] Para: ${to} · Assunto: ${subject}\n${text || ''}`);
    return {delivered: false, configured: true, reason, code: error?.code || ''};
  }
  return {
    configured: !!smtp,
    // Resumo para a tela do administrador (sem senha).
    // Verdadeiro quando houve falha de envio nos últimos 15 minutos e nenhum sucesso depois: as telas públicas mostram o aviso genérico.
    recentFailure(windowMs = 15 * 60 * 1000) {
      return !!lastError && Date.now() - Date.parse(lastError.at) < windowMs;
    },
    status() {
      return {configured: !!smtp, host: smtp?.host || '', port: smtp?.port || null, secure: !!smtp?.secure, user: smtp?.user || '', from: smtp?.from || '', lastError, lastDeliveredAt};
    },
    async send({to, subject, text, html, replyTo}) {
      let t;
      try { t = await getTransport(); } catch (error) { return failure(error, to, subject, text); }
      if (!t) {
        log.warn(`[e-mail não enviado: SMTP não configurado] Para: ${to} · Assunto: ${subject}\n${text}`);
        return {delivered: false, configured: false, reason: 'Envio de e-mail não configurado neste servidor (defina SMTP_PASSWORD nas variáveis de ambiente).'};
      }
      try {
        const info = await t.sendMail({from: smtp.from, replyTo: replyTo || smtp.replyTo || undefined, to, subject, text, html});
        lastDeliveredAt = new Date().toISOString(); lastError = null;
        return {delivered: true, configured: true, messageId: info?.messageId || null};
      } catch (error) {
        // Senha errada ou servidor fora do ar não derrubam a tela; o motivo e o link ficam no log e na tela do administrador.
        return failure(error, to, subject, text);
      }
    },
    // Envio de teste pelo painel do administrador.
    async test(to) {
      const started = Date.now();
      const r = await this.send({to, subject: 'Teste de envio · SilSec', text: `Este é um e-mail de teste enviado pelo painel do administrador em ${new Date().toLocaleString('pt-BR')}. Se você o recebeu, o envio está funcionando.`});
      return {...r, ms: Date.now() - started};
    },
  };
}
