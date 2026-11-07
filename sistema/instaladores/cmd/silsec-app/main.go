//go:build windows

// SilSec.exe · aplicativo conectado para Windows. Abre o SilSec em janela própria usando o Edge ou o Chrome.
// Todos os dados ficam no banco do site silsec-engenharia.com.br.
//   SilSec.exe              abre o programa (/sistema)
//   SilSec.exe vistorias    abre as vistorias
//   SilSec.exe console      abre o console do desenvolvedor
//   SilSec.exe --desinstalar
package main

import (
	"os"
	"path/filepath"

	"silsec/instaladores/internal/pacote"
	"silsec/instaladores/internal/win"
)

const (
	appName = "SilSec Engenharia"
	regKey  = "SilSecEngenharia"
	menuSub = "SilSec Engenharia"
)

func main() {
	mode := ""
	if len(os.Args) > 1 {
		mode = os.Args[1]
	}
	url := pacote.Site + "/sistema?origem=app"
	switch mode {
	case "--desinstalar":
		uninstall()
		return
	case "vistorias":
		url = pacote.Site + "/vistorias"
	case "console":
		url = pacote.Site + "/admin"
	}
	if err := win.OpenApp(url); err != nil {
		win.MessageBox(appName, "Não foi possível abrir o navegador.\n\nAbra "+url+" no Edge ou no Chrome.\n\n"+err.Error(), win.MbOK|win.MbIconError)
	}
}

func uninstall() {
	if win.MessageBox(appName, "Remover o SilSec deste computador?\n\nSeus estudos continuam salvos no site "+pacote.Site+".", win.MbYesNo|win.MbIconQuest) != win.IDYes {
		return
	}
	exe, _ := os.Executable()
	dir := filepath.Dir(exe)
	_ = win.RemoveShortcuts([]string{appName, "SilSec Vistorias", "SilSec Console"}, menuSub)
	win.UnregisterUninstall(regKey)
	win.SelfDeleteDir(dir)
	win.MessageBox(appName, "SilSec removido. Seus dados continuam no site.", win.MbOK|win.MbIconInfo)
}
