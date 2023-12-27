let conf = {
    materials: {}, // 库里的语料都在此，对应屏幕上的表格
    dict: null, // 英文单词翻译用字典加载在此
    durations: {}, // 所有已经生成的视频素材，长度记录在此
    tasks: [], // 任务就是素材列表，素材可能会重复使用，读多遍
    files: [], // material目录下的素材文件列表
    range: {}, // 素材范围
    maxid: 0
};

// 生成视频需要的信息在此
conf.info = {
    theme: "",
    lesson: "",
    projectid: "",
    language: ""
};

// 语料编辑工具，可以临时在页面中编辑语料（不会存入数据库），用以生成指定的语音内容
conf.editTool = {
    id: 0,
    dom: null,
    locker: false,
    language: ""
};

// UI显示的字段名
conf.uiFields = ["id", "sid", "type", "group", "voice", "chinese", "english", "phonetic", "comment", "theme", "media_cn1", "media_cn2", "media_en1", "media_en2", "slide", "action"];
// 实际导入导出需要的data字段
conf.dataFields = ["id", "sid", "type", "group", "voice", "chinese", "english", "phonetic", "comment", "theme"];
// 导出时标题栏对应的名字
conf.exportTitles = ["id", "sid", "类型", "分组", "音色", "中文", "英文", "音标或拼音", "注释", "主题"];
// 导出时每列的宽度
conf.exportWidth = [50, 50, 70, 50, 70, 350, 350, 350, 150, 80];
// 导出课件的style配置, 注意，需要使用全开源字体，不然不能发网上
conf.exportStyle = {
    chinese: [
        {}, // 空行
        { font: { name: "Mulish", sz: "12", bold: true } }, // 拼音
        { font: { name: "Noto Sans SC", sz: "15", bold: true } }, // 中文
        { font: { name: "Encode Sans Semi Expanded", sz: "11" } } // 英文
    ],
    english: [
        {},
        { font: { name: "Encode Sans Semi Expanded", sz: "12", bold: true } }, // id
        { font: { name: "Encode Sans Semi Expanded", sz: "12" } }, // 英文
        { font: { name: "Noto Sans SC", sz: "12" } } // 中文
    ]
};

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

// 视频风格，即语料播放的顺序规则
conf.programRules = {
    listen: {
        chinese: {
            story: ["cn1.text", "en1.text"],
            title: ["cn1.text", "en1.text"],
            sentence: ["ding", "cn1.listen", "cn2.listen", "en1.text", "cn1.text", "cn2.text"],
            word: ["cn1.text", "en1.text", "cn2.text"]
        },
        english: {
            story: ["en1.text", "cn1.text"],
            title: ["en1.text", "cn1.text"],
            sentence: ["ding", "en1.listen", "en2.listen", "cn1.text", "en1.text", "en2.text"],
            word: ["en1.text", "cn1.text", "en2.text"]
        }
    },
    read: {
        chinese: {
            story: ["cn1.text", "en1.text"],
            title: ["cn1.text", "en1.text"],
            sentence: ["cn1.text", "cn2.text", "en1.text"],
            word: ["cn1.text", "cn2.text", "en1.text"]
        },
        english: {
            story: ["en1.text", "cn1.text"],
            title: ["en1.text", "cn1.text"],
            sentence: ["en1.text", "en2.text", "cn1.text"],
            word: ["en1.text", "en2.text", "cn1.text"]
        }
    }
};

conf.program = {
    listen: { name: "听力练习", value: "listen" },
    read: { name: "双语朗读", value: "read" }
};

// 配置课程，显示在左上角下拉框里。会被写入db的lesson字段，同样的lesson，语料的id会顺序编号
conf.lesson = {
    "Daily Chinese 150": { cn: "日常汉语150句", en: "Daily Chinese 150", abbr: "DC150" },
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
