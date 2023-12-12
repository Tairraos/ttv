/* global conf, ui, XLSX */
let util = {
    /** 初始化数据，从数据库里读入 */
    initMaterial: async () => {
        let ret = await util.fetchApi("api-data.php");

        ui.initLessonSelector();
        ui.initMaterialsTable();

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
        ui.updateDownloadLink("Template");
        ui.updateDownloadLink("Content");
    },

    /** 修改数据，会同时修改界面，内存以及数据库里的数据 */
    updateMaterial: async (id, data, field) => {
        let row = document.getElementById("material-" + id);
        if (row) {
            conf.materials[id][field] = data;
            row.getElementsByClassName(field)[0].innerHTML = data;
            await util.fetchApi("api-material.php", { id, field, value: data });
        }
    },

    /** 调用api获取返回 */
    fetchApi: async (apiUrl, args = {}) => {
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
    getMaterial: (condition, size) => {
        let lines = condition ? Object.values(conf.materials).filter(condition) : Object.values(conf.materials);
        return size ? Array.from({ length: Math.ceil(lines.length / size) }, (_, i) => lines.slice(i * size, i * size + size)) : lines;
    },

    getModel: (language, character) => `${language === "english" ? "en-US" : "zh-CN"}-${character}Neural`,
    getLesson: () => (conf.info.lesson.match(/chinese/i) ? "chinese" : "english"),
    getTheme: (projectId, lesson) => conf.lesson[lesson].abbr + util.fmtProjectId(projectId),
    isLessonChinese: () => !!conf.info.lesson.match(/chinese/i),
    isLessonEnglish: () => !conf.info.lesson.match(/chinese/i),
    fmtProjectId: (projectId) => (+projectId).toString().padStart(4, "0"),

    getMaterialExport: (type) => {
        return type === "Template"
            ? [conf.fieldName.slice(0, 7)].concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => [i, "", "", "", "", "", ""]))
            : [conf.fieldName].concat(Object.keys(conf.materials).map((id) => [id, ...Object.values(conf.materials[id]).slice(2, 13)]));
    },

    /*********************/
    // 用content数组生成XLSX
    /*********************/
    getXlsxBinary: (content) => {
        let workbook = XLSX.utils.book_new(),
            worksheet = XLSX.utils.aoa_to_sheet(content),
            listWidth = conf.fieldWidth.slice(0, content[0].length);

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
