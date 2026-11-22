#Requires -RunAsAdministrator
<#
  SilSec Engenharia · instalação da versão para rede local (Opção A, fase 1).
  Rode no computador que será o SERVIDOR, como Administrador:
    powershell -ExecutionPolicy Bypass -File .\instalar-rede-local.ps1 -AdminEmail voce@empresa.com.br

  O que faz:
    1. Instala o MariaDB (instalador .msi desta pasta) como serviço "SilSecMariaDB", ouvindo só este computador (127.0.0.1).
    2. Cria o banco "silsec" e o usuário do programa, com senhas geradas aqui (ninguém precisa digitá-las).
    3. Copia o programa e o Node.js para "Arquivos de Programas\SilSec Rede Local".
    4. Grava a configuração em "ProgramData\SilSec Rede Local\config" com acesso só de Administradores e do sistema.
    5. Cria a conta do administrador (a senha é pedida na tela, sem aparecer).
    6. Cria a tarefa "SilSec Servidor", que liga o programa junto com o Windows e o religa se parar.
    7. Libera a porta no firewall SOMENTE para redes privadas.
  Os outros computadores abrem http://NOME-DESTE-PC:PORTA no navegador. Nada é enviado ao site.
  Rodar de novo atualiza o programa e mantém banco, contas e estudos.
#>
param(
  [Parameter(Mandatory = $true)][string]$AdminEmail,
  [string]$AdminNome = 'Administrador',
  [int]$Porta = 3980,
  [int]$PortaBanco = 3307,
  [string]$PastaPrograma = (Join-Path $env:ProgramFiles 'SilSec Rede Local'),
  [string]$PastaDados = (Join-Path $env:ProgramData 'SilSec Rede Local'),
  [string]$Msi = ''
)
$ErrorActionPreference = 'Stop'
$aqui = Split-Path -Parent $MyInvocation.MyCommand.Path
$tarefa = 'SilSec Servidor'
$servicoBanco = 'SilSecMariaDB'
$regraFirewall = "SilSec Rede Local (TCP $Porta)"

function Passo($t) { Write-Host "`n== $t" -ForegroundColor Cyan }
function NovaSenha { -join ((1..32) | ForEach-Object { 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[(Get-Random -Maximum 57)] }) }
function Proteger($caminho) {
  # Só o sistema (S-1-5-18) e Administradores (S-1-5-32-544) leem a pasta de configuração.
  & icacls $caminho /inheritance:r /grant:r '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' | Out-Null
  if ($LASTEXITCODE) { throw "Não foi possível proteger $caminho" }
}

