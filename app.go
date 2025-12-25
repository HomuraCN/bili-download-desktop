package main

import (
	"bili-download-desktop/internal/dao" // 确保这里已经改成了新模块名
	"bili-download-desktop/internal/model"
	"bili-download-desktop/internal/service"
	"context"
	"fmt"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// app.go

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// ✅ 【关键修复】初始化 Cookie 存储
	// 如果不初始化，dao.Store 就是 nil，一调就崩
	dao.InitStore("cookie.json")

	fmt.Println("应用启动，Cookie存储已初始化")
}

// ---------------- 以下方法会被前端直接调用 ----------------

// 1. 解析视频 (对应原来的 /api/video?url=...)
func (a *App) ResolveVideo(url string) *model.Response {
	// 调用现成的 service 逻辑
	result, err := service.ResolveVideo(url)
	if err != nil {
		return model.Fail(err.Error())
	}
	return model.Success(result)
}

// 2. 获取登录二维码 (对应原来的 /api/auth/qrcode)
func (a *App) GetLoginQRCode() *model.Response {
	// 修改：直接调用 Service 层
	resp, err := service.GetQRCode()
	if err != nil {
		return model.Fail(err.Error())
	}
	return model.Success(resp)
}

// 3. 检查登录状态 (对应原来的 /api/auth/check)
func (a *App) CheckLoginStatus(qrKey string) *model.Response {
	// 修改：直接调用 Service 层
	// 注意：这里我们只关心是否成功和 Data
	data, success, err := service.CheckQRCodeStatus(qrKey)
	if err != nil {
		return model.Fail(err.Error())
	}
	if !success {
		// 虽然没成功(比如等待扫描)，但接口本身没报错，返回特定的 Code 供前端判断
		// 这里你可以复用 model.Fail 或者自定义，建议返回 data 让前端看 code
		return &model.Response{
			Code:    data.Code, // B站原本的 Code (86101: 等待扫描)
			Message: data.Message,
			Data:    data,
		}
	}
	return model.Success(data)
}

// 4. 获取当前用户信息 (检查 Cookie 是否有效)
func (a *App) GetUserInfo() *model.Response {
	// 简单实现：从 store 获取 sessData，如果有值认为“可能”登录了
	// 严谨做法是调 B 站 /x/web-interface/nav 接口，这里先做简单版
	sess := dao.Store.GetSessData()
	if sess == "" {
		return model.Fail("未登录")
	}
	return model.Success("已登录")
}
