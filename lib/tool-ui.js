/* global conf, util, action */
let $divImport = document.getElementById("basket"),
    $content = document.getElementById("content"),
    $materials = document.getElementById("material"),
    $projectid = document.getElementById("projectid"),
    $lesson = document.getElementById("lesson"),
    $log = document.getElementById("log"),
    $preview = document.getElementById("preview"),
    $edittool = document.getElementById("edittool");

let ui = {
    /*********************/
    // 创建工程
    /*********************/
    async syncProject() {
        let projectId = ui.getInputData("projectid") || "0001",
            lesson = ui.getSelectData("lesson"),
            theme = util.getTheme(projectId, lesson),
            ret = await action.syncProject(projectId, lesson, theme);
        conf.maxid = +ret.maxid;
        ui.putInputData("projectid", util.fmtProjectId(ret.data.projectid)); // 用请求返回里的值填入
        ui.onProjectChange(); // 并触发值改变事件
    },

    initLessonSelector() {
        for (let [key, value] of Object.entries(conf.lesson)) {
            $lesson.innerHTML += `<option value="${key}">${value.cn}</option>`;
        }
    },

    initMaterialsTable() {
        $materials.innerHTML = "<tr>" + conf.fieldList.map((item) => `<th>${item}</th>`).join("") + "</tr>";
    },

    /*********************/
    // 读写页面中的DOM
    /*********************/
    getInputData: (id) => document.getElementById(id).value,
    putInputData: (id, value) => (document.getElementById(id).value = value),
    getSelectData: (id) => document.getElementById(id).value,
    putSelectData: (id, value) => (document.getElementById(id).value = value),
    useCustomId: () => document.getElementById("ignoreConfMaxid").checked,
    getCell: (id, field) => document.querySelector(`#material-${id} .${field}`),
    getRow: (id) => document.querySelector(`#material-${id}`),
    clearMaterials: () => $materials.querySelectorAll("tr[id]").forEach((line) => line.remove()),

    /*********************/
    // 操作名字和类型
    /*********************/
    onProjectChange() {
        conf.info.projectid = ui.getInputData("projectid") || "0001";
        conf.info.lesson = ui.getSelectData("lesson") || "Living Chinese";
        conf.info.theme = util.getTheme(conf.info.projectid, conf.info.lesson);
        localStorage.setItem("projectid", conf.info.projectid);
        localStorage.setItem("lesson", conf.info.lesson);
        localStorage.setItem("theme", conf.info.theme);
        localStorage.setItem("maxid", conf.maxid);
        $preview.src = `media/images/${conf.info.theme}.png`;
    },

    onThemeNotExist() {
        $preview.src = `lib/notheme.png`;
    },

    onThemeClick: () => window.open($preview.src, "preview"),

    /*********************/
    // 拖放事件处理
    /*********************/
    dragLeave: () => $divImport.classList.remove("dragover"),

    dragEnter(e) {
        $divImport.classList.add("dragover");
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
        conf.fieldList.forEach((item, index) => {
            let cell = row.insertCell(-1);
            cell.className = conf.fieldList[index];
            cell.innerHTML = data[item] || ui.getInitMedia(item);
        });
        conf.materials[data.id] = data;
    },

    getInitMedia(name) {
        if (name === "check") {
            return `<svg class="svg isready" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="30" height="20" viewBox="0 0 30 20"><path d="M22.2274,0.754986C22.9151,-0.109473,24.1733,-0.252743,25.0377,0.434996L25.0377,0.434996C25.9033,1.12137,26.0473,2.38054,25.3593,3.24451L15.7644,15.3113C15.3844,15.7865,14.80844,16.0665,14.19886,16.0665C13.58928,16.0665,13.0125,15.7897,12.63331,15.3121L8.26144,9.81231C7.5746400000000005,8.94742,7.7186900000000005,7.68959,8.58324,7.00236C9.447790000000001,6.31513,10.7057,6.45857,11.39335,7.32279L14.19966,10.8539L22.2274,0.754986ZM21,17L21,11.137L23,8.62178L23,17C23,18.6569,21.6569,20,20,20L8,20C6.34315,20,5,18.6569,5,17L5,5C5,3.34315,6.34315,2,8,2L19.3216,2L17.7317,4L8,4Q7.585789999999999,4,7.29289,4.29289Q7,4.58579,7,5L7,17Q7,17.4142,7.29289,17.7071Q7.585789999999999,18,8,18L20,18Q20.4142,18,20.7071,17.7071Q21,17.4142,21,17Z" fill-rule="evenodd" fill-opacity="1"/></svg>`;
        } else if (name === "slide") {
            return (
                `<svg class="svg text" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="30" height="20" viewBox="0 0 30 20"><path d="M0,4L0,16C0,18.2091,1.79086,20,4,20L26,20C28.2091,20,30,18.2091,30,16L30,4C30,1.79086,28.2091,0,26,0L4,0C1.79086,0,0,1.79086,0,4ZM2.58579,17.4142Q2,16.8284,2,16L2,4Q2,3.17157,2.58579,2.58579Q3.17157,2,4,2L26,2Q26.8284,2,27.4142,2.58579Q28,3.17157,28,4L28,16Q28,16.8284,27.4142,17.4142Q26.8284,18,26,18L4,18Q3.17157,18,2.58579,17.4142ZM9,7C8.44771,7,8,7.44772,8,8C8,8.55229,8.44771,9,9,9L22,9C22.5523,9,23,8.55229,23,8C23,7.44772,22.5523,7,22,7L9,7ZM9,12C8.44771,12,8,12.4477,8,13C8,13.5523,8.44771,14,9,14L22,14C22.5523,14,23,13.5523,23,13C23,12.4477,22.5523,12,22,12L9,12Z" fill-rule="evenodd" fill-opacity="1"/></svg>` +
                `<svg class="svg ding" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="30" height="20" viewBox="0 0 30 20"><path d="M0,4L0,16C0,18.2091,1.79086,20,4,20L26,20C28.2091,20,30,18.2091,30,16L30,4C30,1.79086,28.2091,0,26,0L4,0C1.79086,0,0,1.79086,0,4ZM2.58579,17.4142Q2,16.8284,2,16L2,4Q2,3.17157,2.58579,2.58579Q3.17157,2,4,2L26,2Q26.8284,2,27.4142,2.58579Q28,3.17157,28,4L28,16Q28,16.8284,27.4142,17.4142Q26.8284,18,26,18L4,18Q3.17157,18,2.58579,17.4142ZM18,10Q18,8.75736,17.1213,7.87868Q16.2426,7,15,7Q13.7574,7,12.8787,7.87868Q12,8.75736,12,10L12,15L9.5,15C8.67157,15,8,14.3284,8,13.5L8,12.5C8,11.6716,8.67157,11,9.5,11L10,11L10,10C10,7.23858,12.2386,5,15,5C17.7614,5,20,7.23858,20,10L20,11L20.5,11C21.3284,11,22,11.6716,22,12.5L22,13.5C22,14.3284,21.3284,15,20.5,15L18,15L18,10Z" fill-rule="evenodd" fill-opacity="1"/></svg>`
            );
        } else if (name.match(/^media/)) {
            return (
                `<svg class="svg audio" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="30" height="20" viewBox="0 0 30 20"><path d="M0,4L0,16C0,18.2091,1.79086,20,4,20L26,20C28.2091,20,30,18.2091,30,16L30,4C30,1.79086,28.2091,0,26,0L4,0C1.79086,0,0,1.79086,0,4ZM2.58579,17.4142Q2,16.8284,2,16L2,4Q2,3.17157,2.58579,2.58579Q3.17157,2,4,2L26,2Q26.8284,2,27.4142,2.58579Q28,3.17157,28,4L28,16Q28,16.8284,27.4142,17.4142Q26.8284,18,26,18L4,18Q3.17157,18,2.58579,17.4142ZM16.625,8.80122L17.0369,9.21312C17.3006,9.47684,17.6583,9.62498,18.0312,9.62498C18.4042,9.62498,18.7619,9.47684,19.0256,9.21312C19.2894,8.9494,19.4375,8.5917,19.4375,8.21873C19.4375,7.84578,19.2894,7.4881,19.0256,7.22438L16.2131,4.41188C15.664,3.86271,14.7735,3.86271,14.2244,4.41188C13.9606,4.6756,13.8125,5.03327,13.8125,5.40624L13.8125,9.62498Q12.6475,9.62498,11.8237,10.4487Q11,11.2725,11,12.4375Q11,13.6025,11.8237,14.4262Q12.6475,15.25,13.8125,15.25Q14.9775,15.25,15.8013,14.4262Q16.625,13.6025,16.625,12.4375L16.625,8.80122Z" fill-rule="evenodd" fill-opacity="1"/></svg>` +
                `<svg class="svg video" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="30" height="20" viewBox="0 0 30 20"><path d="M0,4L0,16C0,18.2091,1.79086,20,4,20L26,20C28.2091,20,30,18.2091,30,16L30,4C30,1.79086,28.2091,0,26,0L4,0C1.79086,0,0,1.79086,0,4ZM2.58579,17.4142Q2,16.8284,2,16L2,4Q2,3.17157,2.58579,2.58579Q3.17157,2,4,2L26,2Q26.8284,2,27.4142,2.58579Q28,3.17157,28,4L28,16Q28,16.8284,27.4142,17.4142Q26.8284,18,26,18L4,18Q3.17157,18,2.58579,17.4142ZM11,7.66723L11,13.2228C10.9998,13.8288,11.3285,14.3871,11.8585,14.6809C12.3884,14.9748,13.0361,14.9578,13.55,14.6367L17.9944,11.8589C19.0401,11.2063,19.0401,9.68372,17.9944,9.03111L13.55,6.25334C13.0361,5.93217,12.3884,5.91522,11.8585,6.20906C11.3285,6.50291,10.9998,7.06125,11,7.66723Z" fill-rule="evenodd" fill-opacity="1"/></svg>`
            );
        }
        return "";
    },

    updateCell(id, field, type, css) {
        let dom = document.querySelector(`#material-${id} .${field} .${type}`),
            cssList = ["exist", "required", "ignored"].filter((item) => item !== css);
        dom.classList.remove(...cssList);
        dom.classList.add(css);
    },

    /*********************/
    // 点击表格内容预览
    /*********************/
    doPreviewMaterials(event) {
        let dom = event.target,
            id = dom.closest("tr").dataset.id;
        if (dom.className.match(/^media/)) {
            action.genVideoPiece(id, dom.className, true); // force=true,覆盖生成
        } else if (dom.classList.contains("slide")) {
            action.genSlidePiece(id, true); // force=true,覆盖生成
        } else if (dom.classList.contains("id")) {
            window.open(`api-page.php?id=${id}&theme=${conf.info.theme}&language=${util.getLanguage()}`, "preview");
        } else if (dom.classList.contains("check")) {
            window.open(`api-preview.php?id=${id}&theme=${conf.info.theme}`, "preview");
        }
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
    // Action影响Video生成按钮
    /*********************/
    enableGenVideoBtn() {
        document.getElementById("doGenVideo").disabled = false;
    },

    /*********************/
    // 生成导出模板按钮
    /*********************/
    updateDownloadLink(type = "Template") {
        let link = document.getElementById("download" + type),
            binary = util.getXlsxBinary(util.getMaterialExport(type));
        link.download = type === "Template" ? "template.xlsx" : `${conf.info.theme}.xlsx`;
        link.href = URL.createObjectURL(new Blob([binary]));
    },

    /*********************/
    // 文本上的浮动菜单
    /*********************/
    activeEditTool(e) {
        if (e.target.className.match(/chinese|english/) && !conf.edit.locker) {
            let rect = e.target.getBoundingClientRect();
            conf.edit.dom = e.target;
            conf.edit.id = e.target.closest("tr").dataset.id;
            conf.edit.language = e.target.className;
            $edittool.style.left = rect.left + "px";
            $edittool.style.top = rect.top - 20 + "px";
            ui.showEditTool();
        } else {
            if (!conf.edit.locker) {
                ui.hideEditTool();
            }
        }
    },

    showEditTool(){
        $edittool.style.display = "flex";
    },

    hideEditTool() {
        $edittool.style.display = "none";
    },

    doEditCell() {
        conf.edit.dom.contentEditable = "true";
        conf.edit.locker = true;
        ui.switchEditTool();
    },

    doEditDone() {
        conf.edit.dom.contentEditable = "false";
        conf.edit.locker = false;
        ui.switchEditTool();
    },

    doEditRestore() {
        conf.edit.dom.innerText = conf.materials[conf.edit.id][conf.edit.language];
        conf.edit.dom.contentEditable = "false";
        conf.edit.locker = false;
        ui.switchEditTool();
    },

    switchEditTool() {
        document.getElementById("doEditCell").style.display = conf.edit.locker ? "none" : "block";
        document.getElementById("doGenAudioPiece").style.display = conf.edit.locker ? "none" : "block";
        document.getElementById("doEditDone").style.display = conf.edit.locker ? "block" : "none";
        document.getElementById("doEditRestore").style.display = conf.edit.locker ? "block" : "none";
    },

    async doGenAudioPiece() {
        await action.genAudioPiece(conf.edit.id, conf.edit.language, true); //force=true,覆盖生成
    }
};

/*********************/
// 主题名字 = Lesson缩写 + ProjectId
/*********************/
$projectid.addEventListener("input", ui.onProjectChange, false);
$projectid.addEventListener("paste", ui.onProjectChange, false);
$lesson.addEventListener("change", ui.onProjectChange, false);

/*********************/
// 加载背景图失败
/*********************/
$preview.addEventListener("error", ui.onThemeNotExist, false);
$preview.addEventListener("click", ui.onThemeClick, false);
document.getElementById("createProject").addEventListener("click", ui.syncProject, false);

/*********************/
// 绑UI拖放事件
/*********************/
$divImport.addEventListener("dragenter", ui.dragEnter, false);
$divImport.addEventListener("dragover", ui.dragEnter, false);
$divImport.addEventListener("dragleave", ui.dragLeave, false);
$divImport.addEventListener("drop", ui.dropHandler, false);

/*********************/
// 生成视频步骤
/*********************/
document.getElementById("doTranslate").addEventListener("click", action.doTranslate, false);
document.getElementById("doGenPhonetic").addEventListener("click", action.doGenPhonetic, false);
document.getElementById("doGenAudio").addEventListener("click", action.doGenAudio, false);
document.getElementById("doCaptureSlide").addEventListener("click", action.doCaptureSlide, false);
document.getElementById("doPrepare").addEventListener("click", action.doPrepare, false);
document.getElementById("doGenVideo").addEventListener("click", action.doGenVideo, false);
document.getElementById("doArchive").addEventListener("click", action.doArchive, false);
document.getElementById("doExport").addEventListener("click", action.doExport, false);

/*********************/
// 绑表格点击事件
/*********************/
$content.addEventListener("click", ui.doPreviewMaterials, false);
$content.addEventListener("mouseover", ui.activeEditTool, false);
$content.addEventListener("mouseleave", ui.hideEditTool, false);
$edittool.addEventListener("mouseover", ui.showEditTool, false);

/*********************/
// 绑编辑工具
/*********************/
document.getElementById("doEditCell").addEventListener("click", ui.doEditCell, false);
document.getElementById("doEditDone").addEventListener("click", ui.doEditDone, false);
document.getElementById("doGenAudioPiece").addEventListener("click", ui.doGenAudioPiece, false);
document.getElementById("doEditRestore").addEventListener("click", ui.doEditRestore, false);
