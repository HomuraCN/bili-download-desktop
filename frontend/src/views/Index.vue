<template>
  <el-container id="container">
    <el-backtop :right="100" :bottom="100" />
      <el-header id="header">
        <el-affix id="nav" :offset="0">
          <el-menu
              default-active="$route.path"
              class="el-menu-demo"
              mode="horizontal"
              @select="handleSelect"
              :ellipsi="true"
              router
          >
            <img src="/logo.png" alt="logo" style="margin-left: 20px">

            <el-menu-item index="/VideoDownload">
              <span>视频下载</span>
            </el-menu-item>
            <el-menu-item index="/AnimeDownload">
              <span>番剧下载</span>
            </el-menu-item>
            <el-menu-item index="/VideoDownloadFromCollection">
              <span>合集视频下载</span>
            </el-menu-item>

          </el-menu>
        </el-affix>
      </el-header>
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script>
import axios from "axios";

axios.defaults.timeout = 5000;
// 允许跨域
axios.defaults.withCredentials = true;
// Content-Type 响应头
axios.defaults.headers.post["Content-Type"] =
    "application/x-www-form-urlencoded;charset=UTF-8";
// 基础url
axios.defaults.baseURL = '/api'; //注意此处一定要和vite设置的请求名一致

export default {
  name: "Index",
  data(){
    return{

    }
  },
  mounted() {

  },
  methods: {

  }
}
</script>

<style scoped>
#header {
  padding: 0 0;
}
#nav{
  /*margin-top: -289px;*/
}
#container {
  width: auto;
}
</style>