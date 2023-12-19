let conf = {
    materials: {}, // 库里的语料都在此，对应屏幕上的表格
    dict: null, // 英文单词翻译用字典加载在此
    durations: {}, // 所有已经生成的视频素材，长度记录在此
    tasks: [], // 任务就是素材列表，素材可能会重复使用，读多遍
    files: [], // material目录下的素材文件列表
    maxid: 0
};

// 生成视频需要的信息在此
conf.info = {
    lesson: "",
    projectid: "",
    theme: ""
};

// 语料编辑工具，可以临时在页面中编辑语料（不会存入数据库），用以生成指定的语音内容
conf.editTool = {
    id: 0,
    dom: null,
    locker: false,
    language: ""
};

// UI显示的字段名
conf.uiFields = ["id", "type", "group", "voice", "chinese", "english", "phonetic", "media_cn1", "media_cn2", "media_en1", "media_en2", "slide", "check"];
// 实际导入导出需要的data字段
conf.dataFields = ["id", "type", "group", "voice", "chinese", "english", "phonetic"];
// 导出时标题栏对应的名字
conf.exportTitles = ["id", "类型", "分组", "音色", "中文", "英文", "音标或拼音"];
//导出时每列的宽度
conf.exportWidth = [47, 66, 47, 66, 266, 266, 266];

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
conf.rule = {
    // group, ding 合并，每一行的同字段优先，其余规则相同
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
    } // ,0表示无字幕朗读，1表示带字幕朗读，2表示带字幕解释含义
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
