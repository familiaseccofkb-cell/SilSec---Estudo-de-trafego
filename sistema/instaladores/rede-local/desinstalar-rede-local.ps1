#Requires -RunAsAdministrator
<#
  SilSec Engenharia · remove a versão para rede local DESTE computador.
  Mantém SEMPRE: banco de dados (MariaDB e a pasta de dados), contas, estudos, configuração e backups.
  Remove: a tarefa "SilSec Servidor", a regra do firewall, o atalho e os arquivos do programa e do Node.js.
  O MariaDB continua instalado (serviço SilSecMariaDB). Para removê-lo, use Configurações > Aplicativos,
  somente depois de guardar um backup.
#>
param(
  [string]$PastaPrograma = (Join-Path $env:ProgramFiles 'SilSec Rede Local')
)
$ErrorActionPreference = 'Stop'
$tarefa = 'SilSec Servidor'
if (Get-ScheduledTask -TaskName $tarefa -ErrorAction SilentlyContinue) {
  Stop-ScheduledTask -TaskName $tarefa -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $tarefa -Confirm:$false
  Write-Host 'Tarefa SilSec Servidor removida.'
}
Get-NetFirewallRule -DisplayName 'SilSec Rede Local (TCP *' -ErrorAction SilentlyContinue | Remove-NetFirewallRule
$atalho = Join-Path ([Environment]::GetFolderPath('CommonDesktopDirectory')) 'SilSec Rede Local.url'
if (Test-Path $atalho) { Remove-Item $atalho }
foreach ($d in @('app', 'node')) {
  $p = Join-Path $PastaPrograma $d
  if (Test-Path $p) { Remove-Item $p -Recurse -Force; Write-Host "Removido: $p" }
}
Write-Host "`nPrograma removido. Banco, estudos, configuração e backups foram mantidos em $env:ProgramData\SilSec Rede Local e no serviço SilSecMariaDB." -ForegroundColor Green
