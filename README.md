## 导入用语料文件说明
### 文件说明
- 使用txt纯文本制作导入文件
- 每个文件里的语料会被处理成一个视频
- 文件内包含 注释，指令，语料 和 无效内容 四种内容

### 注释和无效内容
- #开头的行是注释
- 空行和每行前后的空格是无效内容
- 不正确的指令 和 指令行后跟随的文字是无效内容
- 导入代码会忽略所有注释和无效内容

### 指令
- 用 ~ { } 开头的行表示指令
- ~sentence 声明接下去的内容为句子
- ~word     声明接下去的内容为词汇
- { 声明分组开始
- } 声明分组结束

### 语料
- 每一行可以同时提供 "中文|英文" 的内容
- 如果行内没有 "|" 存在，表示此行仅有中文
- 如果行使用 "|" 开头，表示此行仅有英文
- 数据行属性默认为 sentence，如果是词汇，在前一行使用 ~word

## 指令对视频的影响
- ~sentence
- 中文 显示盲听slide，女声中文，男声中文，显示字幕slide，女声读英文翻译，女声中文，男声中文
- 英文 显示盲听slide，女声英文，男声英文，显示字幕slide，女声读中文翻译，女声英文，男声英文
- ~word
- 中文 显示字幕slide，女声中文，男声中文，女声读英文翻译
- 英文 显示字幕slide，女声英文，男声英文
- 因为英文词汇的翻译会有很多词性，所以没有中文读音
- { } 
- 分组的内容会被渲染在同一个slide
- 分组里只能有sentence，所以开始一个分组会附带一个sentence指令
- 中文 显示字幕slide，以 女声中文，男声中文，女声读英文翻译 的顺序读完整屏
- 英文 显示字幕slide，以 女声英文，男声英文，女声读中文翻译 的顺序读完整屏

## 数据表结构
```
DROP TABLE IF EXISTS "project";
CREATE TABLE 'project' (
    'projectid'     INTEGER NOT NULL DEFAULT 0,
    'lesson'        TEXT NOT NULL DEFAULT '',
    'theme'         TEXT NOT NULL DEFAULT '',
    'duration'      REAL NOT NULL DEFAULT 0,
    'archived'      TEXT NOT NULL DEFAULT '',
    'stamp'         TEXT NOT NULL DEFAULT '',
    PRIMARY KEY ('projectid', 'lesson')
);

DROP TABLE IF EXISTS "material";
CREATE TABLE 'material' (
    'id'            INTEGER NOT NULL DEFAULT 0, 
    'lesson'        TEXT NOT NULL DEFAULT '',
    'type'          TEXT NOT NULL DEFAULT '',
    'group'         INTEGER NOT NULL DEFAULT 0,
    'chinese'       TEXT NOT NULL DEFAULT '',
    'english'       TEXT NOT NULL DEFAULT '', 
    'phonetic'      TEXT NOT NULL DEFAULT '', 
    'cn_male'       TEXT NOT NULL DEFAULT '', 
    'cn_female'     TEXT NOT NULL DEFAULT '', 
    'en_male'       TEXT NOT NULL DEFAULT '', 
    'en_female'     TEXT NOT NULL DEFAULT '', 
    'slide'         TEXT NOT NULL DEFAULT '', 
    'isready'       TEXT NOT NULL DEFAULT '',
    PRIMARY KEY ('id', 'lesson')
);

DROP TABLE IF EXISTS "archive";
CREATE TABLE 'archive' (
    'id'            INTEGER NOT NULL DEFAULT 0, 
    'lesson'        TEXT NOT NULL DEFAULT '',
    'type'          TEXT NOT NULL DEFAULT '',
    'group'         INTEGER NOT NULL DEFAULT 0,
    'chinese'       TEXT NOT NULL DEFAULT '',
    'english'       TEXT NOT NULL DEFAULT '', 
    'phonetic'      TEXT NOT NULL DEFAULT '', 
    'projectid'     TEXT NOT NULL DEFAULT '',
    PRIMARY KEY ('id', 'lesson')
);
```
### project设计
- 一条project记录，对应一次语料处理
- video在生成之后，表里会记录video duration
- 如果记录没有duration说明project未完成，有可能在进行中
- 生成的video为裸视频，需自己添加视频头尾

### material设计
- material表记录了视频制作的过程，语料导入该表进行处理
- 如果过程被打断，工具会从material表恢复出已经完成的步骤
- 每次导入语料，id会使用material和archive中，最大的id+1开始
- 视频生成完成后，内容会存档到archive表并清空material表
- 视频制作完成后，背景图片移入archive文件夹存档
- phonetic字段，chinese lesson下，为chinese字段翻译的拼音
- english lesson + sentence type, phonetic为空
- english lesson + word type, phonetic为词汇的音标
- english lesson + word type, chinese为词典翻译（非api）
- english lesson + word type, 没有cn_male.mp3 和 cn_female.mp3

### project设计
- theme 为 背景图片，lesson的缩写 + projectid = theme
- lesson 分 下面几种
- Living Chinese
- Travel Chinese
- Business Chinese
- HSK Chinese
- Live English
- Travel English
- Business English
- CET4 English
- CET6 English
- Postgraduate English

## 环境配置
- PHP.ini里，有可能被设置成production模式，确保 variables_order = "EGPCS"
- cmd用管理员启动，然后执行下面的命令存入 API KEY
- setx /m AZURE_SPEECH_KEY xxxxxx
- setx /m AZURE_SPEECH_REGION xxxxxx
- setx /m BAIDU_APP_ID xxxxxx
- setx /m BAIDU_SEC_KEY xxxxxx
- npm run server 把工具助手运行起来




CREATE TABLE 'test' (
    'id'        INTEGER NOT NULL DEFAULT 0,
    'projecttype'   TEXT NOT NULL DEFAULT 'lc',
    'type'      TEXT NOT NULL DEFAULT 'sentence',
    'group'     INTEGER NOT NULL DEFAULT 0,
    'chinese'   TEXT NOT NULL DEFAULT '',
    'english'   TEXT NOT NULL DEFAULT '', 
    'phonetic'  TEXT NOT NULL DEFAULT '', 
    'cn_male'   TEXT NOT NULL DEFAULT '', 
    'cn_female' TEXT NOT NULL DEFAULT '', 
    'en_male'   TEXT NOT NULL DEFAULT '', 
    'en_female' TEXT NOT NULL DEFAULT '', 
    'slide'     TEXT NOT NULL DEFAULT '', 
    'isready'   TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (id, projecttype)
);

