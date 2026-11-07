//go:build windows

// SilSec Offline.exe · versão para computador sem internet. Inicia o servidor local (Node.js) sem janela de console
// e abre o programa em janela própria. Os estudos ficam em %APPDATA%\SilSec, só neste computador.
//   "SilSec Offline.exe"                 abre o programa
//   "SilSec Offline.exe" --desinstalar
package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"silsec/instaladores/internal/win"
)

const (
	appName = "SilSec Offline"
	regKey  = "SilSecOffline"
	menuSub = "SilSec Offline"
)

// NodeOK confere se o executável é um Node.js 22.13 ou mais novo.
func nodeOK(exe string) bool {
	out, err := win.Hidden(exec.Command(exe, "-v")).Output()
	if err != nil {
		return false
	}
	p := strings.Split(strings.TrimPrefix(strings.TrimSpace(string(out)), "v"), ".")
	if len(p) < 2 {
		return false
	}
	maj, _ := strconv.Atoi(p[0])
	min, _ := strconv.Atoi(p[1])
	return maj > 22 || (maj == 22 && min >= 13)
}

func findNode(dir string) string {
	if p := filepath.Join(dir, "runtime", "node.exe"); nodeOK(p) {
		return p
	}
	if p, err := exec.LookPath("node"); err == nil && nodeOK(p) {
		return p
	}
	return ""
}

func main() {
	exe, _ := os.Executable()
	dir := filepath.Dir(exe)
	if len(os.Args) > 1 && os.Args[1] == "--desinstalar" {
		uninstall(dir)
		return
	}
	node := findNode(dir)
	if node == "" {
		win.MessageBox(appName, "O Node.js não foi encontrado. Rode o instalador do SilSec Offline novamente.", win.MbOK|win.MbIconError)
		os.Exit(1)
	}
	cmd := win.Hidden(exec.Command(node, "desktop.mjs"))
	cmd.Dir = dir
	cmd.Env = append(os.Environ(), "SILSEC_IDLE_EXIT=300")
	log, _ := os.OpenFile(filepath.Join(dir, "silsec.log"), os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if log != nil {
		cmd.Stdout, cmd.Stderr = log, log
	}
	if err := cmd.Start(); err != nil {
		win.MessageBox(appName, "Não foi possível iniciar o SilSec.\n\n"+err.Error(), win.MbOK|win.MbIconError)
		os.Exit(1)
	}
	// Espera o servidor; ele abre a janela do programa sozinho e encerra quando a janela é fechada.
	_ = cmd.Wait()
}

func uninstall(dir string) {
	if win.MessageBox(appName, "Remover o SilSec Offline deste computador?\n\nOs estudos salvos ficam na pasta %APPDATA%\\SilSec e não são apagados.", win.MbYesNo|win.MbIconQuest) != win.IDYes {
		return
	}
	_ = win.RemoveShortcuts([]string{appName}, menuSub)
	win.UnregisterUninstall(regKey)
	win.SelfDeleteDir(dir)
	win.MessageBox(appName, "SilSec Offline removido.", win.MbOK|win.MbIconInfo)
}
