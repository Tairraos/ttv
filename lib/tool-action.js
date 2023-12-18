/* global conf, util, ui, pinyinPro, XLSX */

let action = {
    /*********************/
    // 同步project表数据
    /*********************/
    async syncProject(projectid, lesson, theme, duration = 0) {
        return await util.fetchApi("api-project.php", { projectid, lesson, theme, duration });
    },

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
                last_group = 0,
                group = 0;

            if (range.e.c < 6) {
                return ui.err(`拖入的文件列数不对: "${file.name}"`);
            }
            let g = (r) => (w[r] ? w[r].v : "");
            for (let row = 2; row <= range.e.r + 1; row++) {
                if (g(`A${row}`) !== "") {
                    let id = ui.useCustomId() ? g(`A${row}`) : ++conf.maxid,
                        lesson = conf.info.lesson,
                        type = g(`B${row}`)
                            .replace(/词语|词汇|词组|短语|单词/, "word")
                            .replace(/句子|句型/, "sentence")
                            .replace(/故事|短文/, "story"),
                        voice = g(`D${row}`),
                        chinese = g(`E${row}`),
                        english = g(`F${row}`),
                        phonetic = g(`G${row}`),
                        log = ui.log(`导入 ${chinese || english}...`),
                        current_group = +g(`C${row}`);
                    group = current_group === 0 ? 0 : current_group !== last_group ? id : group;
                    last_group = current_group;
                    let ret = await util.fetchApi("api-material.php", { id, lesson, type, voice, group, chinese, english, phonetic });
                    ret.result === "success" && ui.loadMaterial(ret.data);
                    ui.done(log);
                }
            }
            ui.log(`导入完成，共有${range.e.r}条语料`);
            ui.updateDownloadLink("Content"); // 更新导出链接
            util.checkMaterials(); // 检查数据完整性
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
        for (let line of util.getMaterial((line) => line.chinese && util.isLessonChinese() && !line.phonetic)) {
            log = ui.log(`标注拼音：${line.chinese}`);
            await util.updateMaterial(line.id, pinyinPro.pinyin(line.chinese), "phonetic");
            ui.done(log);
        }
        // 英文课，词汇，查字典获得音标，英文句子不需要拼音或音标
        for (let line of util.getMaterial((line) => line.english && util.isLessonEnglish() && line.type === "word" && !line.phonetic)) {
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
    },

    // ui, 对单个语料生成音频的按钮动作
    async doGenAudioPiece() {
        await action.genSetupAudioPiece(conf.edit.id, conf.edit.language, true); //force=true,覆盖生成
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
            defaultModel = field.match(/1$/) ? "man" : "woman",
            model = util.getModel(language, conf.materials[id]["voice"] || defaultModel);

        if (force || conf.materials[id][`${field}.audio`] === `required`) {
            let basename = `${id}.${field.replace(/media_/, "")}`;
            let log = ui.log(`使用${model}生成语音：${text} -> ${basename}.m4a`),
                ret = await util.fetchApi("api/tts", { basename, text, model });
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
        for (let line of util.getMaterial()) {
            await action.genSlidePiece(line.id, "text");
            await action.genSlidePiece(line.id, "listen");
        }
    },

    async genSlidePiece(id, type, force = false) {
        if (force || conf.materials[id][`slide.slide-${type}`] === `required`) {
            let watermark = ((id / 16) | 0) % 4, // 每16行语料，水印换一个位置
                theme = conf.info.theme,
                language = util.getLanguage(),
                filename = `${id}.${type}.png`;
            let log = ui.log(`生成slide：${filename}`);
            await util.fetchApi("api/slide", { id, filename, theme, language, type, watermark });
            await util.updateMaterial(id, filename, "mediafile");
            ui.done(log);
        }
    },

    /*********************/
    // 5.视频素材
    /*********************/
    async doGenVideo() {
        for (let line of util.getMaterial()) {
            for (let [field, target] of Object.keys(line)
                .filter((item) => item.match(/video-/) && line[item])
                .map((item) => item.split("."))) {
                await action.genVideoPiece(line.id, field, target);
            }
        }
    },

    async genVideoPiece(id, field, target, force = false) {
        if (force || conf.materials[id][`${field}.${target}`] === `required`) {
            let filename = util.getMediaFilename(id, field, target),
                audioname = target === "video-ding" ? "DING" : conf.materials[id][`${field}.audio`],
                slidename = conf.materials[id][`slide.slide-${target === "video-text" ? "text" : "listen"}`],
                log = ui.log(`生成视频片段：${filename}`),
                ret = await util.fetchApi("api/ffmpeg", { action: "piece", filename, slidename, audioname });
            if (ret.result === "success") {
                conf.info.duration[filename] = ret.duration;
                await util.updateMaterial(id, filename, "mediafile");
                ui.done(log);
            }
        }
    },

    /*********************/
    // 6.工程估算
    /*********************/
    async doEstimate() {
        if (util.checkMaterials()) {
            ui.log(`素材检查通过，可以开始生成视频。`, "pass");

            for (let line of util.getMaterial()) {
                for (let item of Object.keys(line).filter((item) => item.match(/video-/) && line[item])) {
                    let filename = line[item],
                        ret = await util.fetchApi("api/ffmpeg", { action: "duration", filename }),
                        log = ui.log(`检查视频长度：${filename}`);
                    if (ret.result === "success") {
                        conf.info.duration[filename] = ret.duration;
                        ui.done(log);
                    }
                }
            }

            ui.log(`目标视频名字：${conf.info.theme}.mp4`);
            ui.log(`视频长度预计：${conf.info.duration}秒`);
            ui.log(`视频片段计数：${conf.tasks.length}`);
        } else {
            ui.log(`素材未准备完整，无法生成视频。`, "error");
        }
    },

    async calcDuration() {
        let log = ui.log(`计算视频任务列表总时长`);
        let result = await util.fetchApi("api/ffmpeg", { action: "duration", audiolist: conf.tasks.map((s) => s.audio).join("|") });
        conf.info.duration = result.duration;
        ui.done(log);
    },

    getProgram(language, type) {
        let rules = {
            chinese: {
                story: [],
                sentence: ["ding,0", "media_cn2,0", "media_cn1,0", "media_en2,2", "media_cn2,1", "media_cn1,1"],
                word: ["media_cn2,1", "media_cn1,1", "media_en2,2"]
            },
            english: {
                story: [],
                sentence: ["ding,0", "media_en2,0", "media_en1,0", "media_cn2,2", "media_en2,1", "media_en1,1"],
                word: ["media_en2,1", "media_en1,1"]
            } // ,0表示无字幕朗读，1表示带字幕朗读，2表示带字幕解释含义
        };
        return rules[language][type];
    },

    getLinesByGroup() {
        let list = util.getMaterial(),
            result = {};

        for (const item of list) {
            const group = item.group;
            if (group === 0) {
                result[item.id] = [item];
            } else {
                if (!result[group]) {
                    result[group] = [];
                }
                result[group].push(item);
            }
        }

        return Object.values(result);
    },

    generateTask(lines) {
        let program = action.getProgram(util.getLanguage(), lines[0].type),
            buff = {};
        program.forEach((rule) => (buff[rule] = [])); // 初始化，准备和rule数量一样多的数组
        for (let line of lines) {
            program.forEach((rule, index) => {
                let [field, type] = rule.split(","),
                    target = `${line.id}.${index}.mp4`,
                    audioname = field === "ding" ? "DING" : line[field], // 不同的rule使用不同的audio
                    slidename = type === "0" ? line.slide_ding : line.slide_text; // 不同的rule使用不同的slide
                buff[rule].push({ target, audioname, slidename }); //为每条rule生成一个任务
            });
        }
        conf.tasks.push(
            ...program.reduce((target, rule) => {
                target.push(...(rule === "ding,0" ? buff[rule].slice(0, 1) : buff[rule]));
                return target; // 按照program里，rule的顺序，生成task，主要是为了group考虑
            }, [])
        );
    },
    /*********************/
    // 7.生成作品
    /*********************/
    async doBuild() {
        let log, ret;
        for (let i = 0; i < conf.tasks.length; i++) {
            let line = conf.tasks[i];
            log = ui.log(`生成视频：${line.target} (${(((i + 1) / conf.tasks.length) * 100).toFixed(2)}%)`);
            ret = await util.fetchApi("api/ffmpeg", Object.assign({ action: "piece" }, line));
            if (ret.result === "success") {
                ui.done(log);
            } else {
                return ui.err(`生成 ${line.target} 时遇到错误`);
            }
        }
        log = ui.log(`拼接完整视频：${conf.info.theme}.mp4`, "highlight");
        ret = await util.fetchApi("api/ffmpeg", { action: "video", target: `${conf.info.theme}.mp4`, videolist: conf.tasks.map((t) => t.target).join("|") });
        if (ret.result === "success") {
            ui.done(log);
            ui.log(`视频实际长度：${ret.duration}秒`, "highlight");
            await util.fetchApi("api-project.php", {
                action: "update",
                projectid: conf.info.projectid,
                lesson: conf.info.lesson,
                theme: conf.info.theme,
                duration: ret.duration
            });
        } else {
            return ui.err(`拼接完整视频 ${conf.info.theme}.mp4 时遇到错误`);
        }

        window.open(`media/dist/${conf.info.theme}.mp4`, "preview");
    },
    /***********************/
    // 8.存档数据
    /***********************/
    async doArchive() {
        let log = ui.log(`正在存档 ${conf.info.theme}...`, "highlight");
        await util.fetchApi("api-archive.php", { projectid: conf.info.projectid, lesson: conf.info.lesson, theme: conf.info.theme });
        ui.done(log);
        // 如果表格里的素材已经被下载了, 则更新UI, 否则等下载
        ui.log(`存档完成，刷新页面开始新工程。`, "pass");
    }
};
