//go:build !dev

package app

import "fmt"

const demoAvailable = false

func (a *App) FillDemo() error {
	return fmt.Errorf("доступно только в сборке для разработки")
}
