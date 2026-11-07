//go:build windows

// Instalador do SilSec Offline (versão sem internet) para Windows. Programa de console: mostra o andamento.
// Copia o programa, baixa o Node.js portátil de nodejs.org se o computador não tiver, cria atalhos e registra em Aplicativos.
package main

import (
	"bufio"
	_ "embed"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"silsec/instaladores/internal/pacote"
	"silsec/instaladores/internal/win"
)

//go:embed app.zip
var appZip []byte

//go:embed SilSec-Offline.exe
var launcher []byte

//go:embed silsec.ico
var icon []byte

const (
	appName = "SilSec Offline"
	regKey  = "SilSecOffline"
	menuSub = "SilSec Offline"
)

func pause() {
	fmt.Print("\nPressione Enter para fechar.")
	bufio.NewReader(os.Stdin).ReadString('\n')
}

func fail(msg string, err error) {
	fmt.Println("\nERRO:", msg)
	if err != nil {
		fmt.Println(err)
	}
	pause()
	os.Exit(1)
}

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

type release struct {
	Version string   `json:"version"`
	LTS     any      `json:"lts"`
	Files   []string `json:"files"`
}

func downloadNode(dir string) error {
	client := &http.Client{Timeout: 10 * time.Minute}
	fmt.Println("      Consultando as versões em nodejs.org...")
	resp, err := client.Get("https://nodejs.org/dist/index.json")
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	var list []release
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return err
	}
	var pick string
	for _, r := range list {
		if lts, ok := r.LTS.(string); !ok || lts == "" {
			continue
		}
		maj, _ := strconv.Atoi(strings.Split(strings.TrimPrefix(r.Version, "v"), ".")[0])
		if maj < 22 {
			continue
		}
		for _, f := range r.Files {
			if f == "win-x64-zip" {
				pick = r.Version
				break
			}
		}
		if pick != "" {
			break
		}
	}
	if pick == "" {
		return fmt.Errorf("nenhuma versão LTS do Node.js encontrada para Windows")
	}
	url := "https://nodejs.org/dist/" + pick + "/node-" + pick + "-win-x64.zip"
	fmt.Println("      Baixando", url)
	resp2, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp2.Body.Close()
	if resp2.StatusCode != 200 {
		return fmt.Errorf("resposta %s", resp2.Status)
	}
	buf := new(strings.Builder)
	var data []byte
	total := resp2.ContentLength
	chunk := make([]byte, 256*1024)
	last := time.Now()
	for {
		n, err := resp2.Body.Read(chunk)
		data = append(data, chunk[:n]...)
		if time.Since(last) > 500*time.Millisecond || err == io.EOF {
			if total > 0 {
				fmt.Printf("\r      %d%% (%d de %d MB)   ", len(data)*100/int(total), len(data)>>20, total>>20)
			} else {
				fmt.Printf("\r      %d MB   ", len(data)>>20)
			}
			last = time.Now()
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
	}
	_ = buf
	fmt.Println()
	tmp := filepath.Join(dir, "runtime-novo")
	os.RemoveAll(tmp)
	if _, err := pacote.Extract(data, tmp, nil); err != nil {
		return err
	}
	entries, _ := os.ReadDir(tmp)
	if len(entries) != 1 || !entries[0].IsDir() {
		return fmt.Errorf("pacote do Node.js inesperado")
	}
	runtime := filepath.Join(dir, "runtime")
	os.RemoveAll(runtime)
	if err := os.Rename(filepath.Join(tmp, entries[0].Name()), runtime); err != nil {
		return err
	}
	os.RemoveAll(tmp)
	return nil
}

func main() {
	dir := pacote.ProgramsDir("SilSec Offline")
	data := filepath.Join(os.Getenv("APPDATA"), "SilSec")
	fmt.Println()
	fmt.Println("SilSec Engenharia · instalação da versão para computador (sem internet)")
	fmt.Println("Programa:", dir)
	fmt.Println("Dados:   ", data, "(seus estudos ficam aqui e não são apagados ao reinstalar)")
	fmt.Println()
	fmt.Print("Instalar? [S/n] ")
	ans, _ := bufio.NewReader(os.Stdin).ReadString('\n')
	if a := strings.ToLower(strings.TrimSpace(ans)); a == "n" || a == "nao" || a == "não" {
		return
	}
	win.KillProcess("SilSec-Offline.exe")
	// 1. programa (mantém a pasta runtime de uma instalação anterior)
	for _, sub := range []string{"server", "public", "db", "scripts"} {
		os.RemoveAll(filepath.Join(dir, sub))
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		fail("Não foi possível criar a pasta do programa.", err)
	}
	if _, err := pacote.Extract(appZip, dir, nil); err != nil {
		fail("Não foi possível copiar o programa. Feche o SilSec se estiver aberto.", err)
	}
	exe := filepath.Join(dir, "SilSec-Offline.exe")
	if err := os.WriteFile(exe, launcher, 0o755); err != nil {
		fail("Não foi possível gravar o programa.", err)
	}
	ico := filepath.Join(dir, "silsec.ico")
	_ = os.WriteFile(ico, icon, 0o644)
	fmt.Println("[1/3] Programa copiado.")
	// 2. Node.js
	node := ""
	if p := filepath.Join(dir, "runtime", "node.exe"); nodeOK(p) {
		node = p
	} else if p, err := exec.LookPath("node"); err == nil && nodeOK(p) {
		node = p
	} else {
		fmt.Println("      O Node.js 22 não foi encontrado: baixando uma cópia portátil (cerca de 30 MB).")
		if err := downloadNode(dir); err != nil {
			fail("Não foi possível baixar o Node.js. Verifique a internet ou instale o Node.js LTS em nodejs.org e rode de novo.", err)
		}
		node = filepath.Join(dir, "runtime", "node.exe")
	}
	fmt.Println("[2/3] Node.js pronto:", node)
	// 3. atalhos e registro
	shortcuts := []win.Shortcut{
		{Folder: "Desktop", Name: appName, Target: exe, WorkDir: dir, Icon: ico, Description: "SilSec Engenharia · versão para computador"},
		{Folder: "Programs", Sub: menuSub, Name: appName, Target: exe, WorkDir: dir, Icon: ico, Description: "SilSec Engenharia · versão para computador"},
		{Folder: "Programs", Sub: menuSub, Name: "Desinstalar SilSec Offline", Target: exe, Args: "--desinstalar", WorkDir: dir, Icon: ico},
	}
	if err := win.CreateShortcuts(shortcuts); err != nil {
		fail("Não foi possível criar os atalhos.", err)
	}
	_ = win.RegisterUninstall(regKey, appName, pacote.Version, pacote.Publisher, dir, ico, "\""+exe+"\" --desinstalar", pacote.DirSizeKB(dir))
	fmt.Println("[3/3] Atalhos criados na Área de Trabalho e no menu Iniciar.")
	fmt.Println()
	fmt.Println("Instalação concluída. Abrindo o SilSec...")
	_ = win.StartDetached(exe)
	time.Sleep(2 * time.Second)
}
