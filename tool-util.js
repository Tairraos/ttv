/* global conf, ui */
let util = {
    /*********************/
    // 初始化UI
    /*********************/
    async initMaterial() {
        conf.lesson = {};
        ui.initMaterialsTable();

        conf.info.program = "listen";
        conf.rules = conf.programRules.listen;
        conf.dict = await util.fetchApi("lib/dict.json");
        ui.log("读取到字典数据 " + Object.keys(conf.dict).length + " 条");

        util.ping();
    },

    /*********************/
    // 修改数据，会同时修改界面，内存
    /*********************/
    async updateMaterial(id, data, field, toid = 0) {
        conf.materials[id][field] = data;
        if (conf.dataFields.includes(field)) {
            toid = +toid < +id ? +id : +toid;
            for (let i = +id; i <= toid; i++) {
                ui.getCell(i, field).innerText = data;
            }
        } else if (field === "mediafile") {
            conf.files.push(data);
            util.checkMaterials(); // 检查所有语料的素材是否准备完全
        }
    },

    /*********************/
    // 检查所有语料的素材是否准备完全
    /*********************/
    checkMaterials() {
        let answer = true;
        for (let line of util.getMaterial()) {
            util.checkMedias(line, ["media_cn1", "media_cn2", "media_en1", "media_en2"], ["audio", "video-text", "video-listen"]);
            util.checkMedias(line, ["slide"], ["slide-text", "slide-listen", "video-ding"]);
            let line_ready = util.checkIsReady(line.id);
            answer = answer && line_ready;
        }
        return answer;
    },

    /*********************/
    // 检查medias列表里的素材是否已经生成
    /*********************/
    checkMedias(line, fields, medias) {
        for (let field of fields) {
            for (let media of medias) {
                if (util.checkMediaStatus(line, field, media)) {
                    let filename = util.getMediaFilename(line.id, field, media),
                        is_exist = conf.files.includes(filename);
                    conf.materials[line.id][`${field}.${media}`] = is_exist ? filename : "required";
                    ui.updateCell(line.id, field, media, is_exist ? "exist" : "required");
                } else {
                    delete conf.materials[line.id][`${field}.${media}`];
                    ui.updateCell(line.id, field, media, "ignored");
                }
            }
        }
    },

    /*********************/
    // 检查medias某一个文件是否需要生成
    /*********************/
    checkMediaStatus(line, field, media) {
        let rule = conf.rules[conf.info.language][line.type],
            has = (item) => rule.includes(item),
            key = `${field}.${media}`;
        if (key === "media_cn1.audio") return has("cn1.listen") || has("cn1.text");
        if (key === "media_cn1.video-listen") return has("cn1.listen");
        if (key === "media_cn1.video-text") return has("cn1.text");
        if (key === "media_cn2.audio") return (has("cn2.listen") || has("cn2.text")) && line.voice === "";
        if (key === "media_cn2.video-listen") return has("cn2.listen") && line.voice === "";
        if (key === "media_cn2.video-text") return has("cn2.text") && line.voice === "";
        if (key === "media_en1.audio") return has("en1.listen") || has("en1.text");
        if (key === "media_en1.video-listen") return has("en1.listen");
        if (key === "media_en1.video-text") return has("en1.text");
        if (key === "media_en2.audio") return (has("en2.listen") || has("en2.text")) && line.voice === "";
        if (key === "media_en2.video-listen") return has("en2.listen") && line.voice === "";
        if (key === "media_en2.video-text") return has("en2.text") && line.voice === "";
        if (key === "slide.slide-listen") return (line.group === 0 || line.group === line.id) && (has("cn1.listen") || has("en1.listen"));
        if (key === "slide.slide-text") return has("cn1.text") || has("en1.text");
        if (key === "slide.video-ding") return (line.group === 0 || line.group === line.id) && (has("cn1.listen") || has("en1.listen"));
    },

    /*********************/
    // 从字段名和媒体列表获取素材文件名
    /*********************/
    getMediaFilename(id, field, media) {
        return `${id}.${field}.${media}`
            .replace(/media_([ce]n\d)\.audio$/, "$1.m4a") // 1.media_cn1.audio => 1.cn1.m4a
            .replace(/media_([ce]n\d)\.video-(\w+)$/, "$1.$2.mp4") // 1.media_cn1.video-text => 1.cn1.text.mp4
            .replace(/slide\.video-(\w+)$/, "$1.mp4") // 1.slide.video-ding => 1.ding.mp4
            .replace(/slide\.slide-(\w+)$/, "$1.png"); // 1.slide.slide-text => 1.text.png
    },

    /*********************/
    // 从voice和basename获取素材文件名
    /*********************/
    getTaskFilename(id, voice, basename) {
        // 如果voide不为空，则第2套音频不存在，把2换成1，用第1套代替
        return `${id}.${voice !== "" ? basename.replace(/2/, "1") : basename}.mp4`;
    },

    /*********************/
    // 根据规则生成作品编译需要的Task列表
    /*********************/
    getTasksList() {
        let result = [],
            blocks = util.getMaterialByGroup(util.getMaterial()),
            rule = conf.rules[conf.info.language];

        for (let block of blocks) {
            for (let setup of rule[block[0].type]) {
                if (setup === "ding") {
                    result.push(`${block[0].id}.ding.mp4`);
                } else {
                    result.push(...block.map((line) => util.getTaskFilename(line.id, line.voice, setup)));
                }
            }
        }
        return result;
    },

    /*********************/
    // 检查当前行是否所有素材都准备好了, media或slide有一个是required就说明没准备好
    /*********************/
    checkIsReady(id) {
        return !Object.entries(conf.materials[id]).filter((item) => item[0].match(/^(media|slide)/) && item[1] === "required").length;
    },

    /*********************/
    // 检查素材时长
    /*********************/
    async checkMaterialDuration() {
        let log = ui.log(`素材时长已经统计完成。`, "pass");

        for (let line of util.getMaterial()) {
            for (let item of Object.keys(line).filter((item) => item.match(/video-/) && line[item])) {
                let filename = line[item];
                if (!conf.durations[filename]) {
                    let ret = await util.fetchApi("api/ffmpeg", { action: "duration", filename }),
                        log = ui.log(`检查视频长度：${filename}`);
                    if (ret.result === "success") {
                        conf.durations[filename] = ret.duration;
                        ui.done(log);
                    }
                }
            }
        }
        ui.done(log);
    },

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
            ret = await util.fetchApi("api/ping");
        if (ret.result === "success") {
            ui.done(log);
        }
    },

    /*********************/
    // 根据条件从所有记录中过滤，并按指定size打包（size打包用于批量翻译，节约时间）
    /*********************/
    getMaterial(condition, size) {
        let validMaterials = Object.values(conf.materials).filter((line) => line.id >= conf.range.start && line.id <= conf.range.end);
        let lines = condition ? validMaterials.filter(condition) : validMaterials;
        return size ? Array.from({ length: Math.ceil(lines.length / size) }, (_, i) => lines.slice(i * size, i * size + size)) : lines;
    },

    /*********************/
    // 获取azure语音模型名字
    /*********************/
    getModel: (language, character) => `${language === "english" ? "en-US" : "zh-CN"}-${conf.voice[language][character]}Neural`,

    /*********************/
    // 当前课程是否英语课程
    /*********************/
    isBookEnglish: () => !conf.info.book_en.match(/chinese/i),

    /*********************/
    // 格式化视频时长
    /*********************/
    fmtDuration: (s) => ("0" + Math.floor(s / 60)).slice(-2) + ":" + ("0" + Math.floor(s % 60)).slice(-2) + (s % 1).toFixed(1).slice(1),

    /*********************/
    // 按line.group打包放进新数组
    /*********************/
    getMaterialByGroup(materials) {
        let result = {};
        for (let line of materials) {
            let group = line.group || line.id;
            result[group] = group === 0 ? [line] : (result[group] = result[group] ? [...result[group], line] : [line]);
        }
        return Object.values(result);
    },

    /*********************/
    // 生成音频配置
    /*********************/
    getMediaSetup(id, language) {
        let line = conf.materials[id],
            abbr = language === "chinese" ? "cn" : "en";
        return line.voice !== "" ? [`media_${abbr}1`] : [`media_${abbr}1`, `media_${abbr}2`];
    },

    /*********************/
    // 获取下一本书的ID，没有容错，dist目录不能有除生成视频外的其它文件
    /*********************/
    getNewBookName() {
        return `${conf.info.book_abbr}-${(conf.info.maxid + 1).toString().padStart(3, "0")}`;
    }
};
