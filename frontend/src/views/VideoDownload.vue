<template>
  <el-card id="downloadCard">
    <div>
      <div>
        <el-input
            v-model="url"
            style="max-width: 800px"
            placeholder="Video Url"
            clearable
        >
          <template #prepend>
            <p style="width: 100px">Url</p>
          </template>
        </el-input>
      </div>

      <div>
        <el-input
            v-model="fileName"
            style="max-width: 800px"
            placeholder="File Name (Optional)"
            clearable
        >
          <template #prepend>
            <p style="width: 100px">FileName</p>
          </template>
        </el-input>
      </div>

      <div>
        <el-button type="primary" @click="downloadVideo()" :loading="loading">
          {{ loading ? 'Processing...' : 'Download' }}
        </el-button>
      </div>

      <!-- 还原你最喜欢的进度条样式 -->
      <!-- 只有在有进度或加载时才显示，避免一开始显示一条 0% -->
      <div v-if="loading || progress > 0">
        <el-progress
            :percentage="progress"
            :text-inside="true"
            :stroke-width="20"
            :status="progressStatus"
        >
          <!-- 这里会显示：Video Stream: 45.5% -->
          <span>{{ currentTaskName }}: {{ progress.toFixed(1) }}%</span>
        </el-progress>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" style="margin-top: 10px; color: red;">
        {{ errorMessage }}
      </div>

    </div>
  </el-card>
</template>

<script>
import { ElMessage } from 'element-plus';
import { BiliDownloader } from '@/utils/ffmpeg_downloader.js';
// 1. 引入 Go 方法
import { ResolveVideo } from '../../wailsjs/go/main/App';

export default {
  name: "VideoDownload",
  data() {
    return {
      url: "",
      fileName: "",
      loading: false,
      progress: 0,
      currentTaskName: "Ready",
      errorMessage: "",
      downloader: null
    };
  },
  computed: {
    progressStatus() {
      if (this.errorMessage) return 'exception';
      if (this.progress >= 100) return 'success';
      return '';
    }
  },
  mounted() {
    this.downloader = new BiliDownloader((msg) => {
      this.handleLogMessage(msg);
    });
  },
  methods: {
    handleLogMessage(msg) {
      if (msg.startsWith("Progress:")) {
        const percentStr = msg.split(":")[1].replace('%', '').trim();
        this.progress = parseFloat(percentStr);
      }
      else if (msg.startsWith("Step")) {
        if (msg.includes("Video")) this.currentTaskName = "Video Stream";
        else if (msg.includes("Audio")) this.currentTaskName = "Audio Stream";
        else if (msg.includes("Merging")) this.currentTaskName = "Merging";
        else if (msg.includes("Saving")) this.currentTaskName = "Saving";
      }
      else if (msg.includes("All Done")) {
        this.progress = 100;
        this.currentTaskName = "Completed";
      }
    },

    async downloadVideo() {
      if (!this.url) {
        ElMessage.warning('Please input a URL first.');
        return;
      }

      this.loading = true;
      this.progress = 0;
      this.currentTaskName = "Initializing";
      this.errorMessage = "";

      try {
        this.currentTaskName = "Resolving URL";
        
        // 2. 关键修改：调用 Go 后端解析
        const res = await ResolveVideo(this.url);

        // Wails 返回的 res 就是 *model.Response
        if (res.code !== 0) {
          throw new Error(res.message || 'API Error');
        }

        // res.data 是 ResolveResult
        // 注意：Go 结构体字段通常首字母大写，但 Wails 生成 JSON 时默认也是大写
        // 除非你在 Go struct 里加了 `json:"videoUrl"` tag
        // 请检查你的 internal/model/video.go，如果没加 tag，这里可能是 Res.data.VideoUrl
        // 这里假设你之前的代码是加了 json tag 的
        const { videoUrl, audioUrl, fileName: serverFileName } = res.data;
        const finalName = this.fileName || serverFileName || 'bilibili_video';

        // 3. 继续使用原来的下载器 (保持不变)
        // 注意：这里依赖 Cloudflare Worker 代理，在桌面端依然有效
        await this.downloader.downloadAndMerge(videoUrl, audioUrl, finalName);
        ElMessage.success('Download finished successfully.');

      } catch (error) {
        console.error(error);
        this.errorMessage = error.message || "Unknown error";
        ElMessage.error(this.errorMessage);
        this.currentTaskName = "Error";
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
div {
  margin-bottom: 10px;
}
</style>