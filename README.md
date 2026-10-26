# Ascent

Десктопное приложение (Wails v2 + Go + SQLite) для прохождения плана «Go — ROADMAP».
Показывает весь план, хранит прогресс, считает темп **в закрытых темах** и копирует тексты для ИИ-тьютора.
У урока нет времени: нигде не измеряется и не показывается, сколько он занимает (см. `NOTES.md`).

## Сборка (Windows)

```
cd frontend && npm install && cd ..
wails build -clean -platform windows/amd64 -o Ascent.exe
wails build -clean -platform windows/arm64 -o Ascent-arm64.exe
```

Нужны Go 1.26+, Node 18+ и Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`, затем `wails doctor`).
Разработка с горячей перезагрузкой: `wails dev`.
Данные: `%APPDATA%\Ascent\` (`ascent.db`, `backups\`, `logs\`).

## macOS (веб-версия, без Wails)

На macOS Ascent запускается как маленький локальный сервер: интерфейс открывается во вкладке браузера.
Логика, база и интерфейс те же, что в Windows-приложении. Нужен только Go — ни Node, ни Wails, ни Xcode.

**Один раз:**
```
brew install go                      # или установщик с https://go.dev/dl/
git clone https://github.com/MrHoustonOff/Ascent.git
cd Ascent
go build -o Ascent .                 # получится один файл Ascent
```

**Запуск:**
```
./Ascent                             # сам откроет браузер: http://127.0.0.1:8765
```
Окно терминала держите открытым; остановить — `Ctrl+C`. Закрыть вкладку можно в любой момент: прогресс сохраняется сразу.

**Где что лежит:**
| Что | Где |
|---|---|
| база прогресса | `~/Library/Application Support/Ascent/ascent.db` |
| резервные копии (14 последних) | `~/Library/Application Support/Ascent/backups/` |
| логи | `~/Library/Application Support/Ascent/logs/` |
| план и конспекты | встроены в бинарник `Ascent` |

Перенести прогресс с Windows: скопируйте `%APPDATA%\Ascent\ascent.db` в `~/Library/Application Support/Ascent/`
(при закрытом Ascent). В Finder папка открывается через `Cmd+Shift+G` → `~/Library/Application Support/Ascent`.

**Если что-то не так:**
- «Порт занят» — Ascent сам возьмёт свободный и напечатает адрес в терминале; или `./Ascent -addr 127.0.0.1:9000`.
- Браузер не открылся — откройте адрес из терминала вручную; `./Ascent -no-open` не открывает его вовсе.
- macOS ругается на неизвестного разработчика (если бинарник скачан, а не собран) — `xattr -d com.apple.quarantine Ascent`.
- Другая папка данных — `./Ascent -data ~/Ascent-data`.
- Сборка без Mac: `GOOS=darwin GOARCH=arm64 go build -o Ascent-mac-arm64 .` (M1–M4), `GOARCH=amd64` — для Intel.
  CI (`.github/workflows/build.yml`) собирает оба файла в артефакт `Ascent-macos-web`.

Отличия от Windows-версии: кнопок окна нет (окно — это вкладка браузера), Ctrl+= / Ctrl+− работают как в приложении
(Cmd тоже), «Обновить план из папки» открывает системный диалог выбора папки.
То же самое работает на Linux (данные — `~/.config/Ascent`).

## Разработка без Wails

```
go test ./...
go build -tags dev -o devserver ./cmd/devserver
./devserver -front frontend            # http://127.0.0.1:8765, в Настройках — «Заполнить демо-данными»
node tools/shots.cjs shots --full '#/today' '#/stats'   # скриншоты (нужен playwright)
```

## Структура

- `internal/plan` — парсер плана (контрольные числа проверяются тестом)
- `internal/store` — SQLite, миграции, синхронизация плана, бэкапы
- `internal/stats` — учебный день, серия, темп в темах, прогноз, хитмапа
- `internal/clip` — тексты для копирования
- `internal/app` — методы для фронтенда (без зависимости от Wails)
- `internal/konspekt` — конспекты уроков (вопросы, что гуглить, должен знать)
- `frontend/` — чистый JS и дизайн-система Ascent
- `main.go` — окно Wails (Windows), `main_other.go` — веб-версия (macOS, Linux)
