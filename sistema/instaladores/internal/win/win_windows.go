//go:build windows

// Funções específicas do Windows: caixas de mensagem, execução sem janela, atalhos, registro de programas instalados.
package win

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"
)

var (
	user32         = syscall.NewLazyDLL("user32.dll")
	procMessageBox = user32.NewProc("MessageBoxW")
)

const (
	MbOK          = 0x0
	MbOKCancel    = 0x1
	MbYesNo       = 0x4
	MbIconError   = 0x10
	MbIconQuest   = 0x20
	MbIconInfo    = 0x40
	MbTopmost     = 0x40000
	IDOK          = 1
	IDYes         = 6
	createNoWindow = 0x08000000
)

// MessageBox mostra uma caixa de diálogo e devolve o botão escolhido.
func MessageBox(title, text string, flags uint) int {
	t, _ := syscall.UTF16PtrFromString(text)
	c, _ := syscall.UTF16PtrFromString(title)
	r, _, _ := procMessageBox.Call(0, uintptr(unsafe.Pointer(t)), uintptr(unsafe.Pointer(c)), uintptr(flags))
	return int(r)
}

// Hidden prepara um comando para rodar sem abrir janela de console.
func Hidden(cmd *exec.Cmd) *exec.Cmd {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: createNoWindow}
	return cmd
}

// RunHidden executa e espera, sem janela.
func RunHidden(name string, args ...string) error {
	return Hidden(exec.Command(name, args...)).Run()
}

// StartDetached inicia um processo independente, sem janela de console.
func StartDetached(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: createNoWindow | 0x00000008} // DETACHED_PROCESS
	return cmd.Start()
}

