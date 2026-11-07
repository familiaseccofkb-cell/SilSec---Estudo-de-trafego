package pacote

import (
	"archive/zip"
	"bytes"
	"os"
	"path/filepath"
	"testing"
)

func TestExtract(t *testing.T) {
	buf := new(bytes.Buffer)
	w := zip.NewWriter(buf)
	for name, body := range map[string]string{"app/a.txt": "a", "app/sub/b.txt": "bb", "runtime/node.exe": "x"} {
		f, _ := w.Create(name)
		f.Write([]byte(body))
	}
	w.Close()
	dir := t.TempDir()
	n, err := Extract(buf.Bytes(), dir, func(name string) bool { return len(name) > 8 && name[:8] == "runtime/" })
	if err != nil || n != 2 {
		t.Fatal(n, err)
	}
	if b, _ := os.ReadFile(filepath.Join(dir, "app", "sub", "b.txt")); string(b) != "bb" {
		t.Fatal("conteúdo")
	}
	if _, err := os.Stat(filepath.Join(dir, "runtime")); err == nil {
		t.Fatal("runtime não deveria ser extraído")
	}
	// caminho malicioso
	buf.Reset()
	w = zip.NewWriter(buf)
	f, _ := w.Create("../fora.txt")
	f.Write([]byte("x"))
	w.Close()
	if _, err := Extract(buf.Bytes(), dir, nil); err == nil {
		t.Fatal("deveria recusar ../")
	}
}
