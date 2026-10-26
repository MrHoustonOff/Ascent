//go:build windows

package main

import (
	"context"
	"embed"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"ascent/internal/app"
	"ascent/internal/logx"
)

//go:embed all:frontend/dist
var assets embed.FS

// host — то, что умеет только окно Wails.
type host struct{ ctx context.Context }

func (h *host) ClipboardSet(t string) error { return runtime.ClipboardSetText(h.ctx, t) }
func (h *host) OpenURL(u string)            { runtime.BrowserOpenURL(h.ctx, u) }
func (h *host) PickDir(title string) (string, error) {
	return runtime.OpenDirectoryDialog(h.ctx, runtime.OpenDialogOptions{Title: title})
}

func main() {
	cfg, err := os.UserConfigDir()
	if err != nil {
		cfg = "."
	}
	dir := filepath.Join(cfg, "Ascent")
	lg, _ := logx.Open(filepath.Join(dir, "logs"))
	defer lg.Close()

	h := &host{}
	a, err := app.New(dir, h, time.Now, time.Local)
	if err != nil {
		lg.Printf("запуск: %v", err)
		os.Exit(1)
	}
	app.SetLogger(a, lg.Printf)
	defer app.Shutdown(a)

	// размер и положение окна
	w, hgt, maximised := 1200, 800, false
	if set, err := a.Settings(); err == nil {
		if x, e := strconv.Atoi(set["win_w"]); e == nil && x >= 880 {
			w = x
		}
		if x, e := strconv.Atoi(set["win_h"]); e == nil && x >= 560 {
			hgt = x
		}
		maximised = set["win_max"] == "1"
	}
	state := options.Normal
	if maximised {
		state = options.Maximised
	}

	err = wails.Run(&options.App{
		Title:            "Ascent",
		Width:            w,
		Height:           hgt,
		MinWidth:         880,
		MinHeight:        560,
		Frameless:        true,
		WindowStartState: state,
		BackgroundColour: &options.RGBA{R: 245, G: 245, B: 247, A: 255},
		AssetServer:      &assetserver.Options{Assets: assets},
		OnStartup:        func(ctx context.Context) { h.ctx = ctx },
		OnBeforeClose: func(ctx context.Context) bool {
			max := runtime.WindowIsMaximised(ctx)
			_ = a.SetSetting("win_max", map[bool]string{true: "1", false: "0"}[max])
			if !max {
				ww, hh := runtime.WindowGetSize(ctx)
				_ = a.SetSetting("win_w", strconv.Itoa(ww))
				_ = a.SetSetting("win_h", strconv.Itoa(hh))
			}
			return false
		},
		Bind: []interface{}{a},
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId: "ascent-go-roadmap-7f3c",
			OnSecondInstanceLaunch: func(_ options.SecondInstanceData) {
				runtime.WindowUnminimise(h.ctx)
				runtime.Show(h.ctx)
			},
		},
		Windows: &windows.Options{Theme: windows.SystemDefault},
	})
	if err != nil {
		lg.Printf("wails: %v", err)
	}
}
