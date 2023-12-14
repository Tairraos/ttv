let conf = {
    materials: {}, // 库里的语料都在此，对应屏幕上的表格
    info: {}, // 生成视频需要的信息在此
    tasks: [], // 任务就是生成视频顺序和素材
    dict: null, // 英文单词翻译用字典加载在此
    exported: false // 有没有导出过素材xlsx
};

// UI显示的字段名
conf.fieldList = ["id", "type", "group", "voice", "chinese", "english", "phonetic", "media_cn1", "media_cn2", "media_en1", "media_en2", "slide", "isready"];

// 导出素材规则
conf.exportList = [
    { field: "id", title: "id", width: 47 },
    { field: "type", title: "类型", width: 66 },
    { field: "group", title: "分组", width: 47 },
    { field: "voice", title: "音色", width: 66 },
    { field: "chinese", title: "中文", width: 266 },
    { field: "english", title: "英文", width: 266 },
    { field: "phonetic", title: "音标或拼音", width: 266 },
    { field: "media_cn1", title: "中文素材1", width: 120 },
    { field: "media_cn2", title: "中文素材2", width: 120 },
    { field: "media_en1", title: "英文素材1", width: 120 },
    { field: "media_en2", title: "英文素材2", width: 120 },
    { field: "slide", title: "幻灯片", width: 100 }
];

// 神经模型配置，使用util.getModel("chinese","child")获取
conf.voice = {
    chinese: {
        child: "Xiaoshuang",
        man: "Yunyang",
        woman: "Xiaoqiu",
        man2: "Yunxi",
        woman2: "Xiaoxuan",
        man3: "Yunye",
        woman3: "Xiaomo",
        elder: "Xiaorui"
    },
    english: {
        child: "Ana",
        man: "Guy",
        woman: "Aria",
        man2: "Jason",
        woman2: "Jenny",
        man3: "Tony",
        woman3: "Sara",
        elder: "Davis"
    }
};

// 配置语料播放的顺序规则
conf.rule = {};

// 配置课程，显示在左上角下拉框里。会被写入db的lesson字段，同样的lesson，语料的id会顺序编号
conf.lesson = {
    "Living Chinese": { cn: "日常汉语", en: "Living Chinese", abbr: "LC" },
    "Travel Chinese": { cn: "旅游汉语", en: "Travel Chinese", abbr: "TC" },
    "Business Chinese": { cn: "商务汉语", en: "Business Chinese", abbr: "BC" },
    "HSK Chinese": { cn: "HSK考试", en: "HSK Chinese", abbr: "HC" },
    "Live English": { cn: "日常英语", en: "Live English", abbr: "LE" },
    "Travel English": { cn: "旅游英语", en: "Travel English", abbr: "TE" },
    "Business English": { cn: "商务英语", en: "Business English", abbr: "BE" },
    "CET 4 English": { cn: "CET4考试", en: "CET 4 English", abbr: "C4" },
    "CET 6 English": { cn: "CET6考试", en: "CET 6 English", abbr: "C6" },
    "Postgraduate English": { cn: "考研英语", en: "Postgraduate English", abbr: "PE" }
};

conf.edit = {
    locker: false,
    dom: null,
    id: 0,
    language: ""
};
