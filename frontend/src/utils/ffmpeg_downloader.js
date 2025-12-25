import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export class BiliDownloader {
    constructor(logCallback) {
        this.ffmpeg = new FFmpeg();
        this.logCallback = logCallback || console.log;

        this.ffmpeg.on('log', ({ message }) => {
            // 过滤日志，保留关键信息
            if(message.includes('frame=') || message.includes('time=') || message.includes('Error')) {
                this.logCallback(`[FFmpeg] ${message}`);
            }
        });

        this.ffmpeg.on('progress', ({ progress, time }) => {
            // 合并阶段占最后 5% (0.95 - 1.0)
            // FFmpeg 内部 progress 是 0-1
            const globalProgress = 95 + (progress * 5);
            this.logCallback(`Progress: ${globalProgress.toFixed(1)}%`);
        });
    }

    async load() {
        if (this.ffmpeg.loaded) return;

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        this.logCallback('Loading FFmpeg core...');

        try {
            await this.ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            this.logCallback('FFmpeg loaded!');
        } catch (e) {
            throw new Error(`FFmpeg load failed: ${e.message}`);
        }
    }

    // getProxyUrl(originalUrl) {
    //     return `/api/proxy?url=${encodeURIComponent(originalUrl)}`;
    // }
    // getProxyUrl(originalUrl) {
    //     // 这里填你刚才绑定的帅气域名
    //     const workerHost = "https://api.homura.uk";

    //     // 拼接成：https://api.homura.uk?target=https://bili...
    //     return `${workerHost}?target=${encodeURIComponent(originalUrl)}`;
    // }
    getProxyUrl(originalUrl) {
        // [修改前] const workerHost = "https://api.homura.uk";
        
        // [修改后] 使用刚才启动的 Go 本地代理
        const workerHost = "http://localhost:11451/proxy";

        // 拼接成：http://localhost:11451/proxy?url=https://bili...
        // 注意：这里参数名我改成了 standard 的 'url'，对应 proxy.go 里的 query
        return `${workerHost}?url=${encodeURIComponent(originalUrl)}`;
    }

    /**
     * 带权重的下载函数
     * @param {string} url 下载地址
     * @param {string} taskName 任务名称
     * @param {number} startRatio 起始进度 (0-100)
     * @param {number} endRatio 结束进度 (0-100)
     */
    async fetchWithProgress(url, taskName, startRatio, endRatio) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${taskName}: ${response.status} ${response.statusText}`);
        }

        const contentLength = response.headers.get('Content-Length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            loaded += value.length;

            if (total > 0) {
                // 计算当前文件下载百分比 (0-1)
                const filePercent = loaded / total;
                // 映射到全局进度: Start + (File% * (End - Start))
                const globalPercent = startRatio + (filePercent * (endRatio - startRatio));

                this.logCallback(`Progress: ${globalPercent.toFixed(1)}%`);
            }
        }

        // 确保下载完成时发一个精确的 EndRatio
        this.logCallback(`Progress: ${endRatio.toFixed(1)}%`);

        const combined = new Uint8Array(loaded);
        let position = 0;
        for (const chunk of chunks) {
            combined.set(chunk, position);
            position += chunk.length;
        }

        return combined;
    }

    async downloadAndMerge(videoUrl, audioUrl, fileName) {
        if (!this.ffmpeg.loaded) await this.load();

        const videoName = 'input_video.m4s';
        const audioName = 'input_audio.m4s';
        const outputName = 'output.mp4';

        try {
            // 1. 下载视频流 (权重: 0% -> 80%)
            // 视频文件通常很大，给它分配 80% 的进度条空间
            this.logCallback('Step 1/4: Downloading Video Stream...');
            const proxyVideoUrl = this.getProxyUrl(videoUrl);
            const videoData = await this.fetchWithProgress(proxyVideoUrl, 'Video', 0, 80);

            if (videoData.byteLength < 1024) throw new Error('Video file too small. Proxy failed.');
            await this.ffmpeg.writeFile(videoName, videoData);

            // 2. 下载音频流 (权重: 80% -> 95%)
            if (audioUrl) {
                this.logCallback('Step 2/4: Downloading Audio Stream...');
                const proxyAudioUrl = this.getProxyUrl(audioUrl);
                const audioData = await this.fetchWithProgress(proxyAudioUrl, 'Audio', 80, 95);

                if (audioData.byteLength < 1024) throw new Error('Audio file too small. Proxy failed.');
                await this.ffmpeg.writeFile(audioName, audioData);
            } else {
                // 如果没有音频，直接跳到 95%
                this.logCallback(`Progress: 95.0%`);
            }

            // 3. 执行合并 (权重: 95% -> 100%)
            this.logCallback('Step 3/4: Merging via WebAssembly...');
            const cmd = audioUrl
                ? ['-i', videoName, '-i', audioName, '-c', 'copy', outputName]
                : ['-i', videoName, '-c', 'copy', outputName];

            const ret = await this.ffmpeg.exec(cmd);
            if (ret !== 0) throw new Error(`FFmpeg merge failed with exit code: ${ret}`);

            // 4. 保存文件
            this.logCallback('Step 4/4: Saving file...');
            this.logCallback(`Progress: 100.0%`); // 强制 100%

            const data = await this.ffmpeg.readFile(outputName);
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = fileName.endsWith('.mp4') ? fileName : `${fileName}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            await this.ffmpeg.deleteFile(videoName);
            if (audioUrl) await this.ffmpeg.deleteFile(audioName);
            try { await this.ffmpeg.deleteFile(outputName); } catch(e){}

            this.logCallback('All Done! Download started.');
            return true;

        } catch (error) {
            console.error(error);
            this.logCallback(`Error: ${error.message}`);
            throw error;
        }
    }
}