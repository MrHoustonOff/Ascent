// devserver — HTTP-мост к методам App для разработки и скриншотов без Wails.
// Отдаёт папку frontend/ и принимает POST /rpc/<Метод> с JSON-массивом аргументов.
// В сборку .exe не входит.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"reflect"
	"strings"
	"sync"
	"time"

	"ascent/internal/app"
)

type host struct {
	mu   sync.Mutex
	clip string
	dir  string
}

func (h *host) ClipboardSet(t string) error { h.mu.Lock(); h.clip = t; h.mu.Unlock(); return nil }
func (h *host) OpenURL(u string)            { log.Println("open url:", u) }
func (h *host) PickDir(string) (string, error) {
	if h.dir == "" {
		return "", fmt.Errorf("диалог недоступен в браузере")
	}
	return h.dir, nil
}

func main() {
	addr := flag.String("addr", "127.0.0.1:8765", "адрес")
	data := flag.String("data", "", "папка данных")
	front := flag.String("front", "frontend", "папка фронтенда")
	nowS := flag.String("now", "", "зафиксировать время (RFC3339)")
	tz := flag.String("tz", "Europe/Moscow", "часовой пояс")
	flag.Parse()
	if *data == "" {
		d, _ := os.MkdirTemp("", "ascent-dev")
		*data = d
	}
	loc, err := time.LoadLocation(*tz)
	if err != nil {
		loc = time.FixedZone("MSK", 3*3600)
	}
	now := time.Now
	if *nowS != "" {
		t, err := time.Parse(time.RFC3339, *nowS)
		if err != nil {
			log.Fatal(err)
		}
		start, real := t, time.Now()
		now = func() time.Time { return start.Add(time.Since(real)) }
	}
	h := &host{dir: os.Getenv("ASCENT_PICK_DIR")}
	a, err := app.New(*data, h, now, loc)
	if err != nil {
		log.Fatal(err)
	}
	defer app.Shutdown(a)

	mux := http.NewServeMux()
	mux.HandleFunc("/rpc/", func(w http.ResponseWriter, r *http.Request) {
		name := strings.TrimPrefix(r.URL.Path, "/rpc/")
		w.Header().Set("Content-Type", "application/json")
		if name == "_clip" {
			h.mu.Lock()
			json.NewEncoder(w).Encode(map[string]any{"result": h.clip})
			h.mu.Unlock()
			return
		}
		m := reflect.ValueOf(a).MethodByName(name)
		if !m.IsValid() {
			w.WriteHeader(404)
			json.NewEncoder(w).Encode(map[string]any{"error": "нет метода " + name})
			return
		}
		var raw []json.RawMessage
		_ = json.NewDecoder(r.Body).Decode(&raw)
		mt := m.Type()
		if len(raw) != mt.NumIn() {
			w.WriteHeader(400)
			json.NewEncoder(w).Encode(map[string]any{"error": fmt.Sprintf("%s: нужно аргументов %d", name, mt.NumIn())})
			return
		}
		args := make([]reflect.Value, mt.NumIn())
		for i := range args {
			p := reflect.New(mt.In(i))
			if err := json.Unmarshal(raw[i], p.Interface()); err != nil {
				w.WriteHeader(400)
				json.NewEncoder(w).Encode(map[string]any{"error": err.Error()})
				return
			}
			args[i] = p.Elem()
		}
		outs := m.Call(args)
		var res any
		for _, o := range outs {
			if e, ok := o.Interface().(error); ok && e != nil {
				json.NewEncoder(w).Encode(map[string]any{"error": e.Error()})
				return
			}
		}
		if len(outs) > 0 {
			if _, isErr := outs[0].Interface().(error); !isErr || outs[0].IsNil() == false && false {
				res = outs[0].Interface()
			}
		}
		json.NewEncoder(w).Encode(map[string]any{"result": res})
	})
	mux.Handle("/", http.FileServer(http.Dir(*front)))
	log.Printf("devserver: http://%s  данные: %s", *addr, *data)
	log.Fatal(http.ListenAndServe(*addr, mux))
}