# ---------- Conferências ----------
Passo 'Conferindo'
if ($Porta -eq 3957 -or $PortaBanco -eq 3957) { throw 'A porta 3957 não pode ser usada.' }
if ($Porta -lt 1024 -or $Porta -gt 65535) { throw "Porta inválida: $Porta" }
if ($AdminEmail -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') { throw "E-mail inválido: $AdminEmail" }
foreach ($p in @($PastaPrograma, $PastaDados)) {
  if ($p -match 'OneDrive|Dropbox|Google Drive') { throw "Não use pasta sincronizada na nuvem para o programa ou o banco: $p" }
}
$node = Join-Path $aqui 'node\node.exe'
$app = Join-Path $aqui 'app'
if (-not (Test-Path $node)) { throw "Node.js não encontrado em $node" }
if (-not (Test-Path (Join-Path $app 'rede-local.mjs'))) { throw "Programa não encontrado em $app" }
if (-not $Msi) { $Msi = (Get-ChildItem $aqui -Filter 'mariadb-*-winx64.msi' | Sort-Object Name | Select-Object -Last 1).FullName }
$tarefaExiste = [bool](Get-ScheduledTask -TaskName $tarefa -ErrorAction SilentlyContinue)
if (-not $tarefaExiste) {
  $ocupada = Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue
  if ($ocupada) { throw "A porta $Porta já está em uso neste computador. Escolha outra com -Porta." }
}

$pastaConfig = Join-Path $PastaDados 'config'
$pastaLogs = Join-Path $PastaDados 'logs'
$arquivoConfig = Join-Path $pastaConfig 'silsec-rede.env'
$arquivoRoot = Join-Path $pastaConfig 'mariadb-root.txt'
New-Item -ItemType Directory -Force $pastaConfig, $pastaLogs, (Join-Path $PastaDados 'backups') | Out-Null
Proteger $pastaConfig

# ---------- MariaDB ----------
Passo 'Banco de dados MariaDB'
$svc = Get-Service $servicoBanco -ErrorAction SilentlyContinue
$dirBanco = Join-Path $PastaDados 'mariadb'
$dirMaria = Join-Path $PastaPrograma 'MariaDB'
if (-not $svc) {
  if (-not $Msi -or -not (Test-Path $Msi)) { throw 'Instalador do MariaDB (.msi) não encontrado nesta pasta. Use -Msi caminho\mariadb-...-winx64.msi' }
  $root = NovaSenha
  Set-Content -Path $arquivoRoot -Value $root -Encoding ascii
  $argumentos = @('/i', "`"$Msi`"", '/qn', "INSTALLDIR=`"$dirMaria`"", "DATADIR=`"$dirBanco`"", "SERVICENAME=$servicoBanco",
    "PORT=$PortaBanco", "PASSWORD=$root", 'UTF8=1', 'ALLOWREMOTEROOTACCESS=', 'SKIPNETWORKING=', 'STDCONFIG=1')
  $p = Start-Process msiexec.exe -ArgumentList $argumentos -Wait -PassThru
  if ($p.ExitCode -ne 0 -and $p.ExitCode -ne 3010) { throw "O instalador do MariaDB terminou com código $($p.ExitCode)." }
  # Só conexões deste computador.
  $ini = Join-Path $dirBanco 'my.ini'
  $texto = Get-Content $ini -Raw
  if ($texto -notmatch '(?m)^\s*bind-address') { $texto = $texto -replace '(?m)^\[mysqld\]\s*$', "[mysqld]`r`nbind-address=127.0.0.1`r`ncharacter-set-server=utf8mb4`r`ncollation-server=utf8mb4_unicode_ci" ; Set-Content $ini $texto -Encoding ascii }
  Restart-Service $servicoBanco
} else {
  Write-Host 'MariaDB já instalado: mantido como está.'
  $root = (Get-Content $arquivoRoot -Raw).Trim()
}
Set-Service $servicoBanco -StartupType Automatic
$cliente = Get-ChildItem $dirMaria -Recurse -Filter 'mariadb.exe' | Select-Object -First 1
if (-not $cliente) { throw "Cliente mariadb.exe não encontrado em $dirMaria" }

$cfgAtual = @{}
if (Test-Path $arquivoConfig) { Get-Content $arquivoConfig | ForEach-Object { if ($_ -match '^\s*([A-Z_]+)\s*=\s*(.*)$') { $cfgAtual[$matches[1]] = $matches[2] } } }
$senhaApp = if ($cfgAtual['DB_PASSWORD']) { $cfgAtual['DB_PASSWORD'] } else { NovaSenha }
$sql = @"
CREATE DATABASE IF NOT EXISTS silsec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'silsec'@'127.0.0.1' IDENTIFIED BY '$senhaApp';
CREATE USER IF NOT EXISTS 'silsec'@'localhost' IDENTIFIED BY '$senhaApp';
GRANT ALL PRIVILEGES ON silsec.* TO 'silsec'@'127.0.0.1';
GRANT ALL PRIVILEGES ON silsec.* TO 'silsec'@'localhost';
FLUSH PRIVILEGES;
"@
$env:MYSQL_PWD = $root
$sql | & $cliente.FullName -uroot -h127.0.0.1 -P $PortaBanco --protocol=TCP
$codigo = $LASTEXITCODE
Remove-Item Env:\MYSQL_PWD
if ($codigo) { throw 'Não foi possível criar o banco e o usuário do programa.' }

# ---------- Configuração ----------
Passo 'Configuração'
@(
  '# SilSec Rede Local · gerado pelo instalador. Não compartilhe este arquivo.'
  "PORTA=$Porta"
  'DB_HOST=127.0.0.1'
  "DB_PORT=$PortaBanco"
  'DB_NAME=silsec'
  'DB_USER=silsec'
  "DB_PASSWORD=$senhaApp"
  "ADMIN_EMAIL=$($AdminEmail.ToLower())"
  "PASTA_DADOS=$PastaDados"
) | Set-Content -Path $arquivoConfig -Encoding ascii
Proteger $pastaConfig

# ---------- Programa ----------
Passo 'Programa'
if ($tarefaExiste) { Stop-ScheduledTask -TaskName $tarefa -ErrorAction SilentlyContinue; Start-Sleep 2 }
New-Item -ItemType Directory -Force $PastaPrograma | Out-Null
foreach ($d in @('app', 'node')) { $destino = Join-Path $PastaPrograma $d; if (Test-Path $destino) { Remove-Item $destino -Recurse -Force } }
Copy-Item $app (Join-Path $PastaPrograma 'app') -Recurse
Copy-Item (Join-Path $aqui 'node') (Join-Path $PastaPrograma 'node') -Recurse
$nodeFinal = Join-Path $PastaPrograma 'node\node.exe'
$appFinal = Join-Path $PastaPrograma 'app'
$env:SILSEC_REDE_CONFIG = $arquivoConfig
Push-Location $appFinal
& $nodeFinal rede-local.mjs verificar
if ($LASTEXITCODE) { Pop-Location; throw 'A verificação do programa com o banco falhou.' }

# ---------- Conta do administrador ----------
Passo "Conta do administrador ($AdminEmail)"
$temConta = $cfgAtual['ADMIN_EMAIL'] -eq $AdminEmail.ToLower()
if (-not $temConta) {
  do {
    $s1 = Read-Host 'Crie a senha do administrador (mínimo 10 caracteres)' -AsSecureString
    $s2 = Read-Host 'Repita a senha' -AsSecureString
    $t1 = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s1))
    $t2 = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s2))
    $ok = $t1 -eq $t2 -and $t1.Length -ge 10
    if (-not $ok) { Write-Host 'As senhas não conferem ou têm menos de 10 caracteres.' -ForegroundColor Yellow }
  } until ($ok)
  $t1 | & $nodeFinal rede-local.mjs usuario $AdminEmail $AdminNome
  $t1 = $null; $t2 = $null
  if ($LASTEXITCODE) { Pop-Location; throw 'Não foi possível criar a conta do administrador.' }
} else { Write-Host 'Conta do administrador mantida.' }
Pop-Location
Remove-Item Env:\SILSEC_REDE_CONFIG

