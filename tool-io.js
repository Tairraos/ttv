/* global conf, setup, ui, util, XLSX */
let io = {
    /*********************/
    // 导入数据文件
    /*********************/
    async importXlsx(data) {
        let workbook = XLSX.read(data, { type: "binary" }),
            worksheet = {},
            g = (r) => (worksheet[r] ? worksheet[r].v : ""), // 读出单元格r的value，如果没有就返回空
            t = (s) =>
                s
                    .replace(/单词|词汇/, "word")
                    .replace(/句子/, "sentence")
                    .replace(/故事/, "story")
                    .replace(/标题/, "title") || "sentence",
            range,
            log;

        //导入课本
        worksheet = workbook.Sheets["课本"];
        range = XLSX.utils.decode_range(worksheet["!ref"]);
        let autosid = 1,
            group = 0,
            last_group = 0,
            counter = 0;
        log = ui.log(`导入课本内容...`);
        for (let row = 2; row <= range.e.r + 1; row++) {
            // 跳过第一行title
            if (g(`A${row}`) !== "") {
                let id = ++counter,
                    sid = g(`B${row}`),
                    type = t(g(`C${row}`)),
                    current_group = +g(`D${row}`),
                    voice = g(`E${row}`),
                    chinese = g(`F${row}`),
                    english = g(`G${row}`),
                    phonetic = g(`H${row}`),
                    comment = g(`I${row}`),
                    theme = g(`J${row}`);
                group = current_group === 0 ? 0 : current_group !== last_group ? id : group;
                sid = sid !== "auto" ? +sid : type === "title" ? 0 : autosid++;
                last_group = current_group;
                ui.loadMaterial({ id, sid, type, group, voice, chinese, english, phonetic, comment, theme });
            }
        }
        ui.done(log);

        //导入信息
        worksheet = workbook.Sheets["信息"];
        range = XLSX.utils.decode_range(worksheet["!ref"]);
        log = ui.log(`导入课本信息...`);
        conf.info.book_cn = g(`A2`); //中文名
        conf.info.book_en = g(`B2`); //英文名
        conf.info.book_abbr = g(`C2`); //缩写
        conf.info.language = g(`D2`); //课程语言
        conf.info.version = g(`E2`); //数据文件版本
        ui.done(log);

        //导入素材时长
        worksheet = workbook.Sheets["素材时长"];
        range = XLSX.utils.decode_range(worksheet["!ref"]);
        log = ui.log(`导入素材时长信息...`);
        let loadDuration = (id, row, name) => {
            if (row !== "") {
                conf.durations[`${id}.${name}.mp4`] = row;
            }
        };
        for (let row = 2; row <= range.e.r + 1; row++) {
            if (g(`A${row}`) !== "") {
                loadDuration(g(`A${row}`), g(`B${row}`), "cn1.listen");
                loadDuration(g(`A${row}`), g(`C${row}`), "cn1.text");
                loadDuration(g(`A${row}`), g(`D${row}`), "cn2.listen");
                loadDuration(g(`A${row}`), g(`E${row}`), "cn2.text");
                loadDuration(g(`A${row}`), g(`F${row}`), "en1.listen");
                loadDuration(g(`A${row}`), g(`G${row}`), "en1.text");
                loadDuration(g(`A${row}`), g(`H${row}`), "en2.listen");
                loadDuration(g(`A${row}`), g(`I${row}`), "en2.text");
                loadDuration(g(`A${row}`), g(`J${row}`), "ding");
            }
        }

        //导入视频
        worksheet = workbook.Sheets["视频"];
        range = XLSX.utils.decode_range(worksheet["!ref"]);
        log = ui.log(`导入视频信息...`);
        for (let row = 2; row <= range.e.r + 1; row++) {
            //[文件名, 类型, 起始课本ID, 结束课本ID, 视频长度, 生成时间]
            if (g(`A${row}`) !== "") {
                conf.videos.push([g(`A${row}`), g(`B${row}`), +g(`C${row}`), +g(`D${row}`), g(`E${row}`), g(`F${row}`)]);
            }
        }
        ui.done(log);

        ui.log(`0.导入已经完成`, "pass");
        ui.log(`共有${Object.keys(conf.materials).length}条语料`, "highlight");
        ui.log(`已经生成${conf.videos.length}个视频`, "highlight");
    },

    /*********************/
    // 生成导出数据包
    /*********************/
    exportData() {
        conf.info.version++;
        let materials = Object.values(conf.materials),
            book = materials.map((line) => setup.dataFields.map((field) => (line[field] !== 0 ? line[field] : ""))),
            info = [[conf.info.book_cn, conf.info.book_en, conf.info.book_abbr, conf.info.language, conf.info.version]],
            duration = [],
            video = conf.videos,
            ware = [];
        // 生成duration内容
        for (let id of Object.keys(conf.materials)) {
            duration.push(setup.sheet.duration.name.map((item) => (item === "ID" ? id : conf.durations[`${id}.${item}.mp4`] || "")));
        }
        // 生成课件内容
        for (let line of materials) {
            let id = line.sid ? line.sid.toString() : "";
            util.isLearnEnglish()
                ? ware.push([id], [line.english + line.phonetic], [line.chinese], [""])
                : ware.push(["", line.phonetic], [id, line.chinese], ["", line.english], [""]);
        }
        io.saveXlsxBinary(book, info, duration, video, ware);
    },

    /*********************/
    // 生成xlsx
    /*********************/
    async saveXlsxBinary(book, info, duration = [], video = [], ware = []) {
        let workbook = XLSX.utils.book_new(),
            filename = `${info[0][0]}.${info[0][4]}.xlsx`;

        XLSX.utils.book_append_sheet(workbook, io.getSheet(book, setup.sheet.book), `课本`);
        XLSX.utils.book_append_sheet(workbook, io.getSheet(info, setup.sheet.info), `信息`);
        XLSX.utils.book_append_sheet(workbook, io.getSheet(duration, setup.sheet.duration), `素材时长`);
        XLSX.utils.book_append_sheet(workbook, io.getSheet(video, setup.sheet.video), `视频`);

        // 课件sheet
        let ware_sheet = XLSX.utils.aoa_to_sheet(ware);
        ware_sheet["!cols"] = [{ wpx: 45 }, { wpx: 470 }];
        let style = setup.exportStyle[conf.info.language];
        Object.keys(ware_sheet).forEach((key) => {
            if (!key.startsWith("!")) {
                ware_sheet[key].s = style[+key.replace(/[^\d]/g, "") % style.length];
            }
        });
        XLSX.utils.book_append_sheet(workbook, ware_sheet, `课件`);

        return await XLSX.writeFile(workbook, filename);
    },

    /*********************/
    // 生成Sheet
    /*********************/
    getSheet(content, config) {
        let sheet = XLSX.utils.aoa_to_sheet([config.name].concat(content));
        sheet["!cols"] = config.width.map((i) => ({ wpx: i })); // 调整每一列宽度
        Object.keys(sheet).forEach((key) => {
            // 调整单元格样式
            let is_title = key.match(/^[A-Z]1$/), //第一行
                is_center = is_title || key.match(config.center); // 第一行或ABCDHIJKL列
            if (!key.startsWith("!")) {
                sheet[key].s = {
                    font: { name: "微软雅黑", sz: "11", color: { rgb: is_title ? "FFFFFF" : "000000" } }, // 字体
                    fill: is_title ? { fgColor: { rgb: "333333" } } : undefined, // 背景颜色
                    alignment: { horizontal: is_center ? "center" : "left", vertical: "center", wrapText: true } // 对齐方式
                };
            }
        });
        return sheet;
    }
};
