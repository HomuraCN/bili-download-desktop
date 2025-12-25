import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from '@/router/index.js'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios'
import VueQrcode from 'vue-qrcode'

const app = createApp(App)

app.component('vue-qrcode', VueQrcode)
app.use(router).use(ElementPlus).provide('$axios', axios).mount('#app')