# ---------- Tarefa "SilSec Servidor" ----------
Passo 'Ligação automática com o Windows'
$log = Join-Path $pastaLogs 'servidor.log'
$comando = "`"set SILSEC_REDE_CONFIG=$arquivoConfig&& `"$nodeFinal`" rede-local.mjs >> `"$log`" 2>&1`""
$acao = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c $comando" -WorkingDirectory $appFinal
$gatilho = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId 'S-1-5-18' -LogonType ServiceAccount -RunLevel Highest
$ajustes = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
  -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $tarefa -Action $acao -Trigger $gatilho -Principal $principal -Settings $ajustes -Force | Out-Null
Start-ScheduledTask -TaskName $tarefa

# ---------- Firewall (só rede privada) ----------
Passo 'Firewall'
Get-NetFirewallRule -DisplayName 'SilSec Rede Local (TCP *' -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName $regraFirewall -Direction Inbound -Protocol TCP -LocalPort $Porta -Profile Private -Action Allow | Out-Null
$perfis = (Get-NetConnectionProfile | Select-Object -ExpandProperty NetworkCategory) -join ', '
if ($perfis -notmatch 'Private') { Write-Host "Atenção: a rede deste computador está como '$perfis'. Para os outros computadores acessarem, marque a rede como Privada nas Configurações do Windows." -ForegroundColor Yellow }

# ---------- Atalho e conferência final ----------
$atalho = Join-Path ([Environment]::GetFolderPath('CommonDesktopDirectory')) 'SilSec Rede Local.url'
Set-Content $atalho "[InternetShortcut]`r`nURL=http://localhost:$Porta/sistema" -Encoding ascii
Passo 'Conferência'
$ok = $false
for ($i = 0; $i -lt 30 -and -not $ok; $i++) { Start-Sleep 1; try { $ok = (Invoke-RestMethod "http://127.0.0.1:$Porta/saude" -TimeoutSec 2).ok } catch {} }
if (-not $ok) { throw "O programa não respondeu. Veja o registro em $log" }
Write-Host "`nSilSec Rede Local instalado." -ForegroundColor Green
Write-Host "Neste computador: http://localhost:$Porta/sistema"
Write-Host "Nos outros computadores da rede: http://$($env:COMPUTERNAME):$Porta/sistema"
Write-Host "Contas novas: o administrador libera em 'Equipe e acessos' e cria a senha com:"
Write-Host "  `"$nodeFinal`" `"$appFinal\rede-local.mjs`" usuario email@empresa.com.br `"Nome`"   (como Administrador)"
