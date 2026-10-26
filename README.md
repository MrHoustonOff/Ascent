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
- `frontend/` — чистый JS и дизайн-система Ascent
