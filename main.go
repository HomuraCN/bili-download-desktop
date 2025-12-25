package main

import (
	"embed"
	"log"

	// 引入新包
	"bili-download-desktop/internal/server"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// 1. 【新增】启动本地代理服务
	server.StartLocalProxy()
	// 创建 App 实例
	app := NewApp()

	// 启动 Wails 应用程序
	err := wails.Run(&options.App{
		Title:  "Bili Download Desktop",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app, // 重点：将 App 结构体的方法暴露给前端
		},
		Logger:   nil, // 使用默认日志
		LogLevel: logger.DEBUG,
	})

	if err != nil {
		log.Fatal("Error:", err.Error())
	}
}
