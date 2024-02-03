let conf = {
    materials: {}, // 库里的语料都在此，对应屏幕上的表格
    dict: null, // 英文单词翻译用字典加载在此
    durations: {}, // 所有已经生成的视频素材，长度记录在此
    tasks: [], // 任务就是素材列表，素材可能会重复使用，读多遍
    files: {}, // material目录下的素材文件列表
    range: {} // 素材范围
};

// 生成视频需要的信息在此
conf.info = {
    book_cn: "", //中文名
    book_en: "", //英文名
    book_abbr: "", //缩写
    language: "", //课程语言
    version: "", //数据文件版本
    maxid: 0 //最大视频编号
};

//已经生成的video
conf.videos = [
    //[文件名, 类型, 起始课本ID, 结束课本ID, 视频长度, 生成时间]
];

// 语料编辑工具，可以临时在页面中编辑语料（不会存入数据库），用以生成指定的语音内容
conf.editTool = {
    id: 0,
    dom: null,
    locker: false
};

// 实际导入导出需要的data字段
conf.dataFields = ["id", "sid", "type", "group", "voice", "chinese", "english", "phonetic", "comment", "theme"];
// UI显示的字段名
conf.uiFields = conf.dataFields.concat(["media_cn1", "media_cn2", "media_en1", "media_en2", "slide", "action"]);
conf.sheet = {
    book: {
        name: ["ID", "显示ID", "类型", "分组", "音色", "中文", "英文", "音标或拼音", "角注", "背景图"],
        width: [50, 50, 70, 50, 70, 350, 350, 350, 150, 80],
        center: /^[ABCDEIJKL]\d+$/
    },
    info: {
        name: ["中文名", "英文名", "缩写码", "教学目标", "版本"],
        width: [250, 250, 80, 100, 80],
        center: /^[ABCDE]\d+$/
    },
    video: {
        name: ["文件名", "类型", "起始课本ID", "结束课本ID", "视频长度", "生成时间"],
        width: [120, 70, 70, 70, 70, 120],
        center: /^[ABCDEF]\d+$/
    }
};

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
        man: "Andrew",
        woman: "Emma",
        man2: "Brain",
        woman2: "Jane",
        man3: "Steffan",
        woman3: "Jenny",
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
            word: ["ding", "cn1.listen", "cn2.listen", "en1.text", "cn1.text", "cn2.text"]
        },
        english: {
            story: ["en1.text", "cn1.text"],
            title: ["en1.text", "cn1.text"],
            sentence: ["ding", "en1.listen", "en2.listen", "cn1.text", "en1.text", "en2.text"],
            word: ["en1.text", "cn1.text", "en2.text"]
        }
    },
    pure: {
        chinese: {
            story: ["cn1.text"],
            title: ["cn1.text"],
            sentence: ["cn1.text", "cn2.text"],
            word: ["cn1.text", "cn2.text"]
        },
        english: {
            story: ["en1.text"],
            title: ["en1.text"],
            sentence: ["en1.text", "en2.text"],
            word: ["en1.text", "en2.text"]
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

conf.program = { listen: "听力练习", read: "双语朗读", pure: "单语朗读" };
