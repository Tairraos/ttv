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
- ~sentense 声明接下去的内容为句子
- ~word     声明接下去的内容为词汇
- ~practice 声明接下去的内容为练习
- { 声明分组开始
- } 声明分组结束

### 语料
- 每一行可以同时提供 "中文|英文" 的内容
- 如果行内没有 "|" 存在，表示此行仅有中文
- 如果行使用 "|" 开头，表示此行仅有英文
- 数据行属性默认为 sentence，如果是词汇，在前一行使用 ~word

## 指令对视频的影响
- ~sentense
- 中文 显示盲听slide，女声中文，男声中文，显示字幕slide，女声读英文翻译，女声中文，男声中文
- 英文 显示盲听slide，女声英文，男声英文，显示字幕slide，女声读中文翻译，女声英文，男声英文
- ~word
- 中文 显示字幕slide，女声中文，男声中文，女声读英文翻译
- 英文 显示字幕slide，女声英文，男声英文
- 因为英文词汇的翻译会有很多词性，所以没有中文读音
- ~practice
- 中文 显示字幕slide，女声读英文说明，女声中文，男声中文
- 英文 显示字幕slide，女声读中文说明，女声英文，男声英文
- { } 
- 分组的内容会被渲染在同一个slide
- 中文 显示字幕slide，以 女声中文，男声中文，女声读英文翻译 的顺序读完整屏
- 英文 显示字幕slide，以 女声英文，男声英文，女声读中文翻译 的顺序读完整屏

## 数据表结构
```
CREATE TABLE 'project' (
    'projectid' TEXT PRIMARY KEY,
    'lesson'    TEXT NOT NULL DEFAULT 'chinese',
    'duration'  REAL NOT NULL DEFAULT 0,
    'stamp'     TEXT NOT NULL DEFAULT ''
);

CREATE TABLE 'material' (
    'id'        INTEGER PRIMARY KEY, 
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
    'isready'   TEXT NOT NULL DEFAULT ''
);


CREATE TABLE 'archive' (
    'id'        INTEGER PRIMARY KEY, 
    'type'      TEXT NOT NULL DEFAULT 'sentence',
    'chinese'   TEXT NOT NULL DEFAULT '',
    'english'   TEXT NOT NULL DEFAULT '', 
    'phonetic'  TEXT NOT NULL DEFAULT '', 
    'projectid' TEXT NOT NULL DEFAULT ''
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
- chinese lesson下，phonetic字段为chinese字段翻译的拼音
- english lesson下，sentense和practice对应的phonetic为空
- english lesson下，word对应的phonetic为词汇的音标

### projectid设计
- 视频名字和背景图片名字和同projectid
- project id 为 2字母前缀 + 四位顺序数字
- 前缀区分 考试，生活，旅游，商务 四类
- Business              - bc0001, be0001
- Travel                - tc0001, te0001
- living                - lc0001, le0001
- 考试类前缀使用各种考试名字缩写
- HSK Chinese           - hc0001
- CET4 English          - c40001
- CET6 English          - c60001
- Postgraduate English  - pe0001
