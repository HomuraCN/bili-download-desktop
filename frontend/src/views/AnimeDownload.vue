<template>
  <el-card id="downloadCard">
    <div>
      <div>
        <el-input
            v-model="url"
            style="max-width: 800px"
            placeholder="Video Url"
        >
          <template #prepend>
            <p style="width: 100px">Url</p>
          </template>
        </el-input>
      </div>

      <div>
        <span style="margin-right: 100px">
          <el-input
              v-model="l"
              style="max-width: 200px"
              placeholder="left"
          >
            <template #prepend>
              <p style="width: 20px;">l</p>
            </template>
          </el-input>
        </span>
        <span>
          <el-input
              v-model="r"
              style="max-width: 200px"
              placeholder="right"
          >
            <template #prepend>
              <p style="width: 20px">r</p>
            </template>
          </el-input>
        </span>
      </div>

      <div>
        <el-button type="primary" @click="downloadAnime()">Download</el-button>
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
import router from "@/router";
import {ElMessage} from "element-plus";

axios.defaults.timeout = 5000;
// 允许跨域
axios.defaults.withCredentials = true;
// Content-Type 响应头
axios.defaults.headers.post["Content-Type"] =
    "application/x-www-form-urlencoded;charset=UTF-8";
// 基础url
axios.defaults.baseURL = '/api'; //注意此处一定要和vite设置的请求名一致

export default {
  name: "VideoDownload",
  components: {},

  data() {
    return {
      url: "",
      l: "",
      r: "",
      currentFileName: "",
      progress: 0,
    };
  },
  mounted() {
    this.downloadProgressSocket()
  },
  methods: {
    downloadAnime(){
      axios.get("/downloadBangumi?url=" + this.url + "&l=" + this.l + "&r=" + this.r, {

      }).then(res => {
        ElMessage({
          message: 'Download finished.',
          type: 'success',
        })
      })
    },
    downloadProgressSocket(){
      const socket = new WebSocket('ws://localhost:9961/progress');
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
div:not(#outside_div) {
  margin-bottom: 10px;
}

#outside_div {
  height: 100vh; /* 改为 height */
  overflow: hidden; /* 添加这行 */
  box-sizing: border-box; /* 添加这行 */
}
</style>