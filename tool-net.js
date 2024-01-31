/* global conf, ui, util */
let net = {
    /*********************/
    // 调用api获取返回
    /*********************/
    async fetchApi(apiUrl, args = {}) {
        if (conf.pause) {
            return ui.log("服务器暂停使用", "highlight");
        }
        let header = new Headers(),
            params = new URLSearchParams();
        header.append("Content-Type", "application/x-www-form-urlencoded");
        for (let [key, value] of Object.entries(args)) {
            params.append(key, value);
        }
        let response = await fetch(apiUrl, { method: "POST", headers: header, body: params });
        if (apiUrl.match(/api\//)) {
            ui.updateServerStatus(response.ok);
        }
        return response.ok ? await response.json() : { result: "error", reason: "server error" };
    },

    /*********************/
    //ping node服务，检查服务状态
    /*********************/
    async ping() {
        let log = ui.log(`Ping助手服务器...`),
            ret = await net.fetchApi("api/ping");
        if (ret.result === "success") {
            ui.done(log);
        }
    },

    /*********************/
    //加载字典
    /*********************/
    async importDict() {
        return await net.fetchApi("lib/dict.json");
    },

    /*********************/
    //文件操作
    /*********************/
    async filesCreate(bookname) {
        return await net.fetchApi("api-files.php", { action: "create", book_cn: bookname });
    },

    async filesList() {
        return await net.fetchApi("api-files.php", { action: "list", book_cn: conf.info.book_cn });
    },

    async filesMove(filename, book_cn) {
        return await net.fetchApi("api-files.php", { action: "move", book_cn, filename });
    },

    /*********************/
    //FFMPEG
    /*********************/
    async ffmpegDuration(filename) {
        return await net.fetchApi("api/ffmpeg", { action: "duration", filename });
    },

    async ffmpegContact() {
        return await net.fetchApi("api/ffmpeg", { action: "concat", filename: `${conf.info.newBookName}`, videolist: conf.tasks.join("|") });
    },

    async ffmpegPiece(filename, slidename, audioname) {
        return await net.fetchApi("api/ffmpeg", { action: "piece", filename, slidename, audioname });
    },

    /*********************/
    //翻译
    /*********************/
    async translate(bundle, from, to) {
        return await net.fetchApi("api-translate.php", { to: to === "english" ? "en" : "zh", text: bundle.map((line) => line[from]).join("\n") });
    },

    /*********************/
    //slide
    /*********************/
    async slide(id, style, filename) {
        let watermark = ((id / 16) | 0) % 4, // 每16行语料，水印换一个位置
            svg = +new Date() % 4,
            book_cn = conf.info.book_cn,
            language = conf.info.language;
        return await net.fetchApi("api/slide", { id, filename, book_cn, language, style, watermark, svg, rows: JSON.stringify(util.getPureMaterial(id)) });
    },

    /*********************/
    //tts
    /*********************/
    async tts(basename, text, model, rate) {
        return await net.fetchApi("api/tts", { basename, text, model, rate });
    }
};
