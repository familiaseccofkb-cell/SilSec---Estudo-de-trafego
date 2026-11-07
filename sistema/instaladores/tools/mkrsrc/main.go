// mkrsrc gera um objeto COFF (.syso) com ícone e manifesto para o executável Windows.
// Uso: go run ./tools/mkrsrc -ico recursos/silsec.ico -manifest recursos/app.manifest -o cmd/x/rsrc_windows_amd64.syso
package main

import (
	"bytes"
	"encoding/binary"
	"flag"
	"fmt"
	"os"
)

const (
	rtIcon      = 3
	rtGroupIcon = 14
	rtManifest  = 24
	lang        = 0x0409
)

type res struct {
	typ, id uint32
	data    []byte
}

func main() {
	ico := flag.String("ico", "", "arquivo .ico")
	man := flag.String("manifest", "", "arquivo .manifest")
	out := flag.String("o", "rsrc_windows_amd64.syso", "saída")
	flag.Parse()
	var list []res
	if *ico != "" {
		b, err := os.ReadFile(*ico)
		must(err)
		count := int(binary.LittleEndian.Uint16(b[4:6]))
		group := new(bytes.Buffer)
		group.Write(b[0:6])
		for i := 0; i < count; i++ {
			e := b[6+16*i : 6+16*(i+1)]
			size := binary.LittleEndian.Uint32(e[8:12])
			off := binary.LittleEndian.Uint32(e[12:16])
			list = append(list, res{rtIcon, uint32(i + 1), b[off : off+size]})
			group.Write(e[0:12])
			binary.Write(group, binary.LittleEndian, uint16(i+1))
		}
		list = append(list, res{rtGroupIcon, 1, group.Bytes()})
	}
	if *man != "" {
		b, err := os.ReadFile(*man)
		must(err)
		list = append(list, res{rtManifest, 1, b})
	}
	must(os.WriteFile(*out, build(list), 0o644))
	fmt.Println("gerado", *out, "com", len(list), "recursos")
}

// Estrutura da seção .rsrc: diretório raiz (por tipo) → diretório por id → diretório por idioma → entrada de dados → dados.
func build(list []res) []byte {
	types := []uint32{}
	byType := map[uint32][]res{}
	for _, r := range list {
		if _, ok := byType[r.typ]; !ok {
			types = append(types, r.typ)
		}
		byType[r.typ] = append(byType[r.typ], r)
	}
	for i := range types { // ordena tipos
		for j := i + 1; j < len(types); j++ {
			if types[j] < types[i] {
				types[i], types[j] = types[j], types[i]
			}
		}
	}
	const dirHdr, entry, dataEntry = 16, 8, 16
	// tamanhos: raiz + diretórios de tipo + diretórios de id (um por recurso) + entradas de dados
	rootSize := dirHdr + entry*len(types)
	typeDirSize := 0
	for _, t := range types {
		typeDirSize += dirHdr + entry*len(byType[t])
	}
	idDirSize := (dirHdr + entry) * len(list)
	dataEntriesOff := rootSize + typeDirSize + idDirSize
	dataOff := dataEntriesOff + dataEntry*len(list)
	dataOff = (dataOff + 7) &^ 7

	sec := new(bytes.Buffer)
	w16 := func(v uint16) { binary.Write(sec, binary.LittleEndian, v) }
	w32 := func(v uint32) { binary.Write(sec, binary.LittleEndian, v) }
	dir := func(n int) { w32(0); w32(0); w16(0); w16(0); w16(0); w16(uint16(n)) }
	// raiz
	dir(len(types))
	off := rootSize
	typeOffsets := map[uint32]int{}
	for _, t := range types {
		typeOffsets[t] = off
		w32(t)
		w32(uint32(off) | 0x80000000)
		off += dirHdr + entry*len(byType[t])
	}
	// diretórios por tipo → id
	idDirOff := rootSize + typeDirSize
	k := 0
	idDirOffsets := make([]int, len(list))
	order := []res{}
	for _, t := range types {
		dir(len(byType[t]))
		for _, r := range byType[t] {
			idDirOffsets[k] = idDirOff + (dirHdr+entry)*k
			w32(r.id)
			w32(uint32(idDirOffsets[k]) | 0x80000000)
			order = append(order, r)
			k++
		}
	}
	// diretórios por id → idioma → entrada de dados
	for i := range order {
		dir(1)
		w32(lang)
		w32(uint32(dataEntriesOff + dataEntry*i))
	}
	// entradas de dados (o campo de endereço recebe relocação)
	var relocs []uint32
	cur := dataOff
	for i, r := range order {
		relocs = append(relocs, uint32(dataEntriesOff+dataEntry*i))
		w32(uint32(cur)) // RVA, corrigido pela relocação ADDR32NB
		w32(uint32(len(r.data)))
		w32(0)
		w32(0)
		cur += (len(r.data) + 7) &^ 7
	}
	for sec.Len() < dataOff {
		sec.WriteByte(0)
	}
	for _, r := range order {
		sec.Write(r.data)
		for sec.Len()%8 != 0 {
			sec.WriteByte(0)
		}
	}
	raw := sec.Bytes()

	// Arquivo COFF: cabeçalho, 1 seção, dados, relocações, tabela de símbolos, tabela de strings.
	out := new(bytes.Buffer)
	o16 := func(v uint16) { binary.Write(out, binary.LittleEndian, v) }
	o32 := func(v uint32) { binary.Write(out, binary.LittleEndian, v) }
	const fileHdr, secHdr, relocSize, symSize = 20, 40, 10, 18
	rawOff := fileHdr + secHdr
	relocOff := rawOff + len(raw)
	symOff := relocOff + relocSize*len(relocs)
	o16(0x8664) // AMD64
	o16(1)
	o32(0)
	o32(uint32(symOff))
	o32(1)
	o16(0)
	o16(0)
	out.Write([]byte(".rsrc\x00\x00\x00"))
	o32(0)
	o32(0)
	o32(uint32(len(raw)))
	o32(uint32(rawOff))
	o32(uint32(relocOff))
	o32(0)
	o16(uint16(len(relocs)))
	o16(0)
	o32(0x40000040) // dados inicializados, leitura
	out.Write(raw)
	for _, r := range relocs {
		o32(r)
		o32(0)      // símbolo 0 (.rsrc)
		o16(0x0003) // IMAGE_REL_AMD64_ADDR32NB
	}
	out.Write([]byte(".rsrc\x00\x00\x00"))
	o32(0)
	o16(1) // seção 1
	o16(0)
	out.WriteByte(3) // IMAGE_SYM_CLASS_STATIC
	out.WriteByte(0)
	o32(4) // tabela de strings vazia
	return out.Bytes()
}

func must(err error) {
	if err != nil {
		fmt.Fprintln(os.Stderr, "erro:", err)
		os.Exit(1)
	}
}
