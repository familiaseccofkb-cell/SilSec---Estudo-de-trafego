<#
  SilSec Engenharia · situação da versão para rede local neste computador (só leitura; não altera nada).
#>
param([int]$Porta = 3980)
$linha = { param($nome, $ok, $detalhe) Write-Host ("{0,-28} {1,-6} {2}" -f $nome, $(if ($ok) { 'OK' } else { 'FALHA' }), $detalhe) -ForegroundColor $(if ($ok) { 'Green' } else { 'Red' }) }
$svc = Get-Service SilSecMariaDB -ErrorAction SilentlyContinue
& $linha 'Banco (SilSecMariaDB)' ($svc.Status -eq 'Running') "$($svc.Status) · início $($svc.StartType)"
$t = Get-ScheduledTask -TaskName 'SilSec Servidor' -ErrorAction SilentlyContinue
& $linha 'Tarefa SilSec Servidor' ($t.State -eq 'Running') "$($t.State)"
try { $s = Invoke-RestMethod "http://127.0.0.1:$Porta/saude" -TimeoutSec 3; & $linha 'Programa' $s.ok "versão $($s.versao) · banco $($s.banco)" } catch { & $linha 'Programa' $false $_.Exception.Message }
$r = Get-NetFirewallRule -DisplayName "SilSec Rede Local (TCP $Porta)" -ErrorAction SilentlyContinue
& $linha 'Firewall (rede privada)' ([bool]$r -and $r.Profile -eq 'Private') "$($r.Profile)"
$perfil = (Get-NetConnectionProfile | Select-Object -ExpandProperty NetworkCategory) -join ', '
& $linha 'Tipo de rede' ($perfil -match 'Private|DomainAuthenticated') $perfil
$escuta = Get-NetTCPConnection -LocalPort 3306, 3307 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalAddress -Unique
& $linha 'Banco só neste PC' (-not ($escuta | Where-Object { $_ -notin '127.0.0.1', '::1' })) ($escuta -join ', ')
Write-Host "`nEndereço para os outros computadores: http://$($env:COMPUTERNAME):$Porta/sistema"
