package server

import (
	"io"
	"log"
	"net/http"
)

// StartLocalProxy 启动本地代理服务
// 监听 11451 端口，专门处理 /proxy?url=... 请求
func StartLocalProxy() {
	http.HandleFunc("/proxy", func(w http.ResponseWriter, r *http.Request) {
		// 1. 允许跨域 (CORS) - 这一步对 WebView2 至关重要
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "*")

		// 处理预检请求
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// 2. 获取目标 URL
		targetURL := r.URL.Query().Get("url")
		if targetURL == "" {
			http.Error(w, "Missing url parameter", http.StatusBadRequest)
			return
		}

		// 3. 创建请求转发给 B 站
		req, err := http.NewRequest("GET", targetURL, nil)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// 4. 【关键】伪装 Header (防 403/Referer 检查)
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
		req.Header.Set("Referer", "https://www.bilibili.com/")

		// 5. 发起请求
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			// 如果 B 站连接失败，返回 502
			http.Error(w, "Proxy request failed: "+err.Error(), http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		// 6. 复制响应头 (Content-Type, Content-Length 等)
		// 这样前端进度条才能正确显示总大小
		for k, v := range resp.Header {
			w.Header().Set(k, v[0])
		}
		w.WriteHeader(resp.StatusCode)

		// 7. 管道传输数据 (零内存占用流式转发)
		io.Copy(w, resp.Body)
	})

	// 异步启动服务，不要阻塞主线程
	go func() {
		log.Println("🚀 本地代理服务已启动: http://localhost:11451")
		if err := http.ListenAndServe(":11451", nil); err != nil {
			log.Fatal("代理服务启动失败:", err)
		}
	}()
}
