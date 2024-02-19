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
    //查询造句字典
    /*********************/
    async getSentence(key) {
        return await net.fetchApi("api-sentence.php", { key });
    },

    /*********************/
    //文件操作
    /*********************/
    async filesCreate(bookname) {
        await net.fetchApi("api-files.php", { action: "create", book_cn: bookname });
    },

    async filesList() {
        let book_cn = conf.info.book_cn;
        return await net.fetchApi("api-files.php", { action: "list", book_cn });
    },

    async filesMove(filename, book_cn) {
        // 这里的book_cn有可能不是conf里的，是input里填的
        await net.fetchApi("api-files.php", { action: "move", book_cn, filename });
        // 打开目标文件夹
        // await net.openBookFolder(book_cn);
    },

    /*********************/
    //FFMPEG
    /*********************/
    async ffmpegDuration(filename) {
        let book_cn = conf.info.book_cn;
        return await net.fetchApi("api/ffmpeg", { action: "duration", book_cn, filename });
    },

    async ffmpegContact() {
        let book_cn = conf.info.book_cn,
            videolist = [util.getFilename("intro"), util.getFilename("covermp4"), ...conf.tasks].join("|");
        await net.fetchApi("api/ffmpeg", { action: "cover", book_cn, filename: `${util.getFilename("covermp4")}`, imgname: `${util.getFilename("coverimg")}` });
        return await net.fetchApi("api/ffmpeg", { action: "concat", book_cn, filename: `${util.getFilename("dist")}`, videolist });
    },

    async ffmpegCover() {
        let book_cn = conf.info.book_cn,
            imgname = util.getFilename("coverimg");
        return await net.fetchApi("api/ffmpeg", { action: "cover", book_cn, imgname, filename: util.getFilename("covermp4") });
    },

    async ffmpegPiece(filename, slidename, audioname) {
        let book_cn = conf.info.book_cn;
        return await net.fetchApi("api/ffmpeg", { action: "piece", book_cn, filename, slidename, audioname });
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
        return await net.fetchApi("api/slide", { id, book_cn, filename, language, style, watermark, svg, rows: JSON.stringify(util.getMaterialByGroup(id)) });
    },

    /*********************/
    //tts
    /*********************/
    async tts(basename, text, model, rate) {
        let book_cn = conf.info.book_cn;
        return await net.fetchApi("api/tts", { book_cn, basename, text, model, rate });
    },

    /*********************/
    //os
    /*********************/
    async openBookFolder(book_cn) {
        // 这里的book_cn有可能不是conf里的，是input里填的
        return await net.fetchApi("api/os", { action: "open", book_cn });
    }
};
