/* global conf, ui, XLSX */
let util = {
    /*********************/
    // 初始化数据，从数据库里读入
    /*********************/
    async initMaterial() {
        let ret = await util.fetchApi("api-data.php");

        ui.initLessonSelector();
        ui.initMaterialsTable();

        conf.files = (await util.fetchApi("api-check.php")).files;
        ui.putInputData("projectid", localStorage.getItem("projectid") || "0001"); // 用localstorage里的值填入
        ui.putSelectData("lesson", localStorage.getItem("lesson") || "Living Chinese"); // 用localstorage里的值填入
        await ui.syncProject(); // 同步工程，获取maxid

        if (ret.result === "success") {
            ret.data.forEach((line) => ui.loadMaterial(line));
            util.checkMaterials(); // 检查所有语料的素材是否准备完全
            ui.log("读取到内容数据 " + ret.data.length + " 条");
            ui.updateDownloadLink("Content"); // 更新导出链接
        }

        conf.dict = await util.fetchApi("lib/dict.json");
        ui.log("读取到字典数据 " + Object.keys(conf.dict).length + " 条");

        ui.updateDownloadLink("Template");
        util.ping();
    },

    /*********************/
    // 修改数据，会同时修改界面，内存以及数据库里的数据
    /*********************/
    async updateMaterial(id, data, field) {
        conf.materials[id][field] = data;
        if (conf.dataFields.includes(field)) {
            ui.getCell(id, field).innerText = data;
            await util.fetchApi("api-material.php", { id, field, value: data });
            ui.updateDownloadLink("Content"); // 更新导出链接
        } else {
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
            util.checkMedias(line.id, "media_cn1", ["audio", "video-text", "video-listen"], true); // 所有条件都有英文第一套素材
            util.checkMedias(line.id, "media_cn2", ["audio", "video-text", "video-listen"], line.voice === ""); // 指定voice，没有第二套音频
            util.checkMedias(line.id, "media_en1", ["audio", "video-text", "video-listen"], true); // 所有条件都有英文第一套素材
            util.checkMedias(line.id, "media_en2", ["audio", "video-text", "video-listen"], line.voice === ""); // 指定voice，没有第二套音频
            util.checkMedias(line.id, "slide", ["slide-text", "slide-listen", "video-ding"], true); // 所有条件都有slide和ding
            let line_ready = util.checkIsReady(line.id);
            answer = answer && line_ready;
            ui.updateCell(line.id, "check", "isready", line_ready ? "ready" : "unready");
        }
        return answer;
    },

    /*********************/
    // 检查medias列表里的素材是否已经生成
    /*********************/
    checkMedias(id, field, medias, condition) {
        medias.forEach((media) => {
            if (!condition) {
                delete conf.materials[id][`${field}.${media}`];
                ui.updateCell(id, field, media, "ignored");
            } else {
                let filename = util.getMediaFilename(id, field, media),
                    is_exist = conf.files.includes(filename);
                conf.materials[id][`${field}.${media}`] = is_exist ? filename : "required";
                ui.updateCell(id, field, media, is_exist ? "exist" : "required");
            }
        });
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
            rule = conf.rule[util.isLessonEnglish() ? "english" : "chinese"];

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
        } else {
            return ui.err(`助手服务器连接错误`);
        }
    },

    /*********************/
    /** 根据条件从所有记录中过滤，并按指定size打包（size打包用于批量翻译，节约时间） */
    /*********************/
    getMaterial(condition, size) {
        let lines = condition ? Object.values(conf.materials).filter(condition) : Object.values(conf.materials);
        return size ? Array.from({ length: Math.ceil(lines.length / size) }, (_, i) => lines.slice(i * size, i * size + size)) : lines;
    },

    /*********************/
    // 获取azure语音模型名字
    /*********************/
    getModel: (language, character) => `${language === "english" ? "en-US" : "zh-CN"}-${conf.voice[language][character]}Neural`,

    /*********************/
    // 获取当前工程的课程语言
    /*********************/
    getLanguage: () => (conf.info.lesson.match(/chinese/i) ? "chinese" : "english"),

    /*********************/
    // 计算出使用的背景图片名字
    /*********************/
    getTheme: (projectid, lesson) => conf.lesson[lesson].abbr + (+projectid).toString().padStart(4, "0"),

    /*********************/
    // 当前课程是否英语课程
    /*********************/
    isLessonEnglish: () => !conf.info.lesson.match(/chinese/i),

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
    // 按导出格式打包数组
    /*********************/
    getMaterialForExport(type) {
        if (type === "Template") {
            let content = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => [i, "", "", "", "", "", ""]);
            return [conf.exportTitles].concat(content);
        } else {
            let contents = Object.values(conf.materials).map((line) => conf.dataFields.map((field) => (line[field] !== 0 ? line[field] : "")));
            return [conf.exportTitles].concat(contents);
        }
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
    // 用content数组生成XLSX
    /*********************/
    getXlsxBinary(content) {
        let workbook = XLSX.utils.book_new(),
            worksheet = XLSX.utils.aoa_to_sheet(content);

        worksheet["!cols"] = conf.exportWidth.map((i) => ({ wpx: i })); // 调整每一列宽度
        Object.keys(worksheet).forEach((key) => {
            // 调整单元格样式
            let is_title = key.match(/^[A-Z]1$/), //第一行
                is_center = is_title || key.match(/^[ABCDHIJKL]\d+$/); // 第一行或ABCDHIJKL列
            if (!key.startsWith("!")) {
                worksheet[key].s = {
                    font: { name: "微软雅黑", sz: "11", color: { rgb: is_title ? "FFFFFF" : "000000" } }, // 字体
                    fill: is_title ? { fgColor: { rgb: "333333" } } : undefined, // 背景颜色
                    alignment: { horizontal: is_center ? "center" : "left", vertical: "middle", wrapText: true } // 对齐方式
                };
            }
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, "语料");
        return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    }
};
