/* global conf, setup, util, action, net */
let $basket = document.getElementById("basket"),
    $export = document.getElementById("doExportData"),
    $info = document.getElementById("info"),
    $content = document.getElementById("content"),
    $materials = document.querySelector("#material tbody"),
    $log = document.getElementById("log"),
    $edittool = document.getElementById("edittool"),
    $server = document.getElementById("server"),
    $doCellEdit = document.getElementById("doCellEdit"),
    $doCellTranslate = document.getElementById("doCellTranslate"),
    $doMakeSentence = document.getElementById("doMakeSentence"),
    $doCellPinyin = document.getElementById("doCellPinyin"),
    $doGenLineMedia = document.getElementById("doGenLineMedia"),
    $doEditDone = document.getElementById("doEditDone"),
    $doEditRestore = document.getElementById("doEditRestore"),
    $unlocked = document.getElementById("edittool-unlocked"),
    $locked = document.getElementById("edittool-locked"),
    $sdContainer = document.getElementById("sd-container"),
    $sdInfo = document.getElementById("sd-info"),
    $sdDict = document.getElementById("sd-dict"),
    $sdMaterials = document.getElementById("sd-materials"),
    $sdInput = document.getElementById("sd-input"),
    $sdStatus = document.getElementById("sd-status"),
    $doSentenceSwitchMode = document.getElementById("doSentenceSwitchMode");

let $tool_a = document.getElementById("tool_a"),
    $tool_b = document.getElementById("tool_b"),
    $panel1 = document.getElementById("panel1"),
    $panel2 = document.getElementById("panel2");

