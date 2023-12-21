/* global conf, util, action */
let $basket = document.getElementById("basket"),
    $content = document.getElementById("content"),
    $materials = document.getElementById("material"),
    $projectid = document.getElementById("projectid"),
    $lesson = document.getElementById("lesson"),
    $program = document.getElementById("program"),
    $log = document.getElementById("log"),
    $preview = document.getElementById("preview"),
    $edittool = document.getElementById("edittool"),
    $server = document.getElementById("server"),
    $doEditCell = document.getElementById("doEditCell"),
    $doGenAudioPiece = document.getElementById("doGenAudioPiece"),
    $doEditDone = document.getElementById("doEditDone"),
    $doEditRestore = document.getElementById("doEditRestore");

let ui = {
    /*********************/
    // 创建工程
    /*********************/
    initLessonSelector() {
        for (let [key, value] of Object.entries(conf.lesson)) {
            $lesson.innerHTML += `<option value="${key}">${value.cn}</option>`;
        }
    },

    initProgramSelector() {
        for (let [key, value] of Object.entries(conf.program)) {
            $program.innerHTML += `<option value="${key}">${value.name}</option>`;
        }
    },

    initMaterialsTable() {
        $materials.innerHTML = "<tr>" + conf.uiFields.map((item) => `<th>${item}</th>`).join("") + "</tr>";
    },

    initRangeBox() {
        conf.range.idList = Object.keys(conf.materials).map((i) => +i);
        conf.range.min = Math.min(...conf.range.idList);
        conf.range.max = Math.max(...conf.range.idList);
        ui.putInputData("startid", conf.range.min); //填上缺省值
        ui.putInputData("endid", conf.range.max);
        ui.confirmRange(); // confirm一次
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
    // 操作名字和类型
    /*********************/
    onProjectChange() {
        let lesson = ui.getSelectData("lesson") || "Living Chinese";
        conf.info.projectid = ui.getInputData("projectid") || "0001";
        conf.info.lesson = lesson;
        conf.info.lesson_cn = conf.lesson[lesson].cn;
        conf.info.lesson_abbr = conf.lesson[lesson].abbr;
        conf.info.language = lesson.match(/chinese/i) ? "chinese" : "english";
        conf.info.theme = util.getTheme(conf.info.projectid, lesson);
        localStorage.setItem("lesson", lesson);
        $preview.src = `media/images/${conf.info.theme}.png`;
        ui.log(`当前课程选择：${conf.lesson[lesson].cn}`, "highlight");
    },

    onProgramChange() {
        let program = ui.getSelectData("program");
        conf.info.program = program;
        conf.rules = conf.programRules[program];
        util.checkMaterials(); // 检查所有语料的素材是否准备完全
        conf.tasks = []; // 风格变化后，要重新估算生成task
        ui.log(`视频风格选择：${conf.program[program].name}`, "highlight");
    },

    confirmRange() {
        conf.range.start = Math.max(+ui.getInputData("startid"), conf.range.min);
        conf.range.end = Math.min(ui.getInputData("endid"), conf.range.max);
        ui.putInputData("startid", conf.range.start);
        ui.putInputData("endid", conf.range.end);
        conf.range.rangeList = [...Array.from({ length: conf.range.end - conf.range.start + 1 }, (_, i) => i + conf.range.start)];
        conf.tasks = []; // 范围变化后，要重新估算生成task
        conf.range.idList.forEach((id) => (document.getElementById(`material-${id}`).className = id >= conf.range.start && id <= conf.range.end ? "" : "skip"));
        conf.range.selected = false; // 选择重置
        ui.log(`素材范围选择：${conf.range.start} 到 ${conf.range.end}`, "highlight");
    },

    resetRange() {
        if (conf.range.selected) {
            ui.putInputData("startid", conf.range.start);
            ui.putInputData("endid", conf.range.end);
            conf.range.selected = false;
        } else {
            conf.range.start = conf.range.min;
            conf.range.end = conf.range.max;
            ui.putInputData("startid", conf.range.min);
            ui.putInputData("endid", conf.range.max);
            conf.range.rangeList = [...Array.from({ length: conf.range.end - conf.range.start + 1 }, (_, i) => i + conf.range.start)];
            conf.tasks = []; // 范围变化后，要重新估算生成task
            document.querySelectorAll(`#material tr`).forEach((line) => line.classList.remove("skip"));
        }
        ui.log(`素材范围复位：${conf.range.start} 到 ${conf.range.end}`, "highlight");
    },

    onThemeNotExist() {
        $preview.src = `lib/notheme.png`;
    },

    onThemeClick: () => window.open($preview.src, "preview"),

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
    loadMaterial(data) {
        let row = $materials.insertRow();
        row.id = "material-" + data.id;
        row.dataset.id = data.id;
        conf.uiFields.forEach((item, index) => {
            let cell = row.insertCell(-1);
            cell.className = conf.uiFields[index];
            cell.innerHTML = data[item] || ui.getInitMedia(data.id, item);
        });
        conf.materials[data.id] = data;
    },

    /*********************/
    // 生成待生成的素材单元格，含svg图标
    /*********************/
    getInitMedia(id, name) {
        if (name.match(/^media/)) {
            let abbr = name.replace(/media_/, "");
            return (
                `<span class="svg audio" title="${id}.${abbr}.m4a"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="30" height="20" viewBox="0 0 30 20"><path d="M0,4L0,16C0,18.2091,1.79086,20,4,20L26,20C28.2091,20,30,18.2091,30,16L30,4C30,1.79086,28.2091,0,26,0L4,0C1.79086,0,0,1.79086,0,4ZM2.58579,17.4142Q2,16.8284,2,16L2,4Q2,3.17157,2.58579,2.58579Q3.17157,2,4,2L26,2Q26.8284,2,27.4142,2.58579Q28,3.17157,28,4L28,16Q28,16.8284,27.4142,17.4142Q26.8284,18,26,18L4,18Q3.17157,18,2.58579,17.4142ZM16.625,8.80122L17.0369,9.21312C17.3006,9.47684,17.6583,9.62498,18.0312,9.62498C18.4042,9.62498,18.7619,9.47684,19.0256,9.21312C19.2894,8.9494,19.4375,8.5917,19.4375,8.21873C19.4375,7.84578,19.2894,7.4881,19.0256,7.22438L16.2131,4.41188C15.664,3.86271,14.7735,3.86271,14.2244,4.41188C13.9606,4.6756,13.8125,5.03327,13.8125,5.40624L13.8125,9.62498Q12.6475,9.62498,11.8237,10.4487Q11,11.2725,11,12.4375Q11,13.6025,11.8237,14.4262Q12.6475,15.25,13.8125,15.25Q14.9775,15.25,15.8013,14.4262Q16.625,13.6025,16.625,12.4375L16.625,8.80122Z" fill-rule="evenodd" fill-opacity="1"/></svg></span>` +
                `<span class="svg video-listen" title="${id}.${abbr}.listen.m4a"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="30" height="20" viewBox="0 0 30 20"><path d="M0,16L0,4C0,1.79086,1.79086,0,4,0L26,0C28.2091,0,30,1.79086,30,4L30,16C30,18.2091,28.2091,20,26,20L4,20C1.79086,20,0,18.2091,0,16ZM2,16Q2,16.8284,2.58579,17.4142Q3.17157,18,4,18L26,18Q26.8284,18,27.4142,17.4142Q28,16.8284,28,16L28,4Q28,3.17157,27.4142,2.58579Q26.8284,2,26,2L4,2Q3.17157,2,2.58579,2.58579Q2,3.17157,2,4L2,16ZM12.4698,8.59081Q13.2857,9.38162,13.2857,10.5L13.2857,15L15.6071,15C16.3764,15,17,14.3956,17,13.65L17,12.75C17,12.0044,16.3764,11.4,15.6071,11.4L15.1429,11.4L15.1429,10.5C15.1429,8.01472,13.0642,6,10.5,6C7.93582,6,5.85714,8.01472,5.85714,10.5L5.85714,11.4L5.39286,11.4C4.6236,11.4,4,12.0044,4,12.75L4,13.65C4,14.3956,4.6236,15,5.39286,15L7.71429,15L7.71429,10.5Q7.71429,9.38162,8.5302,8.59081Q9.34612,7.8,10.5,7.8Q11.6539,7.8,12.4698,8.59081ZM18,13.2228L18,7.66723C17.9998,7.06125,18.3285,6.50291,18.8585,6.20906C19.3884,5.91522,20.0361,5.93217,20.55,6.25334L24.9944,9.03111C26.0401,9.68372,26.0401,11.2063,24.9944,11.8589L20.55,14.6367C20.0361,14.9578,19.3884,14.9748,18.8585,14.6809C18.3285,14.3871,17.9998,13.8288,18,13.2228Z" fill-rule="evenodd" fill-opacity="1"/></svg></span>` +
                `<span class="svg video-text" title="${id}.${abbr}.text.mp4"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="30" height="20" viewBox="0 0 30 20"><path d="M0,16L0,4C0,1.79086,1.79086,0,4,0L26,0C28.2091,0,30,1.79086,30,4L30,16C30,18.2091,28.2091,20,26,20L4,20C1.79086,20,0,18.2091,0,16ZM2,16Q2,16.8284,2.58579,17.4142Q3.17157,18,4,18L26,18Q26.8284,18,27.4142,17.4142Q28,16.8284,28,16L28,4Q28,3.17157,27.4142,2.58579Q26.8284,2,26,2L4,2Q3.17157,2,2.58579,2.58579Q2,3.17157,2,4L2,16ZM18,13.2228L18,7.66723C17.9998,7.06125,18.3285,6.50291,18.8585,6.20906C19.3884,5.91522,20.0361,5.93217,20.55,6.25334L24.9944,9.03111C26.0401,9.68372,26.0401,11.2063,24.9944,11.8589L20.55,14.6367C20.0361,14.9578,19.3884,14.9748,18.8585,14.6809C18.3285,14.3871,17.9998,13.8288,18,13.2228ZM4,8C4,7.44772,4.44771,7,5,7L16,7C16.5523,7,17,7.44772,17,8C17,8.55229,16.5523,9,16,9L5,9C4.44771,9,4,8.55229,4,8ZM4,13C4,12.4477,4.44771,12,5,12L16,12C16.5523,12,17,12.4477,17,13C17,13.5523,16.5523,14,16,14L5,14C4.44771,14,4,13.5523,4,13Z" fill-rule="evenodd" fill-opacity="1"/></svg></span>`
            );
        } else if (name === "slide") {
            return (
                `<span class="svg slide-listen" title="${id}.listen.png"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="30" height="20" viewBox="0 0 30 20"><path d="M0,4L0,16C0,18.2091,1.79086,20,4,20L26,20C28.2091,20,30,18.2091,30,16L30,4C30,1.79086,28.2091,0,26,0L4,0C1.79086,0,0,1.79086,0,4ZM2.58579,17.4142Q2,16.8284,2,16L2,4Q2,3.17157,2.58579,2.58579Q3.17157,2,4,2L26,2Q26.8284,2,27.4142,2.58579Q28,3.17157,28,4L28,16Q28,16.8284,27.4142,17.4142Q26.8284,18,26,18L4,18Q3.17157,18,2.58579,17.4142ZM18,10Q18,8.75736,17.1213,7.87868Q16.2426,7,15,7Q13.7574,7,12.8787,7.87868Q12,8.75736,12,10L12,15L9.5,15C8.67157,15,8,14.3284,8,13.5L8,12.5C8,11.6716,8.67157,11,9.5,11L10,11L10,10C10,7.23858,12.2386,5,15,5C17.7614,5,20,7.23858,20,10L20,11L20.5,11C21.3284,11,22,11.6716,22,12.5L22,13.5C22,14.3284,21.3284,15,20.5,15L18,15L18,10Z" fill-rule="evenodd" fill-opacity="1"/></svg></span>` +
                `<span class="svg slide-text" title="${id}.text.png"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="30" height="20" viewBox="0 0 30 20"><path d="M0,4L0,16C0,18.2091,1.79086,20,4,20L26,20C28.2091,20,30,18.2091,30,16L30,4C30,1.79086,28.2091,0,26,0L4,0C1.79086,0,0,1.79086,0,4ZM2.58579,17.4142Q2,16.8284,2,16L2,4Q2,3.17157,2.58579,2.58579Q3.17157,2,4,2L26,2Q26.8284,2,27.4142,2.58579Q28,3.17157,28,4L28,16Q28,16.8284,27.4142,17.4142Q26.8284,18,26,18L4,18Q3.17157,18,2.58579,17.4142ZM9,7C8.44771,7,8,7.44772,8,8C8,8.55229,8.44771,9,9,9L22,9C22.5523,9,23,8.55229,23,8C23,7.44772,22.5523,7,22,7L9,7ZM9,12C8.44771,12,8,12.4477,8,13C8,13.5523,8.44771,14,9,14L22,14C22.5523,14,23,13.5523,23,13C23,12.4477,22.5523,12,22,12L9,12Z" fill-rule="evenodd" fill-opacity="1"/></svg></span>` +
                `<span class="svg video-ding" title="${id}.ding.mp4"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="30" height="20" viewBox="0 0 30 20"><path d="M0,4L0,16C0,18.2091,1.79086,20,4,20L26,20C28.2091,20,30,18.2091,30,16L30,4C30,1.79086,28.2091,0,26,0L4,0C1.79086,0,0,1.79086,0,4ZM2.58579,17.4142Q2,16.8284,2,16L2,4Q2,3.17157,2.58579,2.58579Q3.17157,2,4,2L26,2Q26.8284,2,27.4142,2.58579Q28,3.17157,28,4L28,16Q28,16.8284,27.4142,17.4142Q26.8284,18,26,18L4,18Q3.17157,18,2.58579,17.4142ZM14.8653,11.7022C14.833,11.6301,14.7946,11.5593,14.75,11.4905L14.1344,10.5429C13.8833,10.1562,13.75,9.70194,13.75,9.23719L13.75,8.84999C13.75,6.7237,12.0705,5,10,5C7.92946,5,6.25058,6.7237,6.25058,8.84999L6.25058,9.23719C6.2512,9.69995,6.11757,10.1531,5.86558,10.5429L5.25003,11.4905C5.20541,11.5593,5.16704,11.6301,5.1347,11.7022C4.75998,12.5375,5.1949,13.5544,6.09447,13.806C6.69756,13.9752,7.30906,14.1044,7.925,14.1936C9.30095,14.3929,10.699,14.3929,12.075,14.1936C12.6909,14.1044,13.3024,13.9752,13.9055,13.806C14.8051,13.5544,15.24,12.5375,14.8653,11.7022ZM18,7.66723L18,13.2228C17.9998,13.8288,18.3285,14.3871,18.8585,14.6809C19.3884,14.9748,20.0361,14.9578,20.55,14.6367L24.9944,11.8589C26.0401,11.2063,26.0401,9.68372,24.9944,9.03111L20.55,6.25334C20.0361,5.93217,19.3884,5.91522,18.8585,6.20906C18.3285,6.50291,17.9998,7.06125,18,7.66723ZM12.724,12.043L12.4571,11.6322Q11.75,10.5434,11.75,9.23719L11.75,8.85Q11.75,8.06847,11.2188,7.52318Q10.7092,7,10,7Q9.29101,7,8.78162,7.52304Q8.25058,8.0683,8.25058,8.84999L8.25058,9.23454Q8.25231,10.535,7.54281,11.6323L7.27602,12.0431Q9.99957,12.6612,12.724,12.043ZM10,16C10.7897,16.0028,12.0102,15.1463,12.5,14.5331C11,15,9,15,7.5,14.5331C7.98982,15.1463,9.21035,16.0028,10,16Z" fill-rule="evenodd" fill-opacity="1"/></svg></span>`
            );
        } else if (name === "check") {
            return `<span class="svg isready"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="30" height="20" viewBox="0 0 30 20"><path d="M22.2274,0.754986C22.9151,-0.109473,24.1733,-0.252743,25.0377,0.434996L25.0377,0.434996C25.9033,1.12137,26.0473,2.38054,25.3593,3.24451L15.7644,15.3113C15.3844,15.7865,14.80844,16.0665,14.19886,16.0665C13.58928,16.0665,13.0125,15.7897,12.63331,15.3121L8.26144,9.81231C7.5746400000000005,8.94742,7.7186900000000005,7.68959,8.58324,7.00236C9.447790000000001,6.31513,10.7057,6.45857,11.39335,7.32279L14.19966,10.8539L22.2274,0.754986ZM21,17L21,11.137L23,8.62178L23,17C23,18.6569,21.6569,20,20,20L8,20C6.34315,20,5,18.6569,5,17L5,5C5,3.34315,6.34315,2,8,2L19.3216,2L17.7317,4L8,4Q7.585789999999999,4,7.29289,4.29289Q7,4.58579,7,5L7,17Q7,17.4142,7.29289,17.7071Q7.585789999999999,18,8,18L20,18Q20.4142,18,20.7071,17.7071Q21,17.4142,21,17Z" fill-rule="evenodd" fill-opacity="1"/></svg></span>`;
        }
        return "";
    },

    /*********************/
    // 更新素材单元格里的图标状态
    /*********************/
    updateCell(id, field, media, css) {
        let dom = document.querySelector(`#material-${id} .${field} .${media}`),
            cssList = ["exist", "required", "ignored", "unready", "ready"].filter((item) => item !== css);
        dom.classList.remove(...cssList);
        dom.classList.add(css);
    },

    /*********************/
    // 点击表格内容预览
    /*********************/
    async doPreviewMaterials(event) {
        if (!["SPAN", "TD"].includes(event.target.tagName)) {
            return; // 保护错误的事件触发
        }
        let dom = event.target,
            id = dom.closest("tr").dataset.id,
            field = dom.closest("td").className,
            target = dom.className.replace(/svg|required|exist| /g, "");
        if (target === "audio") {
            await action.genAudioPiece(id, field, true); //force=true,覆盖生成
        } else if (target.match(/^video/)) {
            action.genVideoPiece(id, field, target, true); // force=true,覆盖生成
        } else if (target.match(/^slide/)) {
            action.genSlidePiece(id, target.replace(/slide-/, ""), true); // force=true,覆盖生成
        } else if (field === "type") {
            window.open(`api-page.php?id=${id}&theme=${conf.info.theme}&language=${conf.info.language}`, "preview");
        } else if (field === "check") {
            window.open(`api-preview.php?id=${id}&theme=${conf.info.theme}`, "preview");
        }
    },

    doSelectStart(event) {
        if (event.target.tagName === "TD" && event.target.className === "id") {
            $materials.classList.add("unselectable");
            conf.onselect = +event.target.innerText;
            console.log();
        }
    },

    doSelectEnd() {
        if (conf.onselect) {
            $materials.classList.remove("unselectable");
            delete conf.onselect;
            document.querySelectorAll(`#material tr`).forEach((line) => line.classList.remove("selecting"));
        }
    },

    /*********************/
    // 文本上的浮动菜单
    /*********************/
    onMouseOverCell(event) {
        if (event.target.tagName === "TD" && conf.onselect) {
            console.log(event.target);
            let doms = document.querySelectorAll(`#material tr`),
                id = event.target.closest("tr").dataset.id,
                start = Math.min(conf.onselect, id),
                end = Math.max(conf.onselect, id);
            ui.putInputData("startid", start); //填上缺省值
            ui.putInputData("endid", end);
            conf.range.selected = true;
            doms.forEach((line) => (line.dataset.id >= start && line.dataset.id <= end ? line.classList.add("selecting") : line.classList.remove("selecting")));
            return;
        }
        if (!conf.editTool.locker) {
            if (event.target.className.match(/chinese|english/)) {
                ui.showEditTool({ target: event.target, isfromtd: true });
            } else {
                ui.hideEditTool();
            }
        }
    },

    showEditTool(event) {
        if (event.isfromtd) {
            let rect = event.target.getBoundingClientRect();
            conf.editTool.dom = event.target;
            conf.editTool.id = event.target.closest("tr").dataset.id;
            conf.editTool.language = event.target.className;
            $edittool.style.left = rect.left + "px";
            $edittool.style.top = rect.top - 20 + "px";
        }
        $edittool.style.display = "flex";
    },

    hideEditTool() {
        $edittool.style.display = "none";
    },

    doEditCell() {
        conf.editTool.dom.contentEditable = "true";
        conf.editTool.locker = true;
        ui.switchEditTool();
    },

    doEditDone() {
        conf.editTool.dom.contentEditable = "false";
        conf.editTool.locker = false;
        ui.switchEditTool();
    },

    doEditRestore() {
        conf.editTool.dom.innerText = conf.materials[conf.editTool.id][conf.editTool.language];
        conf.editTool.dom.contentEditable = "false";
        conf.editTool.locker = false;
        ui.switchEditTool();
    },

    switchEditTool() {
        $doEditCell.style.display = conf.editTool.locker ? "none" : "block";
        $doGenAudioPiece.style.display = conf.editTool.locker ? "none" : "block";
        $doEditDone.style.display = conf.editTool.locker ? "block" : "none";
        $doEditRestore.style.display = conf.editTool.locker ? "block" : "none";
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
    // 生成导出模板按钮
    /*********************/
    updateDownloadLink(type = "Template") {
        let link = document.getElementById("download" + type),
            binary = util.getXlsxBinary(...util.getMaterialForExport(type));
        link.download = type === "Template" ? "template.xlsx" : `${conf.lesson[conf.info.lesson].cn} ${+conf.info.projectid}.xlsx`;
        link.href = URL.createObjectURL(new Blob([binary]));
        conf.contentDownloaded = false;
    },

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

    doPing() {
        util.ping();
    }
};

/*********************/
// 工程配置
/*********************/
$projectid.addEventListener("input", ui.onProjectChange, false);
$projectid.addEventListener("paste", ui.onProjectChange, false);
$lesson.addEventListener("change", ui.onProjectChange, false);
$program.addEventListener("change", ui.onProgramChange, false);
$preview.addEventListener("error", ui.onThemeNotExist, false);
$preview.addEventListener("click", ui.onThemeClick, false);
document.getElementById("createProject").addEventListener("click", util.getProjectid, false);
document.getElementById("confirmRange").addEventListener("click", ui.confirmRange, false);
document.getElementById("resetRange").addEventListener("click", ui.resetRange, false);

/*********************/
// 绑UI拖放事件
/*********************/
$basket.addEventListener("dragenter", ui.dragEnter, false);
$basket.addEventListener("dragover", ui.dragEnter, false);
$basket.addEventListener("dragleave", ui.dragLeave, false);
$basket.addEventListener("drop", ui.dropHandler, false);

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
document.getElementById("doArchive").addEventListener("click", action.doArchive, false); // 8.存档数据
$doGenAudioPiece.addEventListener("click", action.doGenAudioPiece, false); // 浮动菜单的 audio

/*********************/
// 绑表格点击事件
/*********************/
$content.addEventListener("click", ui.doPreviewMaterials, false);
$content.addEventListener("mouseover", ui.onMouseOverCell, false);
$content.addEventListener("mouseleave", ui.hideEditTool, false);
$content.addEventListener("mousedown", ui.doSelectStart, false);
document.body.addEventListener("mouseup", ui.doSelectEnd, false);

$edittool.addEventListener("mouseover", ui.showEditTool, false);

/*********************/
// 绑编辑工具
/*********************/
$doEditCell.addEventListener("click", ui.doEditCell, false);
$doEditDone.addEventListener("click", ui.doEditDone, false);
$doEditRestore.addEventListener("click", ui.doEditRestore, false);

/*********************/
// 绑编辑工具
/*********************/
document.getElementById("doPing").addEventListener("click", ui.doPing, false);
