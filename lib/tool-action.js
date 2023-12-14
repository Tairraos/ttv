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
                cacheGroup = 0,
                group = 0;

            if (range.e.c < 6) {
                ui.err(`拖入的文件列数不对: "${file.name}"`);
                return;
            }
            let g = (r) => (w[r] ? w[r].v : "");
            for (let row = 2; row <= range.e.r + 1; row++) {
                if (g(`A${row}`) !== "") {
                    let id = ui.useCustomId() ? g(`A${row}`) : ++conf.maxid,
                        lesson = conf.info.lesson,
                        type = g(`B${row}`).match(/词语|词汇|词组|短语|单词|word/) ? "word" : "sentence",
                        voice = g(`D${row}`),
                        chinese = g(`E${row}`),
                        english = g(`F${row}`),
                        phonetic = g(`G${row}`),
                        log = ui.log(`导入 ${chinese || english}...`),
                        xlsxGroup = +g(`C${row}`);

                    group = xlsxGroup === 0 ? 0 : xlsxGroup !== cacheGroup ? id : group;
                    cacheGroup = xlsxGroup;
                    let ret = await util.fetchApi("api-material.php", { id, lesson, type, voice, group, chinese, english, phonetic });
                    ret.result === "success" && ui.loadMaterial(ret.data);
                    ui.done(log);
                }
            }
            ui.log(`导入完成，共有${range.e.r}条语料`);
            conf.contentDownloaded = false;
            ui.updateDownloadLink("Content");
        };
        reader.readAsBinaryString(file);
    },

    /*********************/
    // 1.素材翻译
    /*********************/
    async doTranslate() {
        await action.fetchTranslation("chinese", "english"); // 通过翻译api, 中译英，会跳过英语课的词汇
        await action.fetchTranslation("english", "chinese"); // 通过翻译api，英译中
        // 英语课，词汇，只有英文没有中文，查字典翻译出中文（需要音标和词性，所以不能让ai翻译）
        for (let line of util.getMaterial((line) => util.isLessonEnglish() && line.type === "word" && line.english && !line.chinese)) {
            await util.updateMaterial(line.id, conf.dict[line.english.toLowerCase()].mean, "chinese");
        }
    },

    async fetchTranslation(from, to) {
        // 所有目标语言为空白的字段，跳过英语课的词汇
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
    // 3.生成语音
    /*********************/
    async doGenAudio() {
        for (let line of util.getMaterial()) {
            await action.genAudioPiece(line.id, "chinese", false); //生成中文语音
            await action.genAudioPiece(line.id, "english", false); //生成英文语音
        }
    },

    async genAudioPiece(id, language, force = false) {
        let text = ui.getCell(id, language).innerText,
            setup = util.getAudioSetup(id, language);
        for (let item of setup) {
            let filename = ui.getCell(id, item.target).innerText;
            if (force || filename === "") {
                await action.createAudio(id, text, item.model, item.target);
            } else {
                let ret = await util.fetchApi("api-check", { filename });
                if (ret.found !== "yes") {
                    await action.createAudio(id, text, item.model, item.target);
                } else {
                    ui.log(`目标音频已存在：${filename}`);
                }
            }
        }
    },

    async createAudio(id, text, model, field) {
        let basename = `${id}.${field}`;
        let log = ui.log(`使用${model}生成语音：${text} -> ${basename}.m4a`),
            ret = await util.fetchApi("api/tts", { basename, text, model });
        if (ret.result === "success") {
            await util.updateMaterial(id, `${basename}.m4a`, field);
            ui.done(log);
        } else {
            return ui.err(`发生错误 ${JSON.stringify(ret)}`);
        }
    },

    /*********************/
    // 4.生成slide
    /*********************/
    async doCaptureSlide() {
        for (let line of util.getMaterial((line) => !line.slide)) {
            let log,
                filename,
                watermark = ((line.id / 16) | 0) % 4, // 每16行语料，水印换一个位置
                theme = conf.info.theme,
                language = util.getLanguage();
            filename = `${line.id}.text.png`;
            log = ui.log(`生成slide：${filename}`);
            await util.fetchApi("api/slide", { filename, theme, language, type: "text", watermark, id: line.id });
            await util.updateMaterial(line.id, filename, "slide");
            ui.done(log);
            filename = `${line.id}.ding.png`;
            log = ui.log(`生成slide：${filename}`);
            await util.fetchApi("api/slide", { filename, theme, language, type: "slide", watermark, svg: +new Date() % 4 }); // 随机 svg
            ui.done(log);
        }
    },

    /*********************/
    // 5.准备任务
    /*********************/
    async doPrepare() {
        conf.info.issues = []; // 未准备好的数据
        conf.info.duration = 0;
        conf.tasks = []; // 清空所有的task

        await action.checkTableData(); //检查表格所列数据是否都准备好
        if (conf.info.issues.length) {
            return ui.err(`素材准备未完成，请检查：${conf.info.issues.join(",")}`);
        }
        for (let lines of action.getLinesByGroup()) {
            action.generateTask(lines);
        }
        await action.calcDuration();
        action.readyToGo();
    },

    async checkTableData() {
        for (let line of util.getMaterial()) {
            let row = ui.getRow(line.id),
                fp = conf.fieldList.map((item) => +!!line[item]).join("");
            let log = ui.log(`检查数据 id=${line.id}`);
            // 每一列值会转成一串01字串，第 567 列 chinese, english, phonetic 需要有值，audio四个字段需要至少有2个字段有值，slide字段需要有值
            if (fp.match(/^.....11.(1111|1010|0101)1.$/)) {
                !line.isready && (await util.updateMaterial(line.id, "yes", "isready"));
                row.classList.add("ready");
                ui.done(log);
            } else {
                line.isready && (await util.updateMaterial(line.id, "", "isready"));
                row.classList.remove("ready");
                conf.info.issues.push(line.id);
            }
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
            let noTxtSlide = action.getNotextImg();
            program.forEach((rule, index) => {
                let [field, type] = rule.split(","),
                    target = `${line.id}.${index}.mp4`,
                    audioname = field === "ding" ? "DING" : line[field], // 不同的rule使用不同的audio
                    slidename = type === "0" ? noTxtSlide : line.slide; // 不同的rule使用不同的slide
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

    getNotextImg() {
        return conf.info.notextImg[Math.floor(Math.random() * conf.info.notextImg.length)]; // 从conf.info.notextImg里随机取一个值返回
    },

    readyToGo() {
        ui.enableGenVideoBtn();
        ui.log(`素材检查通过，可以开始生成视频。`, "pass");
        ui.log(`目标视频名字：${conf.info.theme}.mp4`);
        ui.log(`视频长度预计：${conf.info.duration}秒`);
        ui.log(`视频片段计数：${conf.tasks.length}`);
    },

    /*********************/
    // 6.生成视频
    /*********************/
    async doGenVideo() {
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
    // 7.清理数据
    /***********************/
    async doArchive() {
        let log = ui.log(`正在存档 ${conf.info.theme}...`, "highlight");
        await util.fetchApi("api-archive.php", { projectid: conf.info.projectid, lesson: conf.info.lesson, theme: conf.info.theme });
        ui.done(log);
        // 如果表格里的素材已经被下载了, 则更新UI, 否则等下载
        if (conf.exported) {
            ui.clearMaterials(); // 清空表格UI
            ui.syncProject(); // 更新工程编号
            ui.log(`存档完成，界面清理完成，请继续使用。`, "pass");
        } else {
            ui.log(`存档完成，保留界面，可导保存素材。`, "pass");
        }
    },

    /*********************/
    // x.导出素材
    /*********************/
    async doExport() {
        conf.exported = true;
    }
};
