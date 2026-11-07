#!/bin/sh
# Compila os executáveis Windows (64 bits) a partir do Linux. Uso: ./build.sh <pasta do projeto silsec-hostinger> <pasta de saída>
set -e
SRC=${1:-/home/claude/silsec-hostinger}; OUT=${2:-dist}
cd "$(dirname "$0")"; mkdir -p "$OUT"
export GOOS=windows GOARCH=amd64 CGO_ENABLED=0
for c in silsec-app instalar-app silsec-offline instalar-offline; do
  GOOS= GOARCH= go run ./tools/mkrsrc -ico recursos/silsec.ico -manifest recursos/app.manifest -o cmd/$c/rsrc_windows_amd64.syso >/dev/null
done
go build -trimpath -ldflags="-s -w -H windowsgui" -o cmd/instalar-app/SilSec.exe ./cmd/silsec-app
cp recursos/silsec.ico cmd/instalar-app/silsec.ico
go build -trimpath -ldflags="-s -w -H windowsgui" -o "$OUT/Instalar SilSec.exe" ./cmd/instalar-app
cp "$OUT/Instalar SilSec.exe" "$OUT/Instalar SilSec (desenvolvedor).exe"
go build -trimpath -ldflags="-s -w -H windowsgui" -o cmd/instalar-offline/SilSec-Offline.exe ./cmd/silsec-offline
cp recursos/silsec.ico cmd/instalar-offline/silsec.ico
rm -f cmd/instalar-offline/app.zip
(cd "$SRC" && zip -qr "$OLDPWD/cmd/instalar-offline/app.zip" desktop.mjs server.mjs package.json server public db scripts -x "*/.*")
go build -trimpath -ldflags="-s -w" -o "$OUT/Instalar SilSec Offline.exe" ./cmd/instalar-offline
ls -la "$OUT"
