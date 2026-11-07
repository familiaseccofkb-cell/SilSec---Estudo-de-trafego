//go:build windows

// Instalador do SilSec (aplicativo conectado) para Windows. Não precisa de administrador.
// Se o nome do arquivo contiver "desenvolvedor", cria também o atalho do console de gerenciamento.
package main

import (
	_ "embed"
	"os"
	"path/filepath"
	"strings"

	"silsec/instaladores/internal/pacote"
	"silsec/instaladores/internal/win"
)

//go:embed SilSec.exe
var launcher []byte

//go:embed silsec.ico
var icon []byte

const (
	appName = "SilSec Engenharia"
	regKey  = "SilSecEngenharia"
	menuSub = "SilSec Engenharia"
)

func fail(msg string, err error) {
	win.MessageBox(appName+" · instalação", msg+"\n\n"+err.Error(), win.MbOK|win.MbIconError)
	os.Exit(1)
}

func main() {
	self, _ := os.Executable()
	developer := strings.Contains(strings.ToLower(filepath.Base(self)), "desenvolvedor")
	dir := pacote.ProgramsDir("SilSec")
	text := "Instalar o SilSec Engenharia neste computador?\n\nO programa abre em janela própria e usa os mesmos dados do site " + pacote.Site + " (computador, celular e navegador sempre iguais).\n\nPasta: " + dir
	if developer {
		text += "\n\nVersão do desenvolvedor: inclui o atalho do console de gerenciamento."
	}
	if win.MessageBox(appName+" · instalação", text, win.MbOKCancel|win.MbIconQuest|win.MbTopmost) != win.IDOK {
		return
	}
	win.KillProcess("SilSec.exe")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		fail("Não foi possível criar a pasta do programa.", err)
	}
	exe := filepath.Join(dir, "SilSec.exe")
	if err := os.WriteFile(exe, launcher, 0o755); err != nil {
		fail("Não foi possível gravar o programa. Feche o SilSec se ele estiver aberto e tente de novo.", err)
	}
	ico := filepath.Join(dir, "silsec.ico")
	if err := os.WriteFile(ico, icon, 0o644); err != nil {
		fail("Não foi possível gravar o ícone.", err)
	}
	shortcuts := []win.Shortcut{
		{Folder: "Desktop", Name: appName, Target: exe, WorkDir: dir, Icon: ico, Description: "SilSec Engenharia · estudo de tráfego de elevadores"},
		{Folder: "Programs", Sub: menuSub, Name: appName, Target: exe, WorkDir: dir, Icon: ico, Description: "SilSec Engenharia · estudo de tráfego de elevadores"},
		{Folder: "Programs", Sub: menuSub, Name: "SilSec Vistorias", Target: exe, Args: "vistorias", WorkDir: dir, Icon: ico, Description: "SilSec · vistorias guiadas"},
		{Folder: "Programs", Sub: menuSub, Name: "Desinstalar SilSec", Target: exe, Args: "--desinstalar", WorkDir: dir, Icon: ico, Description: "Remove o SilSec deste computador"},
	}
	if developer {
		shortcuts = append(shortcuts,
			win.Shortcut{Folder: "Desktop", Name: "SilSec Console", Target: exe, Args: "console", WorkDir: dir, Icon: ico, Description: "SilSec · console do desenvolvedor"},
			win.Shortcut{Folder: "Programs", Sub: menuSub, Name: "SilSec Console", Target: exe, Args: "console", WorkDir: dir, Icon: ico, Description: "SilSec · console do desenvolvedor"})
	}
	if err := win.CreateShortcuts(shortcuts); err != nil {
		fail("Não foi possível criar os atalhos.", err)
	}
	_ = win.RegisterUninstall(regKey, appName, pacote.Version, pacote.Publisher, dir, ico, "\""+exe+"\" --desinstalar", pacote.DirSizeKB(dir))
	win.MessageBox(appName+" · instalação", "SilSec instalado.\n\nAtalhos criados na Área de Trabalho e no menu Iniciar. O programa vai abrir agora; entre com seu e-mail e senha do site.", win.MbOK|win.MbIconInfo|win.MbTopmost)
	_ = win.StartDetached(exe)
}
