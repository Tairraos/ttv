/* global conf, util, ui, pinyinPro, XLSX */

let action = {
    /*********************/
    // 拖放导入数据
    /*********************/
    doImportMaterials(file) {
        if (!file.name.match(/\.xlsx$/)) {
            return ui.err(`拖入的文件不是xlsx: "${file.name}"`);
        }
        ui.log(`开始导入 ${file.name}...`);
        let reader = new FileReader();
        reader.onload = async function (e) {
            let data = e.target.result,
                workbook = XLSX.read(data, { type: "binary" }),
                worksheet = Object.values(workbook.Sheets)[0],
                range = XLSX.utils.decode_range(worksheet["!ref"]),
                w = worksheet,
                autosid = 1,
                last_group = 0,
                group = 0;

            if (range.e.c < 6) {
                return ui.err(`拖入的文件列数不对: "${file.name}"`);
            }
            let g = (r) => (w[r] ? w[r].v : ""),
                counter = 0;
            for (let row = 2; row <= range.e.r + 1; row++) {
                if (g(`A${row}`) !== "") {
                    let id = ++conf.maxid,
                        lesson = conf.info.lesson,
                        sid = g(`B${row}`),
                        type =
                            g(`C${row}`)
                                .replace(/词语|词汇|词组|短语|单词/, "word")
                                .replace(/句子|句型/, "sentence")
                                .replace(/故事|短文/, "story")
                                .replace(/标题|章节/, "title") || "sentence",
                        // group = g(`D${row}`)
                        voice = g(`E${row}`),
                        chinese = g(`F${row}`),
                        english = g(`G${row}`),
                        phonetic = g(`H${row}`),
                        comment = g(`I${row}`),
                        theme = g(`J${row}`),
                        log = ui.log(`导入 ${chinese || english}...`),
                        current_group = +g(`D${row}`);
                    sid = sid !== "auto" ? +sid : type === "title" ? 0 : autosid++;
                    group = current_group === 0 ? 0 : current_group !== last_group ? id : group;
                    last_group = current_group;
                    let ret = await util.fetchApi("api-material.php", {  action: "insert", id, sid, lesson, type, group, voice, chinese, english, phonetic, comment, theme });
                    counter++;
                    ret.result === "success" && ui.loadMaterial(ret.data);
                    ui.done(log);
                }
            }
            ui.log(`0.导入完成，导入${counter}条，共有${Object.keys(conf.materials).length}条语料`, "pass");
            ui.updateDownloadLink("Content"); // 更新导出链接
            util.checkMaterials(); // 检查所有语料的素材是否准备完全
            conf.tasks = []; // 每次导入都清空任务列表，需要重新估算新产生任务列表
        };
        reader.readAsBinaryString(file);
    },

    /*********************/
    // 1.素材翻译
    /*********************/
    async doTranslate() {
        await action.fetchTranslation("chinese", "english"); // 通过翻译api, 中译英，会跳过英语课的词汇
        await action.fetchTranslation("english", "chinese"); // 通过翻译api，英译中
        // 英语词汇，查字典，带词性和多个意思
        for (let line of util.getMaterial((line) => util.isLessonEnglish() && line.type === "word" && line.english && !line.chinese)) {
            await util.updateMaterial(line.id, conf.dict[line.english.toLowerCase()].mean, "chinese");
        }
        ui.log(`1.素材翻译完成`, "pass");
    },

    async fetchTranslation(from, to) {
        // 所有目标语言为空白的字段，跳过英语课的词汇，英语词汇用查字典翻译，带词性和多个意思
        for (let bundle of util.getMaterial((line) => !line[to] && !(util.isLessonEnglish() && line.type === "word"), 10)) {
            ui.log(`开始翻译 id=${bundle[0].id} 开始的一批数据`);
            let ret = await util.fetchApi("api-translate.php", { to: to === "english" ? "en" : "zh", text: bundle.map((line) => line[from]).join("\n") });
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
        let log;
        // 中文课，所有中文使用pinyin接口获得读音
        for (let line of util.getMaterial((line) => line.chinese && !util.isLessonEnglish() && !line.phonetic)) {
            log = ui.log(`标注拼音：${line.chinese}`);
            await util.updateMaterial(line.id, pinyinPro.pinyin(line.chinese.replace(/0|1|2|3|4|5|6|7|8|9/g, (n) => "零一二三四五六七八九"[+n])), "phonetic");
            ui.done(log);
        }
        // 英文课，词汇，查字典获得音标，英文句子不需要拼音或音标
        for (let line of util.getMaterial((line) => line.english && util.isLessonEnglish() && line.type === "word" && !line.phonetic)) {
            log = ui.log(`标注音标：${line.english}`);
            await util.updateMaterial(line.id, conf.dict[line.english.toLowerCase()].accent, "phonetic");
            ui.done(log);
        }
        ui.log(`2.素材标注${conf.info.language === "chinese" ? "拼音" : "音标"}完成`, "pass");
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

    // 生成单个音频
    async genAudioPiece(id, field, force = false) {
        let language = field.match(/_cn/) ? "chinese" : "english",
            text = ui.getCell(id, language).innerText,
            defaultModel = field.match(/1$/) ? "woman" : "man",
            model = util.getModel(language, conf.materials[id]["voice"] || defaultModel);

        if (force || conf.materials[id][`${field}.audio`] === `required`) {
            let basename = `${id}.${field.replace(/media_/, "")}`;
            let log = ui.log(`使用${model}生成语音：${text} -> ${basename}.m4a`),
                rate = language == "chinese" && conf.info.language == "chinese" ? -20 : 0, // 中文课的中文语料，语速减速20%
                ret = await util.fetchApi("api/tts", { basename, text, model, rate });
            if (ret.result === "success") {
                await util.updateMaterial(id, `${basename}.m4a`, "mediafile");
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
            await action.genSlidePiece(line.id, "listen", line.theme);
            await action.genSlidePiece(line.id, "text", line.theme);
        }
        ui.log(`4.字幕素材处理完成`, "pass");
    },

    async genSlidePiece(id, type, theme, force = false) {
        if (force || conf.materials[id][`slide.slide-${type}`] === `required`) {
            let watermark = ((id / 16) | 0) % 4, // 每16行语料，水印换一个位置
                filename = `${id}.${type}.png`;
            let log = ui.log(`生成slide：${filename}`);
            await util.fetchApi("api/slide", { id, filename, theme, language: conf.info.language, type, watermark, svg: +new Date() % 4 });
            await util.updateMaterial(id, filename, "mediafile");
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
                ret = await util.fetchApi("api/ffmpeg", { action: "piece", filename, slidename, audioname });
            if (ret.result === "success") {
                conf.durations[filename] = ret.duration;
                await util.updateMaterial(id, filename, "mediafile");
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
        ui.log(`目标视频名字：${conf.info.dist}.mp4`);
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

        let log = ui.log(`生成作品：${conf.info.dist}.mp4`, "highlight");
        let ret = await util.fetchApi("api/ffmpeg", { action: "concat", filename: `${conf.info.dist}.mp4`, videolist: conf.tasks.join("|") });
        if (ret.result === "success") {
            ui.done(log);
            ui.log(`视频实际长度：${util.fmtDuration(ret.duration)}秒`, "highlight");
            await util.fetchApi("api-project.php", {
                action: "create",
                lesson: conf.info.lesson,
                lesson_cn: conf.lesson[conf.info.lesson].cn,
                lesson_abbr: conf.lesson[conf.info.lesson].abbr,
                program: conf.program[conf.info.program].name,
                startid: conf.range.start,
                endid: conf.range.end,
                duration: util.fmtDuration(ret.duration)
            });
        } else {
            return ui.err(`生成作品 ${conf.info.dist}.mp4 时遇到错误`);
        }
        ui.log(`7.作品已经生成`, "pass");
        util.getProjectid();
        window.open(`media/material/dist/${conf.info.dist}.mp4`, "preview");
    },
    /***********************/
    // 8.存档数据
    /***********************/
    async doArchive() {
        let lesson = conf.lesson[conf.info.lesson].cn,
            log = ui.log(`正在存档 ${lesson}...`, "highlight");
        await util.fetchApi("api-archive.php", { action:"archive", lesson });
        ui.done(log);
        // 如果表格里的素材已经被下载了, 则更新UI, 否则等下载
        ui.log(`8.数据存档完成，刷新页面重新开工。`, "pass");
        ui.log(`记得先导出课件哟`, "pass");
    },


    async doUnarchive(lesson) {
        let log = ui.log(`正在存档 ${lesson}...`, "highlight");
        await util.fetchApi("api-archive.php", { action:"unarchive", lesson });
        ui.done(log);
        // 如果表格里的素材已经被下载了, 则更新UI, 否则等下载
        ui.log(`8.数据存档完成，刷新页面重新开工。`, "pass");
        ui.log(`记得先导出课件哟`, "pass");
    }
};
