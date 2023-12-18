/* global conf, ui, XLSX */
let util = {
    /** 初始化数据，从数据库里读入 */
    async initMaterial() {
        let ret = await util.fetchApi("api-data.php");

        ui.initLessonSelector();
        ui.initMaterialsTable();

        conf.titles = conf.exportList.map((item) => item.title);
        conf.fields = conf.exportList.map((item) => item.field);
        conf.files = (await util.fetchApi("api-check.php")).files;

        ui.putInputData("projectid", localStorage.getItem("projectid") || "0001"); // 用localstorage里的值填入
        ui.putSelectData("lesson", localStorage.getItem("lesson") || "Living Chinese"); // 用localstorage里的值填入
        await ui.syncProject(); // 同步工程，获取maxid

        if (ret.result === "success") {
            ret.data.forEach((line) => ui.loadMaterial(line));
            util.checkMaterials(); // 检查数据完整性
            ui.log("读取到内容数据 " + ret.data.length + " 条");
            ui.updateDownloadLink("Content"); // 更新导出链接
        }

        conf.dict = await util.fetchApi("lib/dict.json");
        ui.log("读取到字典数据 " + Object.keys(conf.dict).length + " 条");

        ui.updateDownloadLink("Template");
        util.ping();
    },

    /** 修改数据，会同时修改界面，内存以及数据库里的数据 */
    async updateMaterial(id, data, field) {
        conf.materials[id][field] = data;
        if (conf.fields.includes(field)) {
            ui.getCell(id, field).innerText = data;
            await util.fetchApi("api-material.php", { id, field, value: data });
            ui.updateDownloadLink("Content"); // 更新导出链接
        } else {
            conf.files.push(data);
            util.checkMaterials(); // 检查数据完整性
        }
    },
    checkMaterials() {
        let answer = true;
        for (let line of util.getMaterial()) {
            let englishWord = util.isLessonEnglish() && line.type === "word";
            util.checkMedia(line.id, "media_cn1", ["audio", "video-text", "video-listen"], !englishWord); // 英语单词不需要念中文，中文显示了词性和多义，很难念
            util.checkMedia(line.id, "media_cn2", ["audio", "video-text", "video-listen"], !englishWord && line.voice === ""); // 英语单词, 或者指定voice，没有第二套音频
            util.checkMedia(line.id, "media_en1", ["audio", "video-text", "video-listen"], true); // 所有条件都有英文第一套素材
            util.checkMedia(line.id, "media_en2", ["audio", "video-text", "video-listen"], line.voice === ""); // 指定voice，没有第二套音频
            util.checkMedia(line.id, "slide", ["slide-text", "slide-listen", "video-ding"], true); // 所有条件都有slide和ding
            let line_ready = util.checkIsReady(line.id);
            answer = answer && line_ready;
            conf.materials[line.id].isready = line_ready;
            ui.updateCell(line.id, "check", "isready", line_ready ? "ready" : "unready");
        }
        return answer;
    },

    checkMedia(id, field, medias, condition) {
        if (!condition) {
            medias.forEach((media) => {
                conf.materials[id][`${field}.${media}`] = null;
                ui.updateCell(id, field, media, "ignored");
            });
            return;
        }
        for (let media of medias) {
            let filename = util.getMediaFilename(id, field, media);
            if (conf.files.includes(filename)) {
                conf.materials[id][`${field}.${media}`] = filename;
                ui.updateCell(id, field, media, "exist");
            } else {
                conf.materials[id][`${field}.${media}`] = "required";
                ui.updateCell(id, field, media, "required");
            }
        }
    },
    getMediaFilename(id, field, media) {
        return `${id}.${field}.${media}`
            .replace(/media_([ce]n\d)\.audio$/, "$1.m4a") // 1.media_cn1.audio => 1.cn1.m4a
            .replace(/media_([ce]n\d)\.video-(\w+)$/, "$1.$2.mp4") // 1.media_cn1.video-text => 1.cn1.text.mp4
            .replace(/slide\.video-(\w+)$/, "$1.mp4") // 1.slide.video-ding => 1.ding.mp4
            .replace(/slide\.slide-(\w+)$/, "$1.png"); // 1.slide.slide-text => 1.text.png
    },

    // 检查当前行是否所有素材都准备好了, media或slide有一个是required就说明没准备好
    checkIsReady(id) {
        return !Object.entries(conf.materials[id]).filter((item) => item[0].match(/^(media|slide)/) && item[1] === "required").length;
    },

    /** 调用api获取返回 */
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

    async ping() {
        let log = ui.log(`Ping助手服务器...`),
            ret = await util.fetchApi("api/ping");
        if (ret.result === "success") {
            ui.done(log);
        } else {
            return ui.err(`助手服务器连接错误`);
        }
    },

    /** 根据条件从所有记录中过滤，拆成size大小的批量（每size个内容，一起送翻译，节约时间） */
    getMaterial(condition, size) {
        let lines = condition ? Object.values(conf.materials).filter(condition) : Object.values(conf.materials);
        return size ? Array.from({ length: Math.ceil(lines.length / size) }, (_, i) => lines.slice(i * size, i * size + size)) : lines;
    },

    getModel: (language, character) => `${language === "english" ? "en-US" : "zh-CN"}-${conf.voice[language][character]}Neural`,
    getLanguage: () => (conf.info.lesson.match(/chinese/i) ? "chinese" : "english"),
    getTheme: (projectId, lesson) => conf.lesson[lesson].abbr + util.fmtProjectId(projectId),
    isLessonChinese: () => !!conf.info.lesson.match(/chinese/i),
    isLessonEnglish: () => !conf.info.lesson.match(/chinese/i),
    fmtProjectId: (projectId) => (+projectId).toString().padStart(4, "0"),

    getMaterialExport(type) {
        if (type === "Template") {
            let content = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => [i, "", "", "", "", "", ""]);
            return [conf.titles].concat(content);
        } else {
            let contents = Object.values(conf.materials).map((line) => conf.fields.map((field) => (line[field] !== 0 ? line[field] : "")));
            return [conf.titles].concat(contents);
        }
    },

    /*********************/
    // 生成音频配置
    /*********************/
    getMediaSetup(id, language) {
        let line = conf.materials[id],
            abbr = language === "chinese" ? "cn" : "en";
        if (util.isLessonEnglish() && language === "chinese" && line.type === "word") {
            return []; //英语课，单词的中文，不用生成音频
        } else if (line.voice !== "") {
            return [`media_${abbr}1`];
        }
        return [`media_${abbr}1`, `media_${abbr}2`];
    },

    /*********************/
    // 用content数组生成XLSX
    /*********************/
    getXlsxBinary(content) {
        let workbook = XLSX.utils.book_new(),
            worksheet = XLSX.utils.aoa_to_sheet(content),
            listWidth = conf.exportList.map((item) => item.width);

        worksheet["!cols"] = listWidth.map((i) => ({ wpx: i })); // 调整每一列宽度
        Object.keys(worksheet).forEach((key) => {
            // 调整单元格样式
            let isTitle = key.match(/^[A-Z]1$/), //第一行
                isCenter = isTitle || key.match(/^[ABCDHIJKL]\d+$/); // 第一行或ABCDHIJKL列
            if (!key.startsWith("!")) {
                worksheet[key].s = {
                    font: { name: "微软雅黑", sz: "11", color: { rgb: isTitle ? "FFFFFF" : "000000" } }, // 字体
                    fill: isTitle ? { fgColor: { rgb: "333333" } } : undefined, // 背景颜色
                    alignment: { horizontal: isCenter ? "center" : "left", vertical: "middle", wrapText: true } // 对齐方式
                };
            }
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, "语料");
        return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    }
};
