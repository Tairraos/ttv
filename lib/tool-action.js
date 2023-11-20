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
                    type = "sentence";
                    ui.log(`句子模式`);
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
        conf.info.issues = []; // 未准备好的数据
        conf.info.duration = 0;
        conf.tasks = []; // 清空所有的task

        await action.genNoimgSlide(); // 生成 叮 slide
        await action.checkTableData(); //检查表格所列数据是否都准备好
        if (conf.info.issues.length) {
            return ui.err(`素材准备未完成，请检查：${conf.info.issues.join(",")}`);
        }
        await action.calcDuration();
        for (let lines of action.getLinesByGroup()) {
            action.generateTask(lines);
        }
        action.readyToGo();
    },

    genNoimgSlide: async function () {
        let log = ui.log(`生成slide：${conf.info.theme}.notext.png`);
        await util.fetchApi("api/slide", { filename: `${conf.info.theme}.png`, theme: conf.info.theme, lesson: conf.info.lesson });
        conf.info.notextImg = `${conf.info.theme}.png`;
        ui.done(log);
    },

    checkTableData: async function () {
        for (let line of util.getMaterial(() => true)) {
            let row = document.getElementById("material-" + line.id),
                fp = fieldsList.map((item) => +!!line[item]).join("");
            let log = ui.log(`检查数据 id=${line.id}`);
            if (
                (conf.info.lesson === "chinese" && line.type === "sentence" && fp.match(/^11.11111111/)) ||
                (conf.info.lesson === "chinese" && line.type === "word" && fp.match(/^11.11111111/)) ||
                (conf.info.lesson === "english" && line.type === "sentence" && fp.match(/^11.11111111/)) ||
                (conf.info.lesson === "english" && line.type === "word" && fp.match(/^11.11100111/))
            ) {
                !line.isready && (await util.updateMaterial(line.id, "yes", "isready"));
                row.classList.add("ready");
                ui.done(log);
            } else {
                line.isready && (await util.updateMaterial(line.id, "", "isready"));
                row.classList.remove("ready");
                conf.info.issues.push(line.id);
                continue;
            }
        }
    },

    calcDuration: function () {
        conf.info.duration = 0;
    },

    getProgram: function (lesson, type) {
        let rules = {
            chinese: {
                sentence: ["ding,0", "cn_female,0", "cn_male,0", "en_female,1", "cn_female,2", "cn_male,2"],
                word: ["cn_female,1", "cn_male,1", "en_female,1"]
            },
            english: {
                sentence: ["ding,0", "en_female,0", "en_male,0", "cn_female,1", "en_female,2", "en_male,2"],
                word: ["en_female,1", "en_male,1"]
            } // ,0表示无字幕朗读, ,1表示带字幕解释含义，2表示带字幕朗读
        };
        return rules[lesson][type];
    },

    getLinesByGroup: function () {
        let list = util.getMaterial(() => true),
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

    generateTask: function (lines) {
        let program = action.getProgram(conf.info.lesson, lines[0].type),
            buff = {};
        program.forEach((rule) => (buff[rule] = [])); // 初始化，准备和rule数量一样多的数组
        for (let line of lines) {
            program.forEach((rule, index) => {
                let [field, type] = rule.split(","),
                    target = `${line.id}.${index}.mp4`,
                    mp3name = field === "ding" ? conf.info.dingmp3 : line[field], // 不同的rule使用不同的mp3
                    slidename = type === "0" ? conf.info.notextImg : line.slide; // 不同的rule使用不同的slide
                buff[rule].push({ target, mp3name, slidename }); //为每条rule生成一个任务
            });
        }
        conf.tasks.push(
            ...program.reduce((target, rule) => {
                target.push(...(rule === "ding,0" ? buff[rule].slice(0, 1) : buff[rule]));
                return target; // 按照program里，rule的顺序，生成task，主要是为了group考虑
            }, [])
        );
    },

    readyToGo: function () {
        ui.enableGenVideoBtn();
        ui.log(`素材检查通过，可以开始生成视频。`, "pass");
        ui.log(`视频名字：${conf.info.theme}.mp4`);
        ui.log(`视频长度预计：${conf.info.duration}秒`);
        ui.log(`视频素材数量：${conf.tasks.length}`);
    },

    /*********************/
    // 6.生成视频
    /*********************/
    doGenVideo: async function () {
        let log, ret;
        for (let line of conf.tasks) {
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
            mp4list: conf.tasks.map((t) => t.target).join("|")
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