// FindBrowser devolve o caminho do Edge ou do Chrome instalado, ou "" se não houver.
func FindBrowser() string {
	pf86 := os.Getenv("ProgramFiles(x86)")
	pf := os.Getenv("ProgramFiles")
	local := os.Getenv("LOCALAPPDATA")
	for _, p := range []string{
		filepath.Join(pf86, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(pf, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(local, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(pf, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(pf86, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(local, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(pf, `BraveSoftware\Brave-Browser\Application\brave.exe`),
	} {
		if st, err := os.Stat(p); err == nil && !st.IsDir() {
			return p
		}
	}
	return ""
}

// OpenApp abre a URL em janela de aplicativo (sem barra de endereço); sem Edge/Chrome, usa o navegador padrão.
func OpenApp(url string) error {
	if b := FindBrowser(); b != "" {
		return StartDetached(b, "--app="+url, "--window-size=1400,900")
	}
	return StartDetached("rundll32.exe", "url.dll,FileProtocolHandler", url)
}

// Shortcut descreve um atalho .lnk.
type Shortcut struct {
	Folder      string // "Desktop" ou "Programs" (pasta do menu Iniciar), ou caminho absoluto
	Sub         string // subpasta dentro de Folder (ex.: "SilSec Engenharia")
	Name        string // nome do atalho sem .lnk
	Target      string
	Args        string
	WorkDir     string
	Icon        string
	Description string
}

func vb(s string) string { return `"` + strings.ReplaceAll(s, `"`, `""`) + `"` }

// CreateShortcuts cria os atalhos com o WScript.Shell (sem política de execução do PowerShell).
func CreateShortcuts(list []Shortcut) error {
	var sb strings.Builder
	sb.WriteString("Set ws = CreateObject(\"WScript.Shell\")\r\nSet fso = CreateObject(\"Scripting.FileSystemObject\")\r\n")
	for i, s := range list {
		dir := folderExpr(s.Folder)
		if s.Sub != "" {
			dir = dir + " & \"\\\" & " + vb(s.Sub)
		}
		sb.WriteString("d" + itoa(i) + " = " + dir + "\r\nIf Not fso.FolderExists(d" + itoa(i) + ") Then fso.CreateFolder d" + itoa(i) + "\r\n")
		sb.WriteString("Set s = ws.CreateShortcut(d" + itoa(i) + " & \"\\\" & " + vb(s.Name+".lnk") + ")\r\n")
		sb.WriteString("s.TargetPath = " + vb(s.Target) + "\r\n")
		if s.Args != "" {
			sb.WriteString("s.Arguments = " + vb(s.Args) + "\r\n")
		}
		if s.WorkDir != "" {
			sb.WriteString("s.WorkingDirectory = " + vb(s.WorkDir) + "\r\n")
		}
		if s.Icon != "" {
			sb.WriteString("s.IconLocation = " + vb(s.Icon+",0") + "\r\n")
		}
		if s.Description != "" {
			sb.WriteString("s.Description = " + vb(s.Description) + "\r\n")
		}
		sb.WriteString("s.Save\r\n")
	}
	return runVbs(sb.String())
}

// RemoveShortcuts apaga atalhos e a pasta do menu Iniciar.
func RemoveShortcuts(names []string, menuSub string) error {
	var sb strings.Builder
	sb.WriteString("Set ws = CreateObject(\"WScript.Shell\")\r\nSet fso = CreateObject(\"Scripting.FileSystemObject\")\r\nOn Error Resume Next\r\n")
	for _, n := range names {
		sb.WriteString("fso.DeleteFile ws.SpecialFolders(\"Desktop\") & \"\\\" & " + vb(n+".lnk") + ", True\r\n")
	}
	if menuSub != "" {
		sb.WriteString("fso.DeleteFolder ws.SpecialFolders(\"Programs\") & \"\\\" & " + vb(menuSub) + ", True\r\n")
	}
	return runVbs(sb.String())
}

func folderExpr(f string) string {
	switch f {
	case "Desktop", "Programs", "StartMenu":
		return "ws.SpecialFolders(\"" + f + "\")"
	}
	return vb(f)
}

func runVbs(script string) error {
	tmp := filepath.Join(os.TempDir(), "silsec-atalhos.vbs")
	if err := os.WriteFile(tmp, []byte(script), 0o644); err != nil {
		return err
	}
	defer os.Remove(tmp)
	return RunHidden("cscript.exe", "//nologo", "//B", tmp)
}

// RegisterUninstall cadastra o programa em Configurações → Aplicativos (só para o usuário atual, sem administrador).
func RegisterUninstall(key, name, version, publisher, dir, icon, uninstall string, sizeKB int) error {
	k := `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\` + key
	vals := [][]string{
		{"DisplayName", "REG_SZ", name}, {"DisplayVersion", "REG_SZ", version}, {"Publisher", "REG_SZ", publisher},
		{"InstallLocation", "REG_SZ", dir}, {"DisplayIcon", "REG_SZ", icon}, {"UninstallString", "REG_SZ", uninstall},
		{"NoModify", "REG_DWORD", "1"}, {"NoRepair", "REG_DWORD", "1"}, {"EstimatedSize", "REG_DWORD", itoa(sizeKB)},
	}
	for _, v := range vals {
		if err := RunHidden("reg.exe", "add", k, "/v", v[0], "/t", v[1], "/d", v[2], "/f"); err != nil {
			return err
		}
	}
	return nil
}

// UnregisterUninstall remove o cadastro em Aplicativos.
func UnregisterUninstall(key string) {
	_ = RunHidden("reg.exe", "delete", `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\`+key, "/f")
}

// SelfDeleteDir apaga a pasta do programa depois que este processo terminar.
func SelfDeleteDir(dir string) {
	_ = StartDetached("cmd.exe", "/c", "ping 127.0.0.1 -n 3 >nul & rmdir /s /q \""+dir+"\"")
}

// KillProcess encerra um programa pelo nome do executável (ignora erro se não estiver rodando).
func KillProcess(exe string) { _ = RunHidden("taskkill.exe", "/IM", exe, "/F") }

func itoa(i int) string {
	if i == 0 {
		return "0"
	}
	neg := i < 0
	if neg {
		i = -i
	}
	var b []byte
	for i > 0 {
		b = append([]byte{byte('0' + i%10)}, b...)
		i /= 10
	}
	if neg {
		b = append([]byte{'-'}, b...)
	}
	return string(b)
}
