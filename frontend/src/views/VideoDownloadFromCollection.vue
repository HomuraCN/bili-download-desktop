<template>
  <el-card id="downloadCard">
    <div>
      <div>
        <el-input
            v-model="avid"
            style="max-width: 800px"
            placeholder="Video Avid"
        >
          <template #prepend>
            <p style="width: 100px">Avid</p>
          </template>
        </el-input>
      </div>

      <div>
        <el-input
            v-model="cid"
            style="max-width: 800px"
            placeholder="Video Cid"
        >
          <template #prepend>
            <p style="width: 100px">Cid</p>
          </template>
        </el-input>
      </div>

      <div>
        <el-input
            v-model="fileName"
            style="max-width: 800px"
            placeholder="File Name"
        >
          <template #prepend>
            <p style="width: 100px">FileName</p>
          </template>
        </el-input>
      </div>

      <div>
        <el-button type="primary" @click="downloadVideo()">Download</el-button>
      </div>

      <div>
        <el-progress :percentage="progress" :text-inside="true" :stroke-width="20">
          <span>{{ this.currentFileName }}: {{progress}}%</span>
        </el-progress>
      </div>
    </div>
  </el-card>
</template>

<script>
import axios from "axios";
import { ElMessage } from 'element-plus'

axios.defaults.timeout = 5000;
// 允许跨域
axios.defaults.withCredentials = true;
// Content-Type 响应头
axios.defaults.headers.post["Content-Type"] =
    "application/x-www-form-urlencoded;charset=UTF-8";
// 基础url
axios.defaults.baseURL = '/api'; //注意此处一定要和vite设置的请求名一致

export default {
  name: "VideoDownloadFromCollection",
  components: {},

  data(){
    return{
      avid: "",
      cid: "",
      fileName: "",
      currentFileName: "",
      progress: 0,
    };
  },
  mounted() {
    this.downloadProgressSocket()
  },
  methods: {
    downloadVideo(){
      axios.get("/downloadVideoWBIFromCollection?avid=" + this.avid + "&cid=" + this.cid + "&fileName=" + this.fileName, {

      }).then(res => {
        ElMessage({
          message: 'Download finished.',
          type: 'success',
        })
      })
    },
    downloadProgressSocket(){
      // 连接到 Nginx 服务器的地址和路径
      // 使用 ws:// 因为你的 Nginx 示例是监听 http (端口 80)
      const socket = new WebSocket('ws://localhost:9961/progress'); // 或者 'ws://<你的Nginx服务器IP>/progress'
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.currentFileName = data.fileName
        this.progress = data.progress
      }
    }
  }
}

</script>

<style scoped>
div{
  margin-bottom: 10px;
}
#downloadCard{
  margin: 0 auto;
}
</style>