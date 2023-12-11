/* global conf, util, action */
let $divImport = document.getElementById("basket"),
    $domMaterials = document.getElementById("material"),
    $projectid = document.getElementById("projectid"),
    $lesson = document.getElementById("lesson"),
    $log = document.getElementById("log"),
    $preview = document.getElementById("preview");

let ui = {
    /*********************/
    // 创建工程
    /*********************/
    syncProject: async function () {
        let projectId = ui.getInputData("projectid") || "0001",
            lesson = ui.getSelectData("lesson"),
            theme = util.getTheme(projectId, lesson),
            ret = await action.syncProject(projectId, lesson, theme);
        conf.maxid = +ret.maxid;
        ui.putInputData("projectid", util.fmtProjectId(ret.data.projectid)); // 用请求返回里的值填入
        ui.putSelectData("lesson", ret.data.lesson); // 用请求返回里的值填入
        ui.onProjectChange(); // 并触发值改变事件
    },

    initLessonSelector: function () {
        for (let [key, value] of Object.entries(conf.lesson)) {
            $lesson.innerHTML += `<option value="${key}">${value.cn}</option>`;
        }
    },

    initMaterialsTable: function () {
        $domMaterials.innerHTML = "<tr>" + conf.fieldList.map((item) => `<th>${item}</th>`).join("") + "</tr>";
    },

    /*********************/
    // 读写页面中的两个input
    /*********************/
    getInputData: function (id) {
        return document.getElementById(id).value;
    },

    putInputData: function (id, value) {
        document.getElementById(id).value = value;
    },

    getSelectData: function (id) {
        return document.getElementById(id).value;
    },

    putSelectData: function (id, value = "Living Chinese") {
        document.getElementById(id).value = value;
    },
    /*********************/
    // 操作名字和类型
    /*********************/
    onProjectChange: function () {
        conf.info.projectid = ui.getInputData("projectid") || "0001";
        conf.info.lesson = ui.getSelectData("lesson") || "Living Chinese";
        conf.info.theme = util.getTheme(conf.info.projectid, conf.info.lesson);
        localStorage.setItem("projectid", conf.info.projectid);
        localStorage.setItem("lesson", conf.info.lesson);
        localStorage.setItem("theme", conf.info.theme);
        localStorage.setItem("maxid", conf.maxid);
        $preview.src = `media/images/${conf.info.theme}.png`;
    },

    onThemeNotExist: function () {
        $preview.src = `lib/notheme.png`;
    },

    onThemeClick: function () {
        window.open($preview.src, "preview");
    },

    /*********************/
    // 拖放事件处理
    /*********************/
    dragLeave: function () {
        $divImport.classList.remove("dragover");
    },

    dragEnter: function (e) {
        $divImport.classList.add("dragover");
        e.stopPropagation();
        e.preventDefault();
    },

    dropHandler: function (e) {
        let file = e.dataTransfer.files;
        e.stopPropagation();
        e.preventDefault();
        ui.dragLeave();
        return file.length ? action.doImportMaterials(file[0]) : ui.err(`拖入的不是文件`);
    },

    /*********************/
    // 把数据加载到UI里
    /*********************/
    loadMaterial: function (data) {
        let row = $domMaterials.insertRow();
        row.id = "material-" + data.id;
        row.dataset.id = data.id;
        row.className = data.isready ? "ready" : "";
        conf.fieldList.forEach((item, index) => {
            let cell = row.insertCell(-1);
            cell.className = conf.fieldList[index];
            cell.innerHTML = data[item] || "";
        });
        conf.materials[data.id] = data;
    },

    clearMaterials: function () {
        $domMaterials.querySelectorAll("tr[id]").forEach((line) => line.remove());
    },

    /*********************/
    // 点击表格内容预览
    /*********************/
    doPreviewMaterials: function (event) {
        let dom = event.target,
            row = dom.closest("tr");
        if (dom.className.match(/male$/)) {
            window.open(`media/material/audio/${dom.textContent}`, "preview");
        } else if (dom.className.match(/^id$/)) {
            window.open(`api-page.php?id=${row.dataset.id}&theme=${conf.info.theme}&lesson=${util.getLesson()}`, "preview");
        } else if (dom.className.match(/^slide$/)) {
            window.open(`media/material/slide/${dom.textContent}`, "preview");
        }
    },

    /*********************/
    // 数据库管理
    /*********************/
    doPopAdmin: function () {
        window.open(`admin/`, "db_admin");
    },

    /*********************/
    // 输出页内Log
    /*********************/
    log: function (text, level = "info") {
        let $newdom = document.createElement("div");
        $newdom.className = level;
        $newdom.innerText = text;
        $log.appendChild($newdom);
        $log.scrollTop = $log.scrollHeight;
        return $newdom;
    },

    err: function (text) {
        ui.log(text, "error");
    },

    done: function ($dom) {
        $dom.innerHTML += `<span class="done"></span>`;
    },

    /*********************/
    // Action影响Video生成按钮
    /*********************/
    enableGenVideoBtn: function () {
        document.getElementById("doGenVideo").disabled = false;
    },

    /*********************/
    // 生成导出模板按钮
    /*********************/
    updateDownloadLink: function (type = "Template") {
        let link = document.getElementById("download" + type),
            binary = util.getXlsxBinary(util.getMaterialExport(type));
        link.download = type === "Template" ? "template.xlsx" : `${conf.info.theme}.xlsx`;
        link.href = URL.createObjectURL(new Blob([binary]));
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
// 数据库管理
/*********************/
document.getElementById("popAdmin").addEventListener("click", ui.doPopAdmin, false);

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
$domMaterials.addEventListener("click", ui.doPreviewMaterials, false);