let ui = {
    /*********************/
    // 创建工程
    /*********************/

    initMaterialsTable() {
        document.querySelector("#material thead").innerHTML = "<tr>" + setup.uiFields.map((item) => `<th>${item}</th>`).join("") + "</tr>";
    },

    initRangeBox() {
        let r = conf.range;
        r.min = Math.min(...Object.keys(conf.materials), 1);
        r.max = Math.max(...Object.keys(conf.materials), 1);
        ui.putInputData("startid", r.min); //填上缺省值
        ui.putInputData("endid", r.max);
        ui.rangeConfirm(); // confirm一次
    },

    /*********************/
    // 切换工具
    /*********************/
    switchPanel(e) {
        if (e.target.id === "panel1") {
            $tool_a.style.display = "flex";
            $tool_b.style.display = "none";
            $panel1.className = "selected";
            $panel2.className = "unselected";
        } else {
            $tool_a.style.display = "none";
            $tool_b.style.display = "block";
            $panel2.className = "selected";
            $panel1.className = "unselected";
            ui.initPanel2();
        }
    },

    /*********************/
    // 更新拖放框内信息
    /*********************/
    updateBasket() {
        let info = [
            `名称：${conf.info.book_cn}`,
            `缩写：${conf.info.book_abbr}`,
            `目标：${conf.info.language}`,
            `版本：${conf.info.version}`,
            `视频：${conf.videos.length}个`
        ];
        $basket.style.display = "none";
        $info.style.display = "flex";
        $info.innerHTML = info.map((item) => `<div>${item}</div>`).join("");
        $export.innerText = `导出 ${conf.info.book_cn}.${conf.info.version + 1}`;
    },

    /*********************/
    // 如果初始化的时候，内存数据有未备份的，高亮按钮背景
    /*********************/
    highlightRestoreBtn() {
        document.getElementById("doRestoreStorage").style.background = "#fcc";
    },

    /*********************/
    // 读写页面中的DOM
    /*********************/
    getInputData: (id) => document.getElementById(id).value,
    putInputData: (id, value) => (document.getElementById(id).value = value),
    getSelectData: (id) => document.getElementById(id).value,
    putSelectData: (id, value) => (document.getElementById(id).value = value),
    getCell: (id, field) => document.querySelector(`#material-${id} .${field}`),
    getRow: (id) => document.querySelector(`#material-${id}`),

    /*********************/
    // 听力和阅读选择
    /*********************/
    onProgramChange() {
        let program = ui.getSelectData("program");
        conf.info.program = program;
        conf.rules = setup.programRules[program];
        conf.tasks = []; // 风格变化后，要重新估算生成task
        util.checkMaterials(); // 检查所有语料的素材是否准备完全
        ui.log(`视频风格选择：${setup.program[program]}`, "highlight");
    },

    /*********************/
    // 确认设置范围
    /*********************/
    rangeConfirm() {
        let r = conf.range,
            start = Math.max(+ui.getInputData("startid"), r.min) || 0,
            end = Math.min(ui.getInputData("endid"), r.max) || 0;

        if (r.start === start && r.end === end && (r.min !== start || r.max !== end)) {
            delete r.selected;
            ui.rangeReset();
        } else {
            r.start = start;
            r.end = end;
            ui.putInputData("startid", start);
            ui.putInputData("endid", end);
            conf.tasks = []; // 范围变化后，要重新估算生成task
            $materials.querySelectorAll("tr").forEach((line) => {
                let id = line.dataset.id;
                id >= r.start && id <= r.end ? line.classList.remove("skip") : line.classList.add("skip");
            });
            r.selected = false; // 选择重置
            ui.log(`素材范围：${r.start} 到 ${r.end}，共 ${r.end - (r.start || 1) + 1} 条素材`, "highlight");
            util.checkMaterials(); // 检查语料
        }
        document.querySelectorAll(`#material tr`).forEach((line) => line.classList.remove("selecting"));
    },

    /*********************/
    // 重置范围，第一次恢复已经确认的范围，再点一次恢复到全部
    /*********************/
    rangeReset() {
        let r = conf.range;
        if (r.selected) {
            ui.putInputData("startid", r.start);
            ui.putInputData("endid", r.end);
            delete r.selected;
            document.querySelectorAll(`#material tr`).forEach((line) => line.classList.remove("selecting"));
            ui.log(`素材范围恢复，未做修改`, "highlight");
        } else {
            ui.putInputData("startid", r.min);
            ui.putInputData("endid", r.max);
            ui.rangeConfirm();
        }
    },

    /*********************/
    // 批量检查范围内的Slide
    /*********************/
    rangeVerify() {
        let r = conf.range;
        if (r.end - r.start > 79) {
            return ui.err("当前作用范围超过允许值：80");
        }
        ui.openPostPage(`html-verify.php`, {
            book_cn: conf.info.book_cn,
            ids: JSON.stringify([...Array.from({ length: r.end - r.start + 1 }, (_, i) => i + r.start)])
        });
    },

    publishTool() {
        let items = Array.from(new Set(conf.videos.map((item) => item[0].replace(/.*(\d{4}-\d{4}).*/, "$1"))));
        ui.openPostPage(`html-publish.php`, { items: JSON.stringify(items) });
    },

    /*********************/
    // 定位sid，移到屏幕中来
    /*********************/
    locateSid() {
        let targetsid = +ui.getInputData("targetsid"),
            materials = util.getAllMaterial();
        for (let line of materials) {
            if (line.sid === targetsid) {
                return document.querySelector(`#material-${line.id}`).scrollIntoView({ behavior: "smooth" });
            }
        }
    },

    /*********************/
    // 定位没生成过video的id
    /*********************/
    locateNoVideoId() {
        let targetid = Math.max(Math.max(...conf.videos.map((item) => item[3])) - 2, 1);
        document.querySelector(`#material-${targetid}`).scrollIntoView({ behavior: "smooth" });
    },

    /*********************/
    // 为指定间隔的间做上颜色标记
    /*********************/
    lineMark() {
        let marknum = +ui.getInputData("marknum"),
            materials = util.getMaterial();
        document.querySelectorAll(`#material tr`).forEach((line) => line.classList.remove("marked"));
        for (let line of materials) {
            if (line.sid % marknum === 1) {
                document.querySelector(`#material-${line.id}`).classList.add("marked");
            }
        }
    },

    /*********************/
    // 拖放事件处理
    /*********************/
    dragLeave: () => $basket.classList.remove("dragover"),

    dragEnter(e) {
        $basket.classList.add("dragover");
        e.stopPropagation();
        e.preventDefault();
    },

    dropHandler(e) {
        let file = e.dataTransfer.files;
        e.stopPropagation();
        e.preventDefault();
        ui.dragLeave();
        return file.length ? action.doImportMaterials(file[0]) : ui.err(`拖入的不是文件`);
    },

    /*********************/
    // 把数据加载到UI里
    /*********************/
    loadMaterial(data, isLoadFromStorage = false) {
        let row = $materials.insertRow();
        row.id = "material-" + data.id;
        row.classList.add("type-" + data.type);
        if (conf.info.book_abbr === conf.hidhen.book && data.id <= conf.hidhen.id) {
            row.classList.add("hide");
        }
        row.dataset.id = +data.id;
        setup.uiFields.forEach((item, index) => {
            let cell = row.insertCell(-1);
            cell.className = setup.uiFields[index];
            cell.innerHTML = data[item] || ui.getInitMedia(data.id, item);
        });
        if (!isLoadFromStorage) {
            conf.materials[data.id] = data;
        }
    },

    /*********************/
    // 生成待生成的素材单元格，含svg图标
    /*********************/
    getInitMedia(id, name) {
        if (name.match(/^media/)) {
            let abbr = name.replace(/media_/, "");
            return (
                `<span class="svg audio" title="${id}.${abbr}.m4a"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="21" height="14" viewBox="0 0 30 20"><path d="M0,4L0,16C0,18.2091,1.79086,20,4,20L26,20C28.2091,20,30,18.2091,30,16L30,4C30,1.79086,28.2091,0,26,0L4,0C1.79086,0,0,1.79086,0,4ZM2.58579,17.4142Q2,16.8284,2,16L2,4Q2,3.17157,2.58579,2.58579Q3.17157,2,4,2L26,2Q26.8284,2,27.4142,2.58579Q28,3.17157,28,4L28,16Q28,16.8284,27.4142,17.4142Q26.8284,18,26,18L4,18Q3.17157,18,2.58579,17.4142ZM16.625,8.80122L17.0369,9.21312C17.3006,9.47684,17.6583,9.62498,18.0312,9.62498C18.4042,9.62498,18.7619,9.47684,19.0256,9.21312C19.2894,8.9494,19.4375,8.5917,19.4375,8.21873C19.4375,7.84578,19.2894,7.4881,19.0256,7.22438L16.2131,4.41188C15.664,3.86271,14.7735,3.86271,14.2244,4.41188C13.9606,4.6756,13.8125,5.03327,13.8125,5.40624L13.8125,9.62498Q12.6475,9.62498,11.8237,10.4487Q11,11.2725,11,12.4375Q11,13.6025,11.8237,14.4262Q12.6475,15.25,13.8125,15.25Q14.9775,15.25,15.8013,14.4262Q16.625,13.6025,16.625,12.4375L16.625,8.80122Z" fill-rule="evenodd" fill-opacity="1"/></svg></span>` +
                `<span class="svg video-listen" title="${id}.${abbr}.listen.m4a"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="21" height="14" viewBox="0 0 30 20"><path d="M0,16L0,4C0,1.79086,1.79086,0,4,0L26,0C28.2091,0,30,1.79086,30,4L30,16C30,18.2091,28.2091,20,26,20L4,20C1.79086,20,0,18.2091,0,16ZM2,16Q2,16.8284,2.58579,17.4142Q3.17157,18,4,18L26,18Q26.8284,18,27.4142,17.4142Q28,16.8284,28,16L28,4Q28,3.17157,27.4142,2.58579Q26.8284,2,26,2L4,2Q3.17157,2,2.58579,2.58579Q2,3.17157,2,4L2,16ZM12.4698,8.59081Q13.2857,9.38162,13.2857,10.5L13.2857,15L15.6071,15C16.3764,15,17,14.3956,17,13.65L17,12.75C17,12.0044,16.3764,11.4,15.6071,11.4L15.1429,11.4L15.1429,10.5C15.1429,8.01472,13.0642,6,10.5,6C7.93582,6,5.85714,8.01472,5.85714,10.5L5.85714,11.4L5.39286,11.4C4.6236,11.4,4,12.0044,4,12.75L4,13.65C4,14.3956,4.6236,15,5.39286,15L7.71429,15L7.71429,10.5Q7.71429,9.38162,8.5302,8.59081Q9.34612,7.8,10.5,7.8Q11.6539,7.8,12.4698,8.59081ZM18,13.2228L18,7.66723C17.9998,7.06125,18.3285,6.50291,18.8585,6.20906C19.3884,5.91522,20.0361,5.93217,20.55,6.25334L24.9944,9.03111C26.0401,9.68372,26.0401,11.2063,24.9944,11.8589L20.55,14.6367C20.0361,14.9578,19.3884,14.9748,18.8585,14.6809C18.3285,14.3871,17.9998,13.8288,18,13.2228Z" fill-rule="evenodd" fill-opacity="1"/></svg></span>` +
                `<span class="svg video-text" title="${id}.${abbr}.text.mp4"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="21" height="14" viewBox="0 0 30 20"><path d="M0,16L0,4C0,1.79086,1.79086,0,4,0L26,0C28.2091,0,30,1.79086,30,4L30,16C30,18.2091,28.2091,20,26,20L4,20C1.79086,20,0,18.2091,0,16ZM2,16Q2,16.8284,2.58579,17.4142Q3.17157,18,4,18L26,18Q26.8284,18,27.4142,17.4142Q28,16.8284,28,16L28,4Q28,3.17157,27.4142,2.58579Q26.8284,2,26,2L4,2Q3.17157,2,2.58579,2.58579Q2,3.17157,2,4L2,16ZM18,13.2228L18,7.66723C17.9998,7.06125,18.3285,6.50291,18.8585,6.20906C19.3884,5.91522,20.0361,5.93217,20.55,6.25334L24.9944,9.03111C26.0401,9.68372,26.0401,11.2063,24.9944,11.8589L20.55,14.6367C20.0361,14.9578,19.3884,14.9748,18.8585,14.6809C18.3285,14.3871,17.9998,13.8288,18,13.2228ZM4,8C4,7.44772,4.44771,7,5,7L16,7C16.5523,7,17,7.44772,17,8C17,8.55229,16.5523,9,16,9L5,9C4.44771,9,4,8.55229,4,8ZM4,13C4,12.4477,4.44771,12,5,12L16,12C16.5523,12,17,12.4477,17,13C17,13.5523,16.5523,14,16,14L5,14C4.44771,14,4,13.5523,4,13Z" fill-rule="evenodd" fill-opacity="1"/></svg></span>`
            );
        } else if (name === "slide") {
            return (
                `<span class="svg slide-listen" title="${id}.listen.png"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="21" height="14" viewBox="0 0 30 20"><path d="M0,4L0,16C0,18.2091,1.79086,20,4,20L26,20C28.2091,20,30,18.2091,30,16L30,4C30,1.79086,28.2091,0,26,0L4,0C1.79086,0,0,1.79086,0,4ZM2.58579,17.4142Q2,16.8284,2,16L2,4Q2,3.17157,2.58579,2.58579Q3.17157,2,4,2L26,2Q26.8284,2,27.4142,2.58579Q28,3.17157,28,4L28,16Q28,16.8284,27.4142,17.4142Q26.8284,18,26,18L4,18Q3.17157,18,2.58579,17.4142ZM18,10Q18,8.75736,17.1213,7.87868Q16.2426,7,15,7Q13.7574,7,12.8787,7.87868Q12,8.75736,12,10L12,15L9.5,15C8.67157,15,8,14.3284,8,13.5L8,12.5C8,11.6716,8.67157,11,9.5,11L10,11L10,10C10,7.23858,12.2386,5,15,5C17.7614,5,20,7.23858,20,10L20,11L20.5,11C21.3284,11,22,11.6716,22,12.5L22,13.5C22,14.3284,21.3284,15,20.5,15L18,15L18,10Z" fill-rule="evenodd" fill-opacity="1"/></svg></span>` +
                `<span class="svg slide-text" title="${id}.text.png"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="21" height="14" viewBox="0 0 30 20"><path d="M0,4L0,16C0,18.2091,1.79086,20,4,20L26,20C28.2091,20,30,18.2091,30,16L30,4C30,1.79086,28.2091,0,26,0L4,0C1.79086,0,0,1.79086,0,4ZM2.58579,17.4142Q2,16.8284,2,16L2,4Q2,3.17157,2.58579,2.58579Q3.17157,2,4,2L26,2Q26.8284,2,27.4142,2.58579Q28,3.17157,28,4L28,16Q28,16.8284,27.4142,17.4142Q26.8284,18,26,18L4,18Q3.17157,18,2.58579,17.4142ZM9,7C8.44771,7,8,7.44772,8,8C8,8.55229,8.44771,9,9,9L22,9C22.5523,9,23,8.55229,23,8C23,7.44772,22.5523,7,22,7L9,7ZM9,12C8.44771,12,8,12.4477,8,13C8,13.5523,8.44771,14,9,14L22,14C22.5523,14,23,13.5523,23,13C23,12.4477,22.5523,12,22,12L9,12Z" fill-rule="evenodd" fill-opacity="1"/></svg></span>` +
                `<span class="svg video-ding" title="${id}.ding.mp4"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="21" height="14" viewBox="0 0 30 20"><path d="M0,4L0,16C0,18.2091,1.79086,20,4,20L26,20C28.2091,20,30,18.2091,30,16L30,4C30,1.79086,28.2091,0,26,0L4,0C1.79086,0,0,1.79086,0,4ZM2.58579,17.4142Q2,16.8284,2,16L2,4Q2,3.17157,2.58579,2.58579Q3.17157,2,4,2L26,2Q26.8284,2,27.4142,2.58579Q28,3.17157,28,4L28,16Q28,16.8284,27.4142,17.4142Q26.8284,18,26,18L4,18Q3.17157,18,2.58579,17.4142ZM14.8653,11.7022C14.833,11.6301,14.7946,11.5593,14.75,11.4905L14.1344,10.5429C13.8833,10.1562,13.75,9.70194,13.75,9.23719L13.75,8.84999C13.75,6.7237,12.0705,5,10,5C7.92946,5,6.25058,6.7237,6.25058,8.84999L6.25058,9.23719C6.2512,9.69995,6.11757,10.1531,5.86558,10.5429L5.25003,11.4905C5.20541,11.5593,5.16704,11.6301,5.1347,11.7022C4.75998,12.5375,5.1949,13.5544,6.09447,13.806C6.69756,13.9752,7.30906,14.1044,7.925,14.1936C9.30095,14.3929,10.699,14.3929,12.075,14.1936C12.6909,14.1044,13.3024,13.9752,13.9055,13.806C14.8051,13.5544,15.24,12.5375,14.8653,11.7022ZM18,7.66723L18,13.2228C17.9998,13.8288,18.3285,14.3871,18.8585,14.6809C19.3884,14.9748,20.0361,14.9578,20.55,14.6367L24.9944,11.8589C26.0401,11.2063,26.0401,9.68372,24.9944,9.03111L20.55,6.25334C20.0361,5.93217,19.3884,5.91522,18.8585,6.20906C18.3285,6.50291,17.9998,7.06125,18,7.66723ZM12.724,12.043L12.4571,11.6322Q11.75,10.5434,11.75,9.23719L11.75,8.85Q11.75,8.06847,11.2188,7.52318Q10.7092,7,10,7Q9.29101,7,8.78162,7.52304Q8.25058,8.0683,8.25058,8.84999L8.25058,9.23454Q8.25231,10.535,7.54281,11.6323L7.27602,12.0431Q9.99957,12.6612,12.724,12.043ZM10,16C10.7897,16.0028,12.0102,15.1463,12.5,14.5331C11,15,9,15,7.5,14.5331C7.98982,15.1463,9.21035,16.0028,10,16Z" fill-rule="evenodd" fill-opacity="1"/></svg></span>`
            );
        } else if (name === "action") {
            return (
                `<span class="svg action-page" title="查看slide"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="14" height="14" viewBox="0 0 20 20"><path d="M0,3.61111C0,1.61675,1.61675,0,3.61111,0L16.3889,0C18.3833,0,20,1.61675,20,3.61111L20,16.3889C20,18.3833,18.3833,20,16.3889,20L3.61111,20C1.61675,20,0,18.3833,0,16.3889L0,3.61111ZM3.61111,1.66667C2.53722,1.66667,1.66667,2.53722,1.66667,3.61111L1.66667,15.6575L4.70753,12.5657C4.91817,12.3259,5.24751,12.2888,5.49503,12.4772L8.82002,15.0086L13.4575,9.70858C13.6479,9.4916,13.9384,9.4381,14.1788,9.57572L18.2938,12L18.3333,12L18.3333,3.61111C18.3333,2.53722,17.4628,1.66667,16.3889,1.66667L3.61111,1.66667ZM7.65002,6.64286C7.65002,7.82633,6.81056,8.78572,5.77502,8.78572C4.73949,8.78572,3.90002,7.82633,3.90002,6.64286C3.90002,5.45939,4.73949,4.5,5.77502,4.5C6.81056,4.5,7.65002,5.45939,7.65002,6.64286Z" fill-rule="evenodd" fill-opacity="1"/></svg></span>` +
                `<span class="svg action-preview" title="查看全部素材"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="14" height="14" viewBox="0 0 20 20"><path d="M0,3.61111C-3.17891e-7,1.61675,1.61675,0,3.61111,0L16.3889,0C18.3833,0,20,1.61675,20,3.61111L20,16.3889C20,18.3833,18.3833,20,16.3889,20L3.61111,20C1.61675,20,0,18.3833,0,16.3889L0,3.61111ZM3.61111,1.66667C2.53722,1.66667,1.66667,2.53722,1.66667,3.61111L1.66667,16.3889C1.66667,17.4622,2.53778,18.3333,3.61111,18.3333L16.3889,18.3333C17.4628,18.3333,18.3333,17.4628,18.3333,16.3889L18.3333,3.61111C18.3333,2.53722,17.4628,1.66667,16.3889,1.66667L3.61111,1.66667ZM3.33333,5.83333C3.33333,4.76,4.20444,3.88889,5.27778,3.88889L14.7222,3.88889C15.7956,3.88889,16.6667,4.76,16.6667,5.83333L16.6667,7.5C16.6667,8.57389,15.7961,9.44444,14.7222,9.44444L5.27778,9.44444C4.20389,9.44444,3.33333,8.57389,3.33333,7.5L3.33333,5.83333ZM5.27778,5.55556C5.12437,5.55556,5,5.67992,5,5.83333L5,7.5C5,7.65333,5.12444,7.77778,5.27778,7.77778L14.7222,7.77778C14.8756,7.77778,15,7.65341,15,7.5L15,5.83333C15,5.67992,14.8756,5.55556,14.7222,5.55556L5.27778,5.55556ZM4.16667,11.1111C3.70643,11.1111,3.33333,11.4842,3.33333,11.9444C3.33333,12.4047,3.70643,12.7778,4.16667,12.7778L9.16667,12.7778C9.6269,12.7778,10,12.4047,10,11.9444C10,11.4842,9.62691,11.1111,9.16667,11.1111L4.16667,11.1111ZM3.33333,15.2778C3.33333,14.8175,3.70643,14.4444,4.16667,14.4444L9.16667,14.4444C9.62691,14.4444,10,14.8175,10,15.2778C10,15.738,9.6269,16.1111,9.16667,16.1111L4.16667,16.1111C3.70643,16.1111,3.33333,15.738,3.33333,15.2778ZM13.6111,11.1111C12.5372,11.1111,11.6667,11.9817,11.6667,13.0556L11.6667,14.1667C11.6667,15.24,12.5378,16.1111,13.6111,16.1111L14.7222,16.1111C15.7961,16.1111,16.6667,15.2406,16.6667,14.1667L16.6667,13.0556C16.6667,11.9817,15.7961,11.1111,14.7222,11.1111L13.6111,11.1111ZM13.3333,13.0556C13.3333,12.9021,13.4577,12.7778,13.6111,12.7778L14.7222,12.7778C14.8756,12.7778,15,12.9021,15,13.0556L15,14.1667C15,14.3201,14.8756,14.4444,14.7222,14.4444L13.6111,14.4444C13.4577,14.4444,13.3333,14.3201,13.3333,14.1667L13.3333,13.0556Z" fill-opacity="1"/></svg></span>`
            );
        }
        return "";
    },

    /*********************/
    // 更新素材单元格里的图标状态
    /*********************/
    updateCell(id, field, media, css) {
        let dom = document.querySelector(`#material-${id} .${field} .${media}`),
            cssList = ["exist", "required", "ignored"].filter((item) => item !== css);
        dom.classList.remove(...cssList);
        dom.classList.add(css);
    },

    deleteMaterial(id) {
        let material = conf.materials[id];
        document.getElementById(`material-${id}`).remove();
        delete conf.materials[id];
        return material;
    },

    /*********************/
    // 点击表格内容预览
    /*********************/
    async doCellClick(event) {
        let dom = event.target;
        if (["SPAN", "TD"].includes(dom.tagName)) {
            let id = +dom.closest("tr").dataset.id,
                field = dom.closest("td").className,
                target = dom.className.replace(/svg|required|exist| /g, "");
            if (target === "id") {
                ui.putInputData(event.shiftKey ? "endid" : "startid", id);
            } else if (target === "sid") {
                ui.putInputData("endid", id);
            } else if (target === "theme") {
                ui.putInputData("themename", dom.innerText);
            } else if (target === "audio") {
                await action.genAudioPiece(id, field, true); //force=true,覆盖生成
            } else if (target.match(/^video/)) {
                action.genVideoPiece(id, field, target, true); // force=true,覆盖生成
            } else if (target.match(/^slide/)) {
                action.genSlidePiece(id, target.replace(/slide-/, ""), true); // force=true,覆盖生成
            } else if (target === "action-page") {
                ui.openPostPage(`html-slide.php`, {
                    language: conf.info.language,
                    book_cn: conf.info.book_cn,
                    style: "text",
                    rows: JSON.stringify(util.getMaterialByGroup(id))
                });
            } else if (target === "action-preview") {
                ui.openPostPage(`html-overview.php`, {
                    language: conf.info.language,
                    book_cn: conf.info.book_cn,
                    rows: JSON.stringify(util.getMaterialByGroup(id))
                });
            }
            if (field === "id" && event.shiftKey && conf.range.selected) {
                ui.updateSelecting(conf.range.selected, id);
            } else if (conf.range.selected) {
                ui.rangeReset();
            }
        }
    },

    async openPostPage(url, params) {
        var newWin = window.open("about:blank", "preview");
        var formStr = `<form style="visibility:hidden;" method="POST" action="${location.origin}/${url}">`;
        for (var key in params) {
            formStr += "<input type='text' name='" + key + "' value='" + params[key].replace(/'/g, "&#39;") + "' style='display: none'>";
        }
        formStr += "</form>";
        newWin.document.body.innerHTML = formStr;
        newWin.document.forms[0].submit();
    },

    /*********************/
    // 造句对话框
    /*********************/
    async doShowSentenceDialog(id) {
        let chinese = conf.materials[id].chinese.replace(/（[^）]+）/, ""),
            ret = await net.getSentence(chinese);
        for (let text of ret.sentence) {
            ui.addLi($sdDict, text, ui.doAddSelectd);
        }
        $sdContainer.style.display = "flex";
        $sdInfo.dataset["id"] = id;
        $sdInfo.innerText = `id: ${id}, "${conf.materials[id].chinese}" 造句`;
    },

    addLi(target, text, event) {
        let li = document.createElement("li");
        li.innerHTML = `${text}`;
        li.addEventListener("click", event);
        li.contentEditable = "true";
        target.appendChild(li);
    },

    doRemoveSelected(e) {
        if (conf.editTool.sdmode === "remove") {
            e.target.remove();
        }
    },

    doAddSelectd(e) {
        let text = e.target.innerText;
        ui.addLi($sdMaterials, text, ui.doRemoveSelected);
    },

    doAddInput() {
        let text = $sdInput.value;
        if (text.length) {
            ui.addLi($sdMaterials, text, ui.doRemoveSelected);
        }
        $sdInput.value = "";
    },

    doSentenceSwitchMode() {
        conf.editTool.sdmode = conf.editTool.sdmode === "edit" ? "remove" : "edit";
        $sdStatus.innerText = conf.editTool.sdmode === "edit" ? "编辑" : "删除";
        $sdStatus.style.color = conf.editTool.sdmode === "edit" ? "#4b4" : "#911";
    },

    async doSentenceConfirm() {
        let id = +$sdInfo.dataset["id"],
            materials = Array.from($sdMaterials.querySelectorAll("li")).map((i) => i.innerText);
        ui.doSentenceClose();
        if (materials.length) {
            let ids = util.insertMaterial(id, materials);
            await action.fetchTranslationBundle(ids, "chinese", "english", true);
            ids.forEach((id) => action.genPhoneticPiece(id, true));
        }
        conf.lastTouchedId = id;
        util.backupParam2Storage();
    },

    doSentenceClose() {
        $sdContainer.style.display = "none";
        $sdInfo.dataset["id"] = null;
        $sdInfo.innerHTML = "";
        $sdDict.innerHTML = "";
        $sdInput.value = "";
        $sdMaterials.innerHTML = "";
    },

    /*********************/
    // 在表格里选择范围
    /*********************/
    cellSelectStart(event) {
        if (event.target.tagName === "TD" && event.target.className === "id") {
            $materials.classList.add("unselectable");
            conf.onselect = +event.target.innerText;
        }
    },

    cellSelectEnd() {
        if (conf.onselect) {
            $materials.classList.remove("unselectable");
            delete conf.onselect;
        }
    },

    updateSelecting(start, end) {
        let doms = document.querySelectorAll(`#material tr`),
            uprange = Math.min(start, end),
            downrange = Math.max(start, end);
        doms.forEach((line) =>
            +line.dataset.id >= uprange && +line.dataset.id <= downrange ? line.classList.add("selecting") : line.classList.remove("selecting")
        );
    },

    /*********************/
    // hover 单元格的处理，可能是选择范围，也可能是显示editTool工具
    /*********************/
    onMouseOverCell(event) {
        let e = conf.editTool,
            dom = event.target;
        if (dom.tagName === "TD") {
            let field = dom.className,
                id = +dom.closest("tr").dataset.id;
            if (conf.onselect) {
                // 拖动选择工具
                let start = Math.min(conf.onselect, id),
                    end = Math.max(conf.onselect, id);
                ui.putInputData("startid", start); //填上缺省值
                ui.putInputData("endid", end);
                ui.updateSelecting(start, end);
                conf.range.selected = conf.onselect;
            } else if (!e.locker) {
                // 这些字段可以编辑
                if (field.match(/group|voice|chinese|english|comment|media_cn1/)) {
                    ui.showEditTool({ target: dom, isInCell: true });
                    $doMakeSentence.style.display = field === "chinese" && conf.materials[id].type === "word" ? "inline-block" : "none";
                    $doCellTranslate.style.display = field.match(/chinese|english/) ? "inline-block" : "none";
                    $doCellPinyin.style.display = field === "chinese" ? "inline-block" : "none";
                    $doGenLineMedia.style.display = field === "media_cn1" ? "inline-block" : "none";
                    $doCellEdit.style.display = field !== "media_cn1" ? "inline-block" : "none";
                } else {
                    ui.hideEditTool();
                }
            }
            if (field === e.field && id === e.id) {
                ui.showEditTool({ target: dom, isInCell: true });
            }
        }
    },

    /*********************/
    // 文本上的浮动菜单
    /*********************/
    showEditTool(event) {
        let e = conf.editTool;
        if (event.isInCell) {
            // 如果在edit tool里面，也要show，但是不需要重新定位
            let rect = event.target.getBoundingClientRect();
            e.dom = event.target;
            e.id = +event.target.closest("tr").dataset.id;
            e.field = event.target.className;
            $edittool.style.left = rect.left + "px";
            $edittool.style.top = rect.top - 20 + "px";
        }
        $edittool.style.display = "block";
    },

    hideEditTool() {
        $edittool.style.display = "none";
    },

    cellEditStart() {
        let e = conf.editTool;
        e.dom.contentEditable = "true";
        e.locker = true;
        ui.switchEditTool();
    },

    doMakeSentence() {
        ui.doShowSentenceDialog(conf.editTool.id);
        window.setTimeout(() => ui.hideEditTool(), 300);
    },

    async doCellTranslate() {
        let e = conf.editTool;
        if (e.field.match(/chinese/)) {
            await action.fetchTranslationBundle([e.id], "chinese", "english", true);
        } else if (e.field.match(/english/)) {
            await action.fetchTranslationBundle([e.id], "english", "chinese", true);
            await action.genPhoneticPiece(e.id, true);
        }
        util.backupParam2Storage();
    },

    doCellPinyin: async () => await action.genPhoneticPiece(conf.editTool.id, true),

    async doGenLineMedia() {
        $materials.querySelectorAll(`#material-${conf.editTool.id} span.exist`).forEach((line) => line.classList.replace("exist", "required"));
        await action.doGenLineMedia(conf.editTool.id);
    },

    async cellEditDone() {
        let e = conf.editTool;
        e.dom.contentEditable = "false";
        e.locker = false;
        ui.switchEditTool();
        if (conf.materials[e.id][e.field] !== e.dom.innerText) {
            if (e.field.match(/chinese|english/) && e.dom.innerText[0] === "!") {
                // 如果修改的是中英，感叹号开头，则只留在UI里，临时使用不更新内存，以免被导出。audio生成会读ui字串而不是内存字串
                e.dom.innerText = e.dom.innerText.slice(1);
            } else {
                conf.materials[e.id][e.field] = e.dom.innerText;
                await util.updateMaterial(e.id, e.dom.innerText, e.field);
                //如果编辑的是中文或英文，自动重新翻译和生成拼音
                if (e.field.match(/chinese/)) {
                    await action.fetchTranslationBundle([e.id], "chinese", "english");
                    await action.genPhoneticPiece(e.id);
                } else if (e.field.match(/english/)) {
                    await action.fetchTranslationBundle([e.id], "english", "chinese");
                    await action.genPhoneticPiece(e.id);
                }
                util.backupParam2Storage();
            }
        }
        e.dom.style.background = e.dom.innerText !== conf.materials[e.id][e.field] ? "#fcc" : "";
    },

    cellEditRestore() {
        let e = conf.editTool;
        e.dom.innerText = conf.materials[e.id][e.field];
        e.dom.contentEditable = "false";
        e.locker = false;
        e.dom.style.background = "";
        ui.switchEditTool();
    },

    switchEditTool() {
        let e = conf.editTool;
        $unlocked.style.display = e.locker ? "none" : "block";
        $locked.style.display = e.locker ? "block" : "none";
    },

    themeIdIncrease() {
        let [base, index] = ui.getInputData("themename").split("-");
        ui.putInputData("themename", `${base}-${String((+index || 0) + 1).padStart(3, "0")}`);
    },

    themeIdDecrease() {
        let [base, index] = ui.getInputData("themename").split("-");
        ui.putInputData("themename", `${base}-${String(Math.max((+index || 1) - 1, 1)).padStart(3, "0")}`);
    },

    themeIdSave() {
        util.updateMaterial(ui.getInputData("startid"), ui.getInputData("themename"), "theme", ui.getInputData("endid"));
        util.backupParam2Storage();
    },

    /*********************/
    // 输出页内Log
    /*********************/
    log(text, level = "info") {
        let $newdom = document.createElement("div");
        $newdom.className = level;
        $newdom.innerText = text;
        $log.appendChild($newdom);
        $log.scrollTop = $log.scrollHeight;
        return $newdom;
    },

    err: (text) => ui.log(text, "error"),
    done: ($dom) => ($dom.innerHTML += `<span class="done"></span>`),

    /*********************/
    // 更析服务检测状态
    /*********************/
    updateServerStatus(is_ok) {
        conf.serverAvailable = is_ok;
        $server.className = is_ok ? "ok" : ui.serverError();
    },

    serverError() {
        ui.log("摩耳视频助手服务不可用，请检查。", "error");
        return "error";
    },

    /*********************/
    // 保存忽略列表
    /*********************/
    doSavehidhenConfig() {
        localStorage.setItem("ui_hidhen_book", ui.getInputData("ui_hidhen_book"));
        localStorage.setItem("ui_hidhen_id", ui.getInputData("ui_hidhen_id"));
    },

    initPanel2() {
        ui.putInputData("ui_hidhen_book", localStorage.getItem("ui_hidhen_book") || "");
        ui.putInputData("ui_hidhen_id", localStorage.getItem("ui_hidhen_id") || 1);
    }
};

/*********************/
// 绑UI拖放事件
/*********************/
$basket.addEventListener("dragenter", ui.dragEnter, false);
$basket.addEventListener("dragover", ui.dragEnter, false);
$basket.addEventListener("dragleave", ui.dragLeave, false);
$basket.addEventListener("drop", ui.dropHandler, false);
$export.addEventListener("click", action.doExportData, false); // 下载数据
document.getElementById("doRestoreStorage").addEventListener("click", util.restoreMaterials, false); // 1.素材翻译

/*********************/
// 菜单动作
/*********************/
document.getElementById("doTranslate").addEventListener("click", action.doTranslate, false); // 1.素材翻译
document.getElementById("doGenPhonetic").addEventListener("click", action.doGenPhonetic, false); // 2.拼音音标
document.getElementById("doGenAudio").addEventListener("click", action.doGenAudio, false); // 3.音频素材
document.getElementById("doGenSlide").addEventListener("click", action.doGenSlide, false); // 4.字幕素材
document.getElementById("doGenVideo").addEventListener("click", action.doGenVideo, false); // 5.视频素材
document.getElementById("doEstimate").addEventListener("click", action.doEstimate, false); // 6.工程估算
document.getElementById("doBuild").addEventListener("click", action.doBuild, false); // 7.生成作品

/*********************/
// 绑表格点击事件
/*********************/
$content.addEventListener("click", ui.doCellClick, false);
$content.addEventListener("mouseover", ui.onMouseOverCell, false);
$edittool.addEventListener("mouseover", ui.showEditTool, false);
$content.addEventListener("mouseleave", ui.hideEditTool, false);

/*********************/
// 编辑工具
/*********************/
$content.addEventListener("mousedown", ui.cellSelectStart, false);
document.body.addEventListener("mouseup", ui.cellSelectEnd, false);
$doCellEdit.addEventListener("click", ui.cellEditStart, false);
$doEditDone.addEventListener("click", ui.cellEditDone, false);
$doEditRestore.addEventListener("click", ui.cellEditRestore, false);
$doMakeSentence.addEventListener("click", ui.doMakeSentence, false);
$doCellTranslate.addEventListener("click", ui.doCellTranslate, false);
$doCellPinyin.addEventListener("click", ui.doCellPinyin, false);
$doGenLineMedia.addEventListener("click", ui.doGenLineMedia, false);

/*********************/
// 素材工具
/*********************/
document.getElementById("icon-plus").addEventListener("click", ui.themeIdIncrease, false);
document.getElementById("icon-minus").addEventListener("click", ui.themeIdDecrease, false);
document.getElementById("icon-save").addEventListener("click", ui.themeIdSave, false);
document.getElementById("icon-confirm").addEventListener("click", ui.rangeConfirm, false);
document.getElementById("icon-verify").addEventListener("click", ui.rangeVerify, false);
document.getElementById("icon-locate").addEventListener("click", ui.locateSid, false);
document.getElementById("icon-mark").addEventListener("click", ui.lineMark, false);
document.getElementById("program").addEventListener("change", ui.onProgramChange, false);

/*********************/
// 管理工具
/*********************/
document.getElementById("doPing").addEventListener("click", action.doPing, false);
document.getElementById("panel1").addEventListener("click", ui.switchPanel, false);
document.getElementById("panel2").addEventListener("click", ui.switchPanel, false);
document.getElementById("doNewBook").addEventListener("click", action.doNewBook, false);
document.getElementById("doMoveTemplate").addEventListener("click", action.doMoveTemplate, false);
document.getElementById("doGenTranasCmd").addEventListener("click", action.doGenTranasCmd, false);
document.getElementById("doOpenPublishTool").addEventListener("click", action.doOpenPublishTool, false);
document.getElementById("doSavehidhenConfig").addEventListener("click", ui.doSavehidhenConfig, false);

/*********************/
// 造句工具
/*********************/
document.getElementById("sd-custom-input").addEventListener("click", ui.doAddInput, false);
document.getElementById("doSentenceConfirm").addEventListener("click", ui.doSentenceConfirm, false);
document.getElementById("doSentenceCancel").addEventListener("click", ui.doSentenceClose, false);
$doSentenceSwitchMode.addEventListener("click", ui.doSentenceSwitchMode, false);

/*********************/
// 回车确认工具
/*********************/
document.body.addEventListener("keypress", (e) => {
    if (e.code === "Enter") {
        let target = e.target;
        if (target.id === "startid" || target.id === "endid") {
            ui.rangeConfirm();
        } else if (target.id === "marknum") {
            ui.lineMark();
        } else if (target.id === "targetsid") {
            ui.locateSid();
        } else if (target.id === "sd-input") {
            ui.doAddInput();
        } else if (target.tagName === "TD" && conf.editTool.locker) {
            ui.cellEditDone();
        }
    }
});
