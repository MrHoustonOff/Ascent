//go:build !windows

// Веб-версия для macOS и Linux: тот же Ascent, но вместо окна Wails — вкладка браузера.
// Интерфейс встроен в бинарник (исходники frontend/ без сборки npm), данные — в папке настроек пользователя:
// macOS — ~/Library/Application Support/Ascent, Linux — ~/.config/Ascent.
// Сборка: go build -o Ascent .   Запуск: ./Ascent   (откроется браузер на http://127.0.0.1:8765)
package main

import (
	"embed"
	"encoding/json"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"reflect"
	"runtime"
	"strings"
	"syscall"
	"time"

	"ascent/internal/app"
	"ascent/internal/logx"
)

//go:embed frontend/index.html frontend/src
var webFS embed.FS

// host: буфер обмена ставит сам браузер, папку выбирает системный диалог macOS.
type host struct{}

func (host) ClipboardSet(string) error { return nil }
func (host) OpenURL(u string)          { openBrowser(u) }
func (host) PickDir(title string) (string, error) {
	if runtime.GOOS != "darwin" {
		return "", fmt.Errorf("выбор папки доступен только на macOS")
	}
	out, err := exec.Command("osascript", "-e", fmt.Sprintf(`POSIX path of (choose folder with prompt %q)`, title)).Output()
	if err != nil {
		return "", nil // отмена диалога
	}
	return strings.TrimSpace(string(out)), nil
}

func openBrowser(u string) {
	switch runtime.GOOS {
	case "darwin":
		_ = exec.Command("open", u).Start()
	default:
		_ = exec.Command("xdg-open", u).Start()
	}
}

func main() {
	addr := flag.String("addr", "127.0.0.1:8765", "адрес сервера")
	noOpen := flag.Bool("no-open", false, "не открывать браузер")
	dataFlag := flag.String("data", "", "папка данных (по умолчанию — папка настроек пользователя/Ascent)")
	flag.Parse()

	dir := *dataFlag
	if dir == "" {
		cfg, err := os.UserConfigDir()
		if err != nil {
			cfg = "."
		}
		dir = filepath.Join(cfg, "Ascent")
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		log.Fatal(err)
	}
	lg, _ := logx.Open(filepath.Join(dir, "logs"))
	defer lg.Close()

	a, err := app.New(dir, host{}, time.Now, time.Local)
	if err != nil {
		log.Fatalf("запуск: %v", err)
	}
	app.SetLogger(a, lg.Printf)

	front, _ := fs.Sub(webFS, "frontend")
	mux := http.NewServeMux()
	mux.HandleFunc("/rpc/", func(w http.ResponseWriter, r *http.Request) { rpc(a, w, r) })
	mux.Handle("/", http.FileServer(http.FS(front)))

	ln, err := net.Listen("tcp", *addr)
	if err != nil { // порт занят — берём свободный
		ln, err = net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			log.Fatal(err)
		}
	}
	url := "http://" + ln.Addr().String() + "/"
	fmt.Printf("Ascent: %s\nДанные: %s\nОстановить: Ctrl+C\n", url, dir)
	if !*noOpen {
		openBrowser(url)
	}

	go func() { _ = http.Serve(ln, mux) }()
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop
	_ = app.Shutdown(a) // база закрывается аккуратно
}

// rpc: POST /rpc/<Метод> с JSON-массивом аргументов → {"result": …} или {"error": …}.
func rpc(a *app.App, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	reply := func(code int, v map[string]any) { w.WriteHeader(code); _ = json.NewEncoder(w).Encode(v) }
	if r.Method != http.MethodPost {
		reply(405, map[string]any{"error": "нужен POST"})
		return
	}
	m := reflect.ValueOf(a).MethodByName(strings.TrimPrefix(r.URL.Path, "/rpc/"))
	if !m.IsValid() {
		reply(404, map[string]any{"error": "нет такого метода"})
		return
	}
	var raw []json.RawMessage
	_ = json.NewDecoder(r.Body).Decode(&raw)
	mt := m.Type()
	if len(raw) != mt.NumIn() {
		reply(400, map[string]any{"error": fmt.Sprintf("нужно аргументов: %d", mt.NumIn())})
		return
	}
	args := make([]reflect.Value, len(raw))
	for i := range raw {
		p := reflect.New(mt.In(i))
		if err := json.Unmarshal(raw[i], p.Interface()); err != nil {
			reply(400, map[string]any{"error": err.Error()})
			return
		}
		args[i] = p.Elem()
	}
	outs := m.Call(args)
	var res any
	for _, o := range outs {
		if e, ok := o.Interface().(error); ok && e != nil {
			reply(200, map[string]any{"error": e.Error()})
			return
		}
	}
	if len(outs) > 1 || (len(outs) == 1 && !outs[0].Type().Implements(reflect.TypeOf((*error)(nil)).Elem())) {
		res = outs[0].Interface()
	}
	reply(200, map[string]any{"result": res})
}
