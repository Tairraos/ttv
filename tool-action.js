/* global conf, util, io, ui, net, pinyinPro */
let action = {
    /*********************/
    // 拖放导入数据
    /*********************/
    async doImportMaterials(file) {
        if (!file.name.match(/\.xlsx$/)) {
            return ui.err(`拖入的文件不是xlsx: "${file.name}"`);
        }
        ui.log(`开始导入 ${file.name}...`);
        let reader = new FileReader();
        reader.onload = async function (e) {
            let data = e.target.result;
            await io.importXlsx(data);
            conf.files = (await net.filesList()).files;
            conf.tasks = []; // 每次导入都清空任务列表，需要重新估算新产生任务列表
            ui.initRangeBox();
            ui.updateBasket();
        };
        reader.readAsBinaryString(file);
    },

    /*********************/
    // 1.素材翻译
    /*********************/
    async doTranslate() {
        // 用api翻译, 中译英，英文词汇如果仅有中文，也需要译成英文
        await action.fetchTranslationBundle(
            util.getMaterial((line) => line.chinese && !line.english),
            "chinese",
            "english"
        );
        // 用api翻译, 英译中，如果是英文课，跳过词汇不用翻译
        await action.fetchTranslationBundle(
            util.getMaterial((line) => line.english && !line.chinese && !(util.isLearnEnglish() && line.type === "word")),
            "english",
            "chinese"
        );
        // 英文课词汇查字典翻译，带词性和多个意思
        for (let line of util.getMaterial((line) => util.isLearnEnglish() && line.type === "word" && line.english && !line.chinese)) {
            await util.updateMaterial(line.id, conf.dict[line.english.toLowerCase()].mean, "chinese");
        }
        ui.log(`1.素材翻译完成`, "pass");
    },

    async fetchTranslationBundle(ids, from, to, force = false) {
        let bundles = util.bundleDataBySize(typeof ids[0] === "number" ? util.getMaterial((line) => ids.includes(line.id) && (force || !line[to])) : ids, 10);
        for (let bundle of bundles) {
            ui.log(`开始翻译 id=${bundle[0].id} 开始的一批数据`);
            let ret = await net.translate(bundle, from, to);
            if (ret.result === "success") {
                let translated = ret.data.split("\n");
                for (let item of bundle) {
                    let log = ui.log(`保存翻译结果 ${translated[0]}`);
                    await util.updateMaterial(item.id, translated.shift(), to);
                    ui.done(log);
                }
            } else {
                return ui.err("翻译时发生错误");
            }
        }
    },

    /*********************/
    // 2.拼音音标
    /*********************/
    async doGenPhonetic() {
        // 尝试给所有phonetic没有值的字段标注册拼音或音标
        for (let line of util.getMaterial()) {
            action.genPhoneticPiece(line.id);
        }
        ui.log(`2.素材标注${util.isLearnEnglish() ? "音标" : "拼音"}完成`, "pass");
    },

    async genPhoneticPiece(id, force = false) {
        let line = conf.materials[id],
            log;
        if (line.chinese && !util.isLearnEnglish() && (force || !line.phonetic)) {
            // 中文课，存在中文，即把中文用pinyin接口获得读音
            log = ui.log(`标注拼音：${line.chinese}`);
            await util.updateMaterial(line.id, pinyinPro.pinyin(line.chinese.replace(/0|1|2|3|4|5|6|7|8|9/g, (n) => "零一二三四五六七八九"[+n])), "phonetic");
            ui.done(log);
        } else if (line.english && util.isLearnEnglish() && line.type === "word" && !line.phonetic) {
            // 英文课，词汇查字典获得音标，句子的 Phonetic 字段留空，不需要拼音或音标
            log = ui.log(`标注音标：${line.english}`);
            await util.updateMaterial(line.id, conf.dict[line.english.toLowerCase()].accent, "phonetic");
            ui.done(log);
        }
    },

    /*********************/
    // 3.音频素材
    /*********************/
    async doGenAudio() {
        for (let line of util.getMaterial()) {
            await action.genSetupAudioPiece(line.id, "chinese", false); //生成中文语料音频
            await action.genSetupAudioPiece(line.id, "english", false); //生成英文语料音频
        }
        ui.log(`3.音频素材处理完成`, "pass");
    },

    // 为指定语料生成音频，有可能是1个2个或0个音频文件，英语单词的中文音频为空
    async genSetupAudioPiece(id, language, force) {
        let setup = util.getMediaSetup(id, language);
        for (let field of setup) {
            await action.genAudioPiece(id, field, force);
        }
    },

    // 生成单个音频, 生成音频用的字符串是从UI里取的，不是从conf.materials里取。这样可以临时修改ui里的数据，可以手动跳过一些括号里的内容被朗读。
    async genAudioPiece(id, field, force = false) {
        let language = field.match(/_cn/) ? "chinese" : "english",
            text = ui.getCell(id, language).innerText,
            defaultModel = field.match(/1$/) ? "woman" : "man",
            model = util.getModel(language, conf.materials[id]["voice"] || defaultModel);

        if (force || conf.materials[id][`${field}.audio`] === `required`) {
            let basename = `${id}.${field.replace(/media_/, "")}`;
            let log = ui.log(`使用${model}生成语音：${text} -> ${basename}.m4a`),
                rate = language == "chinese" && conf.info.language == "chinese" ? -20 : 0, // 中文课的中文语料，语速减速20%
                ret = await net.tts(basename, text, model, rate);
            if (ret.result === "success") {
                await util.updateMaterial(id, `${basename}.m4a`, "audio");
                util.checkMaterials(id);
                ui.done(log);
            } else {
                ui.err(`发生错误 ${JSON.stringify(ret)}`);
            }
        }
    },

    /*********************/
    // 4.字幕素材
    /*********************/
    async doGenSlide() {
        if (!conf.serverAvailable) {
            return ui.serverError(); // 服务不可用则退出生成
        }
        for (let line of util.getMaterial()) {
            await action.genSlidePiece(line.id, "listen");
            await action.genSlidePiece(line.id, "text");
        }
        ui.log(`4.字幕素材处理完成`, "pass");
    },

    async genSlidePiece(id, style, force = false) {
        if (force || conf.materials[id][`slide.slide-${style}`] === `required`) {
            let filename = `${id}.${style}.png`;
            let log = ui.log(`生成slide：${filename}`);
            await net.slide(id, style, filename);
            await util.updateMaterial(id, filename, "slide");
            util.checkMaterials(id);
            ui.done(log);
        }
    },

    /*********************/
    // 5.视频素材
    /*********************/
    async doGenVideo() {
        if (!conf.serverAvailable) {
            return ui.serverError(); // 服务不可用则退出生成
        }
        for (let line of util.getMaterial()) {
            for (let [field, target] of Object.keys(line)
                .filter((item) => item.match(/video-/) && line[item])
                .map((item) => item.split("."))) {
                await action.genVideoPiece(line.id, field, target);
            }
        }
        ui.log(`5.视频素材处理完成`, "pass");
    },

    async genVideoPiece(id, field, target, force = false) {
        if (force || conf.materials[id][`${field}.${target}`] === `required`) {
            let filename = util.getMediaFilename(id, field, target),
                audioname = target === "video-ding" ? "DING" : conf.materials[id][`${field}.audio`],
                slidename = conf.materials[id][`slide.slide-${target === "video-text" ? "text" : "listen"}`],
                log = ui.log(`生成视频片段：${filename}`),
                ret = await net.ffmpegPiece(filename, slidename, audioname);
            if (ret.result === "success") {
                conf.durations[filename] = ret.duration;
                await util.updateMaterial(id, filename, "video");
                util.checkMaterials(id);
                ui.done(log);
            }
        }
    },

    /*********************/
    // 6.工程估算
    /*********************/
    async doEstimate() {
        if (!conf.serverAvailable) {
            return ui.serverError(); // 服务不可用则退出生成
        }
        if (!util.checkMaterials()) {
            return ui.log(`素材未准备完整，无法生成视频。`, "error");
        }
        await util.checkMaterialDuration(); // 预计算所有素材时长
        conf.tasks = util.getTasksList();
        conf.info.duration = +conf.tasks.reduce((target, file) => target + conf.durations[file], 0).toFixed(3);

        ui.log(`6.工程估算完成`, "pass");
        ui.log(`目标视频名字：${util.getNewVideoName()}`);
        ui.log(`视频长度预计：${util.fmtDuration(conf.info.duration)}秒`);
        ui.log(`视频片段计数：${conf.tasks.length}`);
    },

    /*********************/
    // 7.生成作品
    /*********************/
    async doBuild() {
        if (!conf.serverAvailable) {
            return ui.serverError(); // 服务不可用则退出生成
        }
        if (!util.checkMaterials() || !conf.tasks.length) {
            return ui.log(`先进行工程估算，确认视频长度。`, "error");
        }

        let videoName = util.getNewVideoName(),
            log = ui.log(`生成作品：${videoName}`, "highlight"),
            ret = await net.ffmpegContact();
        if (ret.result === "success") {
            ui.done(log);
            ui.log(`视频实际长度：${util.fmtDuration(ret.duration)}秒`, "highlight");
            conf.videos.push([videoName, conf.program[conf.info.program], conf.range.start, conf.range.end, ret.duration, util.fmtDuration(ret.duration)]);
            ui.log(`7.作品已经生成`, "pass");
            window.open(`media/${conf.info.book_cn}/dist/${videoName}`, "preview");
            action.doExportData(); //立刻导出新版xls
        } else {
            ui.err(`生成作品 ${videoName} 时遇到错误`);
        }
    },

    /*********************/
    // ping
    /*********************/
    doPing() {
        net.ping();
    },

    /*********************/
    // 文件操作
    /*********************/
    doExportData() {
        io.exportData();
        window.setTimeout(() => {
            let filename = `${conf.info.book_cn}.${conf.info.version}.xlsx`;
            net.filesMove(filename, conf.info.book_cn);
        }, 2000);
        ui.updateBasket();
    },

    doNewBook() {
        let book_cn = ui.getInputData("book_cn"),
            book_en = ui.getInputData("book_en"),
            book_abbr = ui.getInputData("book_abbr"),
            language = ui.getSelectData("style"),
            book = Array.from(Array(50), (v, k) => k + 1).map((i) => [i, "auto", "", "", "", "", "", "", "", ""]);
        io.saveXlsxBinary(book, [[book_cn, book_en, book_abbr, language, 1]]);
        net.filesCreate(book_cn);
        ui.log(`图书目录已创建: ${book_cn}`, "highlight");
    },

    doMoveTemplate() {
        let book_cn = ui.getInputData("book_cn"),
            filename = `${book_cn}.1.xlsx`;
        net.filesMove(filename, book_cn);
    },

    /*********************/
    // 生成命令
    /*********************/
    doGenTranasCmd() {
        let intro = ui.getInputData("video_intro");

        navigator.clipboard.writeText(
            [
                `ffmpeg -i "${intro}" -hwaccel cuda`,
                `-c:a aac -b:a 128k -ar 44100 -ac 2`,
                `-c:v h264_nvenc -pix_fmt yuv420p`,
                `-v quiet -y "formated.${intro}"`
            ].join("")
        );
    },

    doGenMergeCmd() {
        let intro = ui.getInputData("video_intro"),
            dist = ui.getSelectData("video_dist");
        navigator.clipboard.writeText(`ffmpeg -f concat -safe 0 -i "${intro}" -i "${dist}" -c copy -async 1000 -v quiet -y "merged.${dist}"`);
    }
};
