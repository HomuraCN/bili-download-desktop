<template>
  <div class="login-container">
    <el-card id="loginCard">
      <div>
        <el-row :gutter="20">
          <el-col :span="8">
            <img src="/pic/2233/22.png" alt="22" style="width: 150px; margin-left: -96px; margin-bottom: -391px">
          </el-col>
          <el-col @mouseover="change()" @mouseout="changeBack()" :span="8">
            <h3 style="font-weight: 540">扫描二维码登录</h3>
<!--            <vue-qrcode size="qrCodeSize" :value="qrCodeValue" v-show="flag"></vue-qrcode>-->
<!--            <img src="/pic/login/qr-tips.74063ae1.png" alt="客户端" style="height: 212px; margin-left: -75px" v-show="!flag">-->
            <div class="qr-container">
              <vue-qrcode :size="200" :value="qrCodeValue" v-show="flag"></vue-qrcode>
              <img src="/pic/login/qr-tips.74063ae1.png" alt="客户端" v-show="!flag">
            </div>
            <h4>请使用 <el-link type="primary" href="https://app.bilibili.com/">哔哩哔哩客户端</el-link></h4>
            <h4>扫码登录或扫码下载APP</h4>
          </el-col>
          <el-col :span="8">
            <img src="/pic/2233/33.png" alt="33" style="width: 150px; margin-right: -96px; margin-bottom: -391px">
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>

</template>

<script>
import { ElMessage } from "element-plus";
import router from "@/router";
// 1. 引入 Wails 自动生成的 Go 方法
import { GetLoginQRCode, CheckLoginStatus } from '../../wailsjs/go/main/App';

export default {
  name: "Login",
  data() {
    return {
      qrCodeSize: 200,
      qrCodeValue: "",
      timer: null,
      qrcodekey: "",
      flag: true,
    };
  },
  mounted() {
    this.qrcodeGenerate();
  },
  beforeUnmount() { // Vue3 推荐用 beforeUnmount 替代 beforeDestroy
    clearInterval(this.timer);
  },
  methods: {
    qrcodeGenerate() {
      console.log("正在请求二维码...");
      
      // 2. 调用 Go 方法
      GetLoginQRCode().then(res => {
        // 注意：现在判断 code === 0 表示成功 (Go 后端定义的)
        if (res.code === 0) {
          // 结构变化：Wails 直接返回 Response 结构体
          // res.data 是 QRCodeResponse
          // res.data.data 是 QRCodeData (包含 url 和 key)
          this.qrCodeValue = res.data.data.url;
          this.qrcodekey = res.data.data.qrcode_key;
          console.log("获取成功:", this.qrCodeValue);
          
          this.timer = setInterval(this.verifyQrcode, 2000);
        } else {
          ElMessage.error(res.message);
        }
      }).catch(err => {
        console.error(err);
        ElMessage.error("获取二维码失败");
      });
    },

    verifyQrcode() {
      // 3. 调用 Go 方法检查状态
      CheckLoginStatus(this.qrcodekey).then(res => {
        console.log("扫码状态:", res.code, res.message);
        
        // Code 0 代表登录成功
        if (res.code === 0) {
          clearInterval(this.timer);
          ElMessage.success("登录成功");
          router.push("Index");
        } 
        // Code 86038 代表二维码已过期
        else if (res.code === 86038) {
          clearInterval(this.timer);
          ElMessage.warning("二维码已过期，请刷新");
        }
        // 其他 Code (如 86101 等待扫码) 不做处理，继续轮询
      }).catch(error => {
        console.error("检查状态出错", error);
      });
    },
    change() {
      this.flag = false
    },
    changeBack() {
      this.flag = true
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh; /* 占满整个视口 */
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  background-color: white;
}
#loginCard {
  text-align: center;
  width: 700px;
  max-width: 90%; /* 小屏幕时不超出 */
  border-radius: 20px;
  overflow: hidden;
}

/* 固定二维码容器高度 */
.qr-container {
  height: 212px; /* 和提示图片高度一致 */
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
}

.qr-container img {
  max-height: 100%;
  width: auto;
}


h3{
  color: #808080;
}
h4{
  color: #808080;
}
</style>