# 2. Arquitetura: celular + computador + servidor local + relé em nuvem

## 2.1 Princípios

1. **Cálculo no aparelho.** O motor NBR 5665 / ISO 8100-32 (`sistema-original/public/*.js`) roda no navegador do computador ou do celular. O servidor não precisa estar disponível para calcular.
2. **Dados no servidor local.** Estudos, clientes, propostas, relatórios e logomarcas ficam em um computador seu (SQLite + pasta de arquivos), com backup criptografado.
3. **Um único programa para todos os aparelhos.** O mesmo aplicativo web funciona no navegador sem instalar nada e pode ser "instalado" como aplicativo (PWA) em Android, iPhone, Windows, macOS e Linux.
4. **Troca de informações entre aparelhos pelo servidor.** O que é salvo no computador aparece no celular (e vice-versa) ao abrir o projeto; links de consulta, convites de fornecedores e delegações já existentes no sistema enviam estudos a outras pessoas.

## 2.2 Visão geral

```
 ┌──────────────── Escritório (rede local) ────────────────┐
 │                                                          │
 │  Computador (navegador/PWA) ─┐                           │
 │  Celular no Wi-Fi (PWA) ─────┼─ HTTPS ─► Servidor local  │
 │                              │           ┌─────────────┐ │
 │                              │           │ Caddy :443  │ │
 │                              │           │   (TLS)     │ │
 │                              │           │ Node :8080  │ │
 │                              │           │ SQLite/WAL  │ │
 │                              │           │ arquivos    │ │
 │                              │           └─────┬───────┘ │
 │                    Nobreak ── HD USB backup ───┘         │
 └───────────────────────────────┬──────────────────────────┘
                                 │ Internet (roteador)
        ┌────────────────────────┴───────────────────────┐
        │ Modo A: DDNS + porta 443 encaminhada           │
        │ Modo B: túnel WireGuard até o VPS (CGNAT)      │
        └────────────────────────┬───────────────────────┘
                                 ▼
       Celular 4G / computador de terceiros / cliente
       (navegador, sem instalar) ── https://silsec.seudominio.com.br
```

## 2.3 Componentes deste repositório

| Pasta | Conteúdo | Onde roda |
|---|---|---|
| `sistema-original/` | Código SilSec recebido: interface, motor de cálculo, API (`server/api.mjs`), migrações do banco, testes | Interface e cálculo: navegador. API: servidor local |
| `servidor-local/src/` | Servidor HTTP: login, sessões, 2FA, proteção, adaptador SQLite (`db.mjs`), arquivos (`bucket.mjs`), backup, linha de comando | Computador servidor |
| `servidor-local/pwa/` | Manifesto, ícones, service worker (offline), páginas Entrar e Minha conta | Navegador |
| `servidor-nuvem/` | Caddy + WireGuard para o relé (VPS) | VPS na nuvem (opcional) |
| `infra/` | Instalação Ubuntu, systemd, Caddy, DDNS, firewall, WireGuard, backup externo | Computador servidor |

## 2.4 Fluxo de uma sessão de trabalho

1. O usuário abre `https://silsec.seudominio.com.br` (ou o ícone instalado).
2. Sem sessão → página **Entrar** (e-mail, senha, código do autenticador).
3. O servidor valida, cria sessão (cookie `HttpOnly`, `Secure`, `SameSite=Lax`, 12 h renováveis, máximo 30 dias) e entrega o aplicativo.
4. O aplicativo baixa a lista de projetos (`/api/workspace`), e o service worker guarda uma cópia para uso offline.
5. Os cálculos rodam no aparelho. Ao **Salvar projeto**, o estudo vai ao servidor com o número de revisão; se outro aparelho alterou antes, o servidor recusa (conflito 409) em vez de sobrescrever.
6. Sem conexão: o app abre do cache, calcula e mantém o rascunho no aparelho; ao salvar, avisa que está offline. Com a conexão de volta, basta salvar.
7. Ao sair, o cookie é apagado e as cópias offline de dados são removidas do aparelho.

## 2.5 Por que esta arquitetura

| Alternativa | Por que não foi escolhida |
|---|---|
| Aplicativo nativo separado para Android/iOS/Windows | Três bases de código, publicação em lojas, custo alto. A PWA usa o mesmo motor já testado (491 testes). |
| Banco PostgreSQL/MySQL | Exige outro serviço para manter. SQLite em WAL atende com folga dezenas de usuários simultâneos e simplifica o backup. A API original já usa SQL compatível com SQLite. |
| Hospedar tudo na nuvem | Contraria o requisito de armazenamento no servidor próprio. O VPS do modo B só repassa tráfego. |
| Expor o Node direto na internet | Caddy fornece TLS automático, HTTP/2/3, compressão e limites; o Node escuta só em `127.0.0.1`. |
