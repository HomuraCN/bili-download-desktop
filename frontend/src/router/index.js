import {createRouter, createWebHashHistory} from "vue-router";

import Login from "@/views/Login.vue";
import Index from "@/views/Index.vue";
import VideoDownload from "@/views/VideoDownload.vue"
import AnimeDownload from "@/views/AnimeDownload.vue";
import VideoDownloadFromCollection from "@/views/VideoDownloadFromCollection.vue";

const routes = [
    {
        path: '/',
        redirect: '/login',
    },
    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: {
            keepalive: false
        }
    },
    {
        path: '/Index',
        name: 'Index',
        component: Index,
        meta: {
            keepalive: true
        },
        redirect:'/VideoDownload',
        children: [
            {
                path: '/VideoDownload',
                name: 'VideoDownload',
                component: VideoDownload
            },
            {
                path: '/AnimeDownload',
                name: 'AnimeDownload',
                component: AnimeDownload
            },
            {
                path: '/VideoDownloadFromCollection',
                name: 'VideoDownloadFromCollection',
                component: VideoDownloadFromCollection
            }
        ]
    }
];

const router = new createRouter({
    history: createWebHashHistory(),
    routes
});

export default router;