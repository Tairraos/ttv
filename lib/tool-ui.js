/* global conf,fieldsList,action*/
let $divImport = document.getElementById("basket"),
    $domMaterials = document.getElementById("material"),
    $log = document.getElementById("log"),
    $preview = document.getElementById("preview");

let ui = {
    /*********************/
    // 创建工程
    /*********************/
    createProject: async function () {
        let ret = await action.syncProject(ui.getInputData("theme") || "default", ui.getRadioValue("lesson"));
        ui.putInputData("theme", ret.data.projectid); // 用请求返回里的值填入
        ui.putRadioValue("lesson", ret.data.lesson); // 用请求返回里的值填入
        ui.onThemeChange(); // 并触发值改变事件
        ui.onTypeChange(); // 并触发值改变事件
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

    getRadioValue: function (id) {
        return document.querySelector(`input[name=${id}]:checked`).value;
    },

    putRadioValue: function (id, value = "chinese") {
        document.querySelector(`input[name=${id}][value=${value}]`).checked = true;
    },
    /*********************/
    // 操作名字和类型
    /*********************/
    onThemeChange: function () {
        conf.info.theme = ui.getInputData("theme") || "default";
        localStorage.setItem("theme", conf.info.theme);
        $preview.src = `media/images/${conf.info.theme}.jpg`;
    },

    onThemeNotExist: function () {
        $preview.src = `lib/notheme.png`;
    },

    onThemeClick: function () {
        window.open($preview.src, "preview");
    },

    onTypeChange: function () {
        localStorage.setItem("lesson", ui.getRadioValue("lesson"));
        conf.info.lesson = ui.getRadioValue("lesson") || "chinese";
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
        fieldsList.forEach((item, index) => {
            let cell = row.insertCell(-1);
            cell.className = fieldsList[index];
            cell.innerHTML = data[item] || "";
        });
        conf.materials[data.id] = data;
    },

    /*********************/
    // 点击表格内容预览
    /*********************/
    doPreviewMaterials: function (event) {
        let dom = event.target,
            row = dom.closest("tr");
        if (dom.className.match(/male$/)) {
            window.open(`media/material/${dom.textContent}`, "preview");
        } else if (dom.className.match(/^id$/)) {
            window.open(`api-page.php?id=${row.dataset.id}&theme=${conf.info.theme}&lesson=${conf.info.lesson}`, "preview");
        } else if (dom.className.match(/^slide$/)) {
            window.open(`media/material/${dom.textContent}`, "preview");
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
    }
};

/*********************/
// 主题名字 = 背景文件名 = 视频名字
/*********************/
document.getElementById("theme").addEventListener("input", ui.onThemeChange, false);
document.getElementById("theme").addEventListener("paste", ui.onThemeChange, false);

/*********************/
// 绑radio事件
/*********************/
let $radio = document.getElementsByName("type");
for (let i = 0; i < $radio.length; i++) {
    $radio[i].addEventListener("click", ui.onTypeChange, false);
}

/*********************/
// 加载背景图失败
/*********************/
$preview.addEventListener("error", ui.onThemeNotExist, false);
$preview.addEventListener("click", ui.onThemeClick, false);
document.getElementById("createProject").addEventListener("click", ui.createProject, false);

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
document.getElementById("doGenNotes").addEventListener("click", action.doGenNotes, false);
document.getElementById("doArchive").addEventListener("click", action.doArchive, false);

/*********************/
// 绑表格点击事件
/*********************/
$domMaterials.addEventListener("click", ui.doPreviewMaterials, false);
