package model

// Response 标准响应结构体
// Wails 会根据这个结构体在前端生成对应的 TS 类型
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// Success 成功返回
func Success(data interface{}) *Response {
	return &Response{
		Code:    0,
		Message: "success",
		Data:    data,
	}
}

// Fail 失败返回
func Fail(message string) *Response {
	return &Response{
		Code:    -1,
		Message: message,
		Data:    nil,
	}
}
