# Instaladores Windows do SilSec

Código em Go, sem dependências externas, compilado para Windows 64 bits a partir de qualquer sistema:

```sh
./build.sh /caminho/do/silsec-hostinger dist
```

Gera em `dist/`: `Instalar SilSec.exe` (aplicativo conectado), `Instalar SilSec (desenvolvedor).exe` (idem, com o atalho do console) e `Instalar SilSec Offline.exe` (versão local com Node.js portátil). O ícone e o manifesto (asInvoker, DPI, UTF-8) entram pelo `tools/mkrsrc`. Para assinar, use o `signtool` com um certificado de assinatura de código.
