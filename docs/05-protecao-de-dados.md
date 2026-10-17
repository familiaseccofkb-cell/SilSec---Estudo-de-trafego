# 5. Proteção de dados e segurança

## 5.1 Que dados o sistema guarda

| Dado | Exemplos | Classificação |
|---|---|---|
| Pessoais de clientes e contatos | nome, e-mail, telefone, endereço, CNPJ/contato de fornecedores | **Dado pessoal (LGPD)** |
| Contas de acesso | e-mail, nome, hash da senha, segredo 2FA, registro de acessos com IP | Dado pessoal + credencial |
| Estudos e propostas | população, parâmetros, preços, comparativos de fornecedores | Confidencial comercial |
| Documentos | notas fiscais, contratos, logomarcas, relatórios | Confidencial |

## 5.2 Camadas de proteção implementadas

| Camada | Medida | Onde |
|---|---|---|
| Disco | Criptografia total LUKS (furto do equipamento não expõe dados) | Instalação do Ubuntu |
| Transporte | HTTPS obrigatório (TLS 1.2/1.3, Let's Encrypt), HSTS; túnel WireGuard até o VPS | Caddy, WireGuard |
| Identidade | Senha mínima de 12 caracteres com **scrypt** (N=2¹⁵); **2FA TOTP**; bloqueio progressivo após 5 erros; limite de 20 tentativas/15 min por IP; mesma mensagem para e-mail inexistente e senha errada | `servidor-local/src/auth.mjs` |
| Sessão | Token aleatório de 256 bits; banco guarda só o SHA-256; cookie `HttpOnly` + `Secure` + `SameSite=Lax` + prefixo `__Host-`; expira em 12 h sem uso e 30 dias no máximo; troca de senha encerra todas as sessões | `auth.mjs`, `app.mjs` |
| Falsificação de identidade | Cabeçalhos de identidade vindos do navegador são descartados (achado E1) | `app.mjs` |
| Navegador | CSP sem scripts inline/externos, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` | `app.mjs` |
| Requisições | Verificação de origem (CSRF), Host permitido (DNS rebinding), limite de 3,5 MB por envio, arquivos só da pasta pública, nomes de arquivo por hash (sem `../`) | `app.mjs`, `bucket.mjs` |
| Autorização | Perfis, equipes, delegações, isolamento de fornecedores e links com prazo/revogação — já existentes no sistema e cobertos por testes | `sistema-original/server` |
| Servidor | Serviço sem privilégios (`silsec`), systemd com `ProtectSystem=strict`, só escreve em `/var/lib/silsec`; Node escuta só em `127.0.0.1`/túnel | `infra/systemd` |
| Rede | Firewall nega tudo exceto 80/443/WireGuard; SSH só da rede local/VPN e só por chave; fail2ban | `infra/firewall` |
| Atualizações | Segurança do Ubuntu automática; zero dependências npm no servidor (menos superfície de ataque) | `unattended-upgrades` |
| Disponibilidade | Nobreak com desligamento automático; SQLite em WAL; religamento automático | NUT, BIOS |
| Backup | Diário local + HD USB + nuvem, criptografado (AES-256 restic), verificação de integridade, retenção 14 diários/8 semanais/24 mensais; HD em rodízio contra ransomware | `infra/backup` |
| Auditoria | Eventos de login, bloqueio, troca de senha, 2FA (`local_security_log`) + auditoria de projetos/links/propostas do sistema | `silsec-cli log` |
| Aparelhos | Dados offline removidos ao sair; aviso visível quando offline | `pwa/` |
| Terceiros | IA externa desligada por padrão; VPS não guarda dados; backup em nuvem cifrado antes do envio | `silsec.env` |

## 5.3 LGPD (Lei 13.709/2018) — o que fazer

1. **Papéis**: sua empresa é **controladora** dos dados de clientes e contatos. Provedores de VPS e backup em nuvem são **operadores** (os dados chegam a eles cifrados).
2. **Base legal**: execução de contrato/procedimentos preliminares (art. 7º, V) e legítimo interesse para contatos comerciais (art. 7º, IX). Registre isso em um documento simples de "registro das operações de tratamento" (art. 37).
3. **Minimização**: cadastrar só o necessário ao estudo e à proposta.
4. **Retenção**: defina prazo (ex.: 5 anos após o fim do contrato, alinhado a obrigações fiscais/responsabilidade técnica) e exclua depois.
5. **Direitos dos titulares** (art. 18): canal de contato (e-mail) para acesso, correção e exclusão; o sistema permite editar/excluir clientes.
6. **Encarregado (DPO)**: agentes de pequeno porte podem ficar dispensados de indicar encarregado (Resolução CD/ANPD nº 2/2022), mas devem manter canal de comunicação com os titulares.
7. **Incidentes**: em vazamento com risco relevante, comunicar a **ANPD e os titulares em até 3 dias úteis** (Resolução CD/ANPD nº 15/2024). Mantenha o roteiro da seção 5.5.
8. **Contratos com operadores**: verifique os termos de proteção de dados do VPS e do backup em nuvem; prefira data centers no Brasil.
9. **Colaboradores**: termo de confidencialidade; conta individual (nunca compartilhada); bloquear a conta no desligamento (`silsec-cli bloquear`).

## 5.4 Rotina de segurança

| Frequência | Tarefa |
|---|---|
| Diária (automática) | Backup local, HD USB e nuvem; atualizações de segurança |
| Semanal | Ver `sudo silsec-cli log 100` (tentativas suspeitas) e `journalctl -u silsec-backup -n 50` |
| Mensal | Trocar o HD de rodízio; conferir espaço em disco (`df -h`); atualizar o SilSec (`git pull` + script) |
| Trimestral | **Teste de restauração** do backup em outra pasta; revisar contas ativas; reiniciar o servidor para aplicar atualizações de kernel |
| Anual | Renovar domínio; revisar senhas do roteador/Cloudflare/VPS; revisar registro LGPD |

## 5.5 Roteiro de incidente (resumo)

1. **Conter**: desligar o encaminhamento de portas/túnel (`systemctl stop wg-quick@wg0 caddy`); bloquear contas suspeitas; trocar senhas de administração.
2. **Preservar evidências**: copiar `/var/log/caddy`, `journalctl -u silsec`, `silsec-cli log 1000`.
3. **Avaliar**: quais dados, quantos titulares, se havia criptografia.
4. **Comunicar**: ANPD e titulares em até 3 dias úteis quando houver risco ou dano relevante.
5. **Recuperar**: restaurar do backup anterior ao incidente (HD de rodízio desconectado é a cópia mais segura contra ransomware).
6. **Corrigir** a causa e registrar as lições aprendidas.

## 5.6 Referências de boas práticas

- ABNT NBR ISO/IEC 27001:2022 (sistema de gestão de segurança da informação) e 27002:2022 (controles) — referência para evoluir as rotinas acima.
- Guia orientativo da ANPD para agentes de tratamento de pequeno porte.
- OWASP ASVS (requisitos de segurança de aplicações web) — base das proteções de sessão, senha e cabeçalhos.
