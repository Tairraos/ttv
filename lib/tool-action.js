/* global ui,util,conf,pinyinPro */
let fieldsList = ["id", "type", "group", "chinese", "english", "phonetic", "cn_male", "cn_female", "en_male", "en_female", "slide", "isready"];

let action = {
    /*********************/
    // 同步project表数据
    /*********************/
    syncProject: async function (projectid, lesson, duration = 0) {
        return await util.fetchApi("api-project.php", { projectid: projectid, lesson: lesson, duration: duration });
    },

    /*********************/
    // 拖放导入数据
    /*********************/
    doImportMaterials: function (file) {
        if (!file.name.match(/\.txt$/)) {
            return ui.err(`无法处理：[${file.name}]`);
        }
        ui.log(`开始导入 ${file.name}...`);
        let reader = new FileReader();
        reader.onload = async function (e) {
            let lines = e.target.result.split(/[\r\n]+/).map((line) => line.trim()),
                type = "sentence",
                group = 0;

            for (let line of lines) {
                if (line.match(/^~word/)) {
                    type = "word";
                    ui.log(`词汇模式`);
                } else if (line.match(/^~sentence/)) {
                    type = "sentence";
                    ui.log(`句子模式`);
                } else if (line.match(/^\{/)) {
                    group = conf.maxid + 1;
                    ui.log(`分组开始：${group}`);
                } else if (line.match(/^\}/)) {
                    ui.log(`分组结束：${group}`);
                    group = 0;
                } else if (!line.match(/^[~#{}]/) && line.length) {
                    let log = ui.log(`导入 ${line}...`),
                        data = line.split("|"),
                        ret = await util.fetchApi("api-material.php", { id: ++conf.maxid, type: type, group: group, chinese: data[0], english: data[1] || "" });
                    ret.result === "success" && ui.loadMaterial(ret.data);
                    ui.done(log);
                }
            }
        };
        reader.readAsText(file);
    },

    /*********************/
    // 1.素材翻译
    /*********************/
    doTranslate: async function () {
        await action.fetchTranslation("chinese", "english"); // 通过翻译api, 中译英，会跳过英语课的词汇
        await action.fetchTranslation("english", "chinese"); // 通过翻译api，英译中
        // 英语课，词汇，只有英文没有中文，查字典翻译出中文（需要音标和词性，所以不能让ai翻译）
        for (let line of util.getMaterial((line) => conf.info.lesson === "english" && line.type === "word" && line.english && !line.chinese)) {
            await util.updateMaterial(line.id, conf.dict[line.english.toLowerCase()].mean, "chinese");
        }
    },

    fetchTranslation: async function (from, to) {
        // 所有目标语言为空白的字段，跳过英语课的词汇
        for (let bundle of util.getMaterial((line) => !line[to] && !(conf.info.lesson === "english" && line.type === "word"), 10)) {
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
    doGenPhonetic: async function () {
        let log;
        // 中文课，所有中文使用pinyin接口获得读音
        for (let line of util.getMaterial((line) => line.chinese && conf.info.lesson === "chinese" && !line.phonetic)) {
            log = ui.log(`标注拼音：${line.chinese}`);
            await util.updateMaterial(line.id, pinyinPro.pinyin(line.chinese), "phonetic");
            ui.done(log);
        }
        // 英文课，词汇，查字典获得音标，英文句子不需要拼音或音标
        for (let line of util.getMaterial((line) => line.english && conf.info.lesson === "chinese" && line.type === "word" && !line.phonetic)) {
            log = ui.log(`标注音标：${line.english}`);
            await util.updateMaterial(line.id, conf.dict[line.english.toLowerCase()].accent, "phonetic");
            ui.done(log);
        }
    },

    /*********************/
    // 3.语音MP3
    /*********************/
    doGenAudio: async function () {
        for (let line of util.getMaterial(() => true)) {
            if (!line.cn_male && !(conf.info.lesson === "english" && line.type === "word")) {
                await action.createMp3(line.id, line.chinese, conf.voice.cn.male, `${line.id}.cn_male.mp3`, "cn_male");
            }
            if (!line.cn_female && !(conf.info.lesson === "english" && line.type === "word")) {
                await action.createMp3(line.id, line.chinese, conf.voice.cn.female, `${line.id}.cn_female.mp3`, "cn_female");
            }
            if (!line.en_male) {
                await action.createMp3(line.id, line.english, conf.voice.en.male, `${line.id}.en_male.mp3`, "en_male");
            }
            if (!line.en_female) {
                await action.createMp3(line.id, line.english, conf.voice.en.female, `${line.id}.en_female.mp3`, "en_female");
            }
        }
    },

    createMp3: async function (id, content, voide, filename, field) {
        let log = ui.log(`生成MP3：${filename}`),
            ret = await util.fetchApi("api/tts", {
                filename: filename,
                text: content,
                voice: voide
            });
        if (ret.result === "success") {
            await util.updateMaterial(id, filename, field);
            // await util.updateMaterial(id, +ret.duration, "cn_len");
            ui.done(log);
        } else {
            return ui.err(`发生错误 ${JSON.stringify(ret)}`);
        }
    },

    /*********************/
    // 4.生成slide
    /*********************/
    doCaptureSlide: async function () {
        for (let line of util.getMaterial((line) => !line.slide)) {
            let filename = `${line.id}.png`,
                log = ui.log(`生成slide：${filename}`);
            await util.fetchApi("api/slide", { id: line.id, filename: filename, theme: conf.info.theme, lesson: conf.info.lesson });
            await util.updateMaterial(line.id, filename, "slide");
            ui.done(log);
        }
    },

    /*********************/
    // 5.准备任务
    /*********************/
    doPrepare: async function () {
        let log;
        conf.info.members = []; // 视频成员，已经准备好的数据
        conf.info.issues = []; // 未准备好的数据
        conf.info.duration = 0;
        conf.taskImg2Mp4 = []; // 图和mp3生成视频片段的任务在此
        conf.taskMp42Mp4 = []; // 合并视频片段的过程任务在此

        // 生成 叮 slide
        log = ui.log(`生成slide：${conf.info.theme}.notext.png`);
        await util.fetchApi("api/slide", { filename: `${conf.info.theme}.png`, theme: conf.info.theme, lesson: conf.info.lesson });
        conf.info.notextImg = `${conf.info.theme}.png`;
        ui.done(log);

        for (let line of util.getMaterial(() => true)) {
            let row = document.getElementById("material-" + line.id),
                fp = line.type + fieldsList.map((item) => +!!line[item]).join("");
            log = ui.log(`检查数据 id=${line.id}`);
            if (fp.match(/cn111111111111/)) {
                conf.info.duration += 0.5 + line.cn_len + line.cn_len + line.en_len + line.speed_len;
                action.addTask(line.id, "0.ding", conf.info.dingmp3, conf.info.notextImg); // 叮
                action.addTask(line.id, "1.cn.notext", line.cn_mp3file, conf.info.notextImg); // 常速中文 + 无文字
                action.addTask(line.id, "2.cn.normal", line.cn_mp3file, line.slide); // 常速中文 + 字幕
                action.addTask(line.id, "3.en.normal", line.en_mp3file, line.slide); // 常速英文 + 字幕
                action.addTask(line.id, "4.cn.fast", line.speed_mp3file, line.slide); // 快速中文 + 字幕
            } else if (fp.match(/cw111111111001/)) {
                conf.info.duration += line.cn_len + line.en_len;
                action.addTask(line.id, "1.cn.normal", line.cn_mp3file, line.slide); // 常速中文 + 字幕
                action.addTask(line.id, "2.en.normal", line.en_mp3file, line.slide); // 常速英文 + 字幕
            } else if (fp.match(/en111101111111/)) {
                conf.info.duration += 0.5 + line.en_len + line.en_len + line.cn_len + line.speed_len;
                action.addTask(line.id, "0.ding", conf.info.dingmp3, conf.info.notextImg); // 叮
                action.addTask(line.id, "1.en.notext", line.en_mp3file, conf.info.notextImg); // 常速英文 + 无文字
                action.addTask(line.id, "2.en.normal", line.en_mp3file, line.slide); // 常速英文 + 字幕
                action.addTask(line.id, "3.cn.normal", line.cn_mp3file, line.slide); // 常速中文 + 字幕
                action.addTask(line.id, "4.en.fast", line.speed_mp3file, line.slide); // 快速英文 + 字幕
            } else if (fp.match(/ew111110011001/)) {
                conf.info.duration += line.en_len;
                action.addTask(line.id, "1.en.normal", line.en_mp3file, line.slide); // 常速英文 + 字幕
            } else {
                line.isready && (await util.updateMaterial(line.id, "", "isready"));
                row.classList.remove("ready");
                conf.info.issues.push(line.id);
                continue;
            }
            !line.isready && (await util.updateMaterial(line.id, "yes", "isready"));
            row.classList.add("ready");
            conf.info.members.push(line.id);
            ui.done(log);
        }

        if (conf.info.issues.length) {
            return ui.err(`素材准备未完成，表格需要全绿才通过。`);
        }
        ui.enableGenVideoBtn();
        ui.log(`素材检查通过，可以开始生成视频。`, "pass");
        ui.log(`视频名字：${conf.info.theme}.mp4`);
        ui.log(`视频长度预计：${conf.info.duration}秒`);
        ui.log(`视频数据条数：${conf.info.members.length}条`);
        ui.log(`视频素材数量：${conf.taskImg2Mp4.length}`);
    },

    addTask: function (id, key, mp3name, slidename) {
        conf.taskImg2Mp4.push({
            target: `${id}.${key}.mp4`,
            mp3name: mp3name,
            slidename: slidename
        });
        conf.taskMp42Mp4.push(`${id}.${key}.mp4`);
    },

    /*********************/
    // 6.生成视频
    /*********************/
    doGenVideo: async function () {
        let log, ret;
        for (let line of conf.taskImg2Mp4) {
            log = ui.log(`生成视频：${line.target}`);
            ret = await util.fetchApi("api/ffmpeg", Object.assign({ action: "slide" }, line));
            if (ret.result === "success") {
                ui.done(log);
            } else {
                return ui.err(`生成 ${line.target} 时遇到错误`);
            }
        }
        log = ui.log(`拼接完整视频：${conf.info.theme}.mp4`, "highlight");
        ret = await util.fetchApi("api/ffmpeg", {
            action: "mp4",
            target: `${conf.info.theme}.mp4`,
            mp4list: conf.taskMp42Mp4.join("|")
        });
        if (ret.result === "success") {
            ui.done(log);
        } else {
            return ui.err(`拼接完整视频 ${conf.info.theme}.mp4 时遇到错误`);
        }
    },

    /*********************/
    // 7.复制课件
    /*********************/
    doGenNotes: async function () {
        let counter = 1,
            content = [];
        for (let line of util.getMaterial(() => true)) {
            if (line.type === "cn" || line.type === "cw") {
                content.push(`${counter++}\n${line.chinese}\n${line.phonetic}\n${line.english}\n`);
            } else if (line.type === "en") {
                content.push(`${counter++}\n${line.english}\n${line.chinese}\n`);
            } else if (line.type === "ew") {
                content.push(`${counter++}\n${line.english}\n${line.phonetic}\n${line.chinese}\n`);
            }
        }
        navigator.clipboard.writeText(content.join("\n"));
    },

    /***********************/
    // 8.清理
    /***********************/
    doArchive: function () {}
};
