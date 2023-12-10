/* global ui, XLSX */
let conf = {
    materials: {}, // 库里的语料都在此，对应屏幕上的表格
    info: {}, // 生成视频需要的信息在此
    tasks: [], // 任务就是生成视频顺序和素材
    dict: null,
    voice: {
        groupid: 0,
        cn_female: "zh-CN-XiaoqiuNeural",
        cn_male: "zh-CN-YunzeNeural",
        en_female: "en-US-MichelleNeural",
        en_male: "en-US-ChristopherNeural",
        cnlib: {
            female: ["zh-CN-XiaoqiuNeural", "zh-CN-XiaoyanNeural", "zh-CN-XiaohanNeural"],
            male: ["zh-CN-YunyeNeural", "zh-CN-YunyangNeural", "zh-CN-YunhaoNeural"]
        },
        enlib: {
            female: ["en-US-MichelleNeural", "en-US-AshleyNeural", "en-US-SaraNeural"],
            male: ["en-US-ChristopherNeural", "en-US-AndrewNeural", "en-US-BrianNeural", "en-US-SteffanNeural"]
        }
    }
};

let util = {
    /** 初始化数据，从数据库里读入 */
    initMaterial: async function () {
        let ret = await util.fetchApi("api-data.php");

        if (ret.result === "success") {
            ret.data.forEach((line) => ui.loadMaterial(line));
            conf.maxid = ret.maxid;
        }
        ui.log("读取到内容数据 " + ret.data.length + " 条");
        conf.dict = await util.fetchApi("lib/dict.json");
        ui.log("读取到字典数据 " + Object.keys(conf.dict).length + " 条");

        ui.putInputData("projectid", localStorage.getItem("projectid") || "0001"); // 用localstorage里的值填入
        ui.putSelectData("lesson", localStorage.getItem("lesson") || "Living Chinese"); // 用localstorage里的值填入
        await ui.syncProject(); // 同步工程，获取maxid
        ui.updateDownloadLink("0123456789".split("").map((i) => [+i + 1, "", "", "", "", "", ""]));
        ui.updateDownloadLink(util.getMaterialExport(), "downloadContent", `${conf.info.theme}.xlsx`);
    },

    /** 修改数据，会同时修改界面，内存以及数据库里的数据 */
    updateMaterial: async function (id, data, field) {
        let row = document.getElementById("material-" + id);
        if (row) {
            conf.materials[id][field] = data;
            row.getElementsByClassName(field)[0].innerHTML = data;
            await util.fetchApi("api-material.php", { id: id, field: field, value: data });
        }
    },

    /** 调用api获取返回 */
    fetchApi: async function (apiUrl, args = {}) {
        let header = new Headers(),
            params = new URLSearchParams();
        header.append("Content-Type", "application/x-www-form-urlencoded");
        for (let [key, value] of Object.entries(args)) {
            params.append(key, value);
        }
        let response = await fetch(apiUrl, { method: "POST", headers: header, body: params });
        return await response.json();
    },

    /** 根据条件从所有记录中过滤，拆成size大小的批量（每size个内容，一起送翻译，节约时间） */
    getMaterial: function (condition, size = 0) {
        let lines = Object.values(conf.materials).filter(condition);
        return size ? Array.from({ length: Math.ceil(lines.length / size) }, (_, i) => lines.slice(i * size, i * size + size)) : lines;
    },

    isLessonChinese: function () {
        return !!conf.info.lesson.match(/chinese/i);
    },
    isLessonEnglish: function () {
        return !conf.info.lesson.match(/chinese/i);
    },

    getLesson: function () {
        return conf.info.lesson.match(/chinese/i) ? "chinese" : "english";
    },

    getMaterialExport: function () {
        return Object.values(conf.materials).map((l) => [l.id, l.type, l.group, l.chinese, l.english, l.phonetic]);
    },

    /*********************/
    // 生成XLSX
    /*********************/
    getXlsxBinary: function (content) {
        content.unshift(["id", "类型", "分组", "中文", "英文", "音标或拼音"]);
        let workbook = XLSX.utils.book_new(),
            worksheet = XLSX.utils.aoa_to_sheet(content),
            listWidth = [47, 66, 47, 266, 266, 266];

        worksheet["!cols"] = listWidth.map((i) => ({ wpx: i })); // 调整每一列宽度
        Object.keys(worksheet).forEach((key) => {
            // 调整单元格样式
            let isTitle = key.match(/^[A-Z]1$/), //第一行
                isCenter = isTitle || key.match(/^[ABC]\d+$/); // 第一行或ABC列
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
