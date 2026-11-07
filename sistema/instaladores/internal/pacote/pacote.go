// Funções comuns dos instaladores: extração de zip, versão, caminhos.
package pacote

import (
	"archive/zip"
	"bytes"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const (
	Version   = "9.3.0"
	Publisher = "SilSec Engenharia"
	Site      = "https://silsec-engenharia.com.br"
)

// Extract descompacta um zip em memória para dir, protegendo contra caminhos fora da pasta.
// skip devolve true para entradas que não devem ser gravadas.
func Extract(data []byte, dir string, skip func(name string) bool) (int, error) {
	r, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return 0, err
	}
	abs, err := filepath.Abs(dir)
	if err != nil {
		return 0, err
	}
	n := 0
	for _, f := range r.File {
		name := filepath.FromSlash(f.Name)
		if skip != nil && skip(f.Name) {
			continue
		}
		target := filepath.Join(abs, name)
		if target != abs && !strings.HasPrefix(target, abs+string(os.PathSeparator)) {
			return n, errors.New("caminho inválido no pacote: " + f.Name)
		}
		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(target, 0o755); err != nil {
				return n, err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return n, err
		}
		rc, err := f.Open()
		if err != nil {
			return n, err
		}
		out, err := os.OpenFile(target, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
		if err != nil {
			rc.Close()
			return n, err
		}
		_, err = io.Copy(out, rc)
		rc.Close()
		out.Close()
		if err != nil {
			return n, err
		}
		n++
	}
	return n, nil
}

// ProgramsDir devolve a pasta de programas do usuário (sem precisar de administrador).
func ProgramsDir(name string) string {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		home, _ := os.UserHomeDir()
		base = filepath.Join(home, "AppData", "Local")
	}
	return filepath.Join(base, "Programs", name)
}

// DirSizeKB soma o tamanho dos arquivos de uma pasta, em KB.
func DirSizeKB(dir string) int {
	var total int64
	_ = filepath.Walk(dir, func(_ string, info os.FileInfo, err error) error {
		if err == nil && !info.IsDir() {
			total += info.Size()
		}
		return nil
	})
	return int(total / 1024)
}
