let conf = {
    materials: {}, // 库里的语料都在此，对应屏幕上的表格
    info: {}, // 生成视频需要的信息在此
    tasks: [], // 任务就是生成视频顺序和素材
    dict: null, // 英文单词翻译用字典加载在此
    exported: false // 有没有导出过素材xlsx
};

conf.fieldList = ["id", "type", "group", "voice", "chinese", "english", "phonetic", "cn_male", "cn_female", "en_male", "en_female", "slide", "isready"]; // UI里的字段名
conf.fieldName = ["id", "类型", "分组", "音色", "中文", "英文", "音标或拼音", "中文男音", "中文女音", "英文男音", "英文女音", "幻灯片"]; // 导出excel的标题
conf.fieldWidth = [47, 66, 47, 66, 266, 266, 266, 80, 80, 80, 80, 80]; // 导出excel的列宽

conf.voice = {
    groupid: 0,
    cn_female: "zh-CN-XiaoqiuNeural",
    cn_male: "zh-CN-YunzeNeural",
    en_female: "en-US-MichelleNeural",
    en_male: "en-US-ChristopherNeural",
    cnlib: {
        female: ["zh-CN-Neural", "zh-CN-Neural", "zh-CN-Neural"],
        male: ["zh-CN-Neural", "zh-CN-Neural", "zh-CN-Neural"]
    },
    enlib: {
        female: ["en-US-MichelleNeural", "en-US-Neural", "en-US-Neural"],
        male: ["en-US-ChristopherNeural", "en-US-AndrewNeural", "en-US-BrianNeural", "en-US-SteffanNeural"]
    },
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
