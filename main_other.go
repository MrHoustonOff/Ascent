//go:build !windows

// Оболочка Wails собирается только под Windows (см. main.go). На других системах
// для разработки используйте cmd/devserver.
package main

import "fmt"

func main() {
	fmt.Println("Ascent собирается под Windows: wails build -platform windows/amd64. Для разработки: go run -tags dev ./cmd/devserver")
}
