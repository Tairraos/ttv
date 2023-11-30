/* global ui */
let conf = {
    materials: {}, // 库里的语料都在此，对应屏幕上的表格
    info: {
        dingmp3: "../common/ding.mp3"
    }, // 生成视频需要的信息在此
    tasks: [], // 任务就是生成视频顺序和素材
    dict: null,
    voice: {
        groupid: 0,
        cn_female:"zh-CN-XiaoqiuNeural",
        cn_male:"zh-CN-YunzeNeural",
        en_female:"en-US-MichelleNeural",
        en_male:"en-US-ChristopherNeural",
        cnlib: {
            female: ["zh-CN-XiaoqiuNeural", "zh-CN-XiaoyanNeural", "zh-CN-XiaohanNeural"],
            male: ["zh-CN-YunzeNeural", "zh-CN-YunyangNeural", "zh-CN-YunhaoNeural"]
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
        conf.maxid = localStorage.getItem("maxid") || 0;
        ui.onProjectChange(); // 并触发值改变事件
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
    }

};
