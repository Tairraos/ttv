## 环境配置
- 第一次使用需确认环境配置如下
- PHP.ini里，有可能被设置成production模式，确保 variables_order = "EGPCS", 否则不能读取环境变量
- cmd用管理员启动，然后执行下面的命令存入 API KEY
- `setx /m AZURE_SPEECH_KEY xxxxxx`
- `setx /m AZURE_SPEECH_REGION xxxxxx`
- `setx /m BAIDU_APP_ID xxxxxx`
- `setx /m BAIDU_SEC_KEY xxxxxx`
- azure API 用来生成 tts 语音，baidu api 用来翻译中英文
- 执行 work 目录下的`初始化目录.bat`
- `npm run server` 把工具助手运行起来
- 照下列结构创建 `sqlite` 数据库 `ttv-data.db`

## 数据表结构
```
DROP TABLE IF EXISTS 'project';
CREATE TABLE 'project' (
    'projectid'     INTEGER NOT NULL DEFAULT 0,
    'lesson'        TEXT NOT NULL DEFAULT '',
    'theme'         TEXT NOT NULL DEFAULT '',
    'duration'      REAL NOT NULL DEFAULT 0,
    'archived'      TEXT NOT NULL DEFAULT '',
    'stamp'         TEXT NOT NULL DEFAULT '',
    PRIMARY KEY ('projectid', 'lesson')
);

DROP TABLE IF EXISTS 'material';
CREATE TABLE 'material' (
    'id'            INTEGER NOT NULL DEFAULT 0, 
    'lesson'        TEXT NOT NULL DEFAULT '',
    'type'          TEXT NOT NULL DEFAULT '',
    'group'         INTEGER NOT NULL DEFAULT 0,
    'voice'         TEXT NOT NULL DEFAULT '',
    'chinese'       TEXT NOT NULL DEFAULT '',
    'english'       TEXT NOT NULL DEFAULT '', 
    'phonetic'      TEXT NOT NULL DEFAULT '', 
    PRIMARY KEY ('id', 'lesson')
);

DROP TABLE IF EXISTS 'archive';
CREATE TABLE 'archive' (
    'id'            INTEGER NOT NULL DEFAULT 0, 
    'lesson'        TEXT NOT NULL DEFAULT '',
    'type'          TEXT NOT NULL DEFAULT '',
    'group'         INTEGER NOT NULL DEFAULT 0,
    'voice'         TEXT NOT NULL DEFAULT '',
    'chinese'       TEXT NOT NULL DEFAULT '',
    'english'       TEXT NOT NULL DEFAULT '', 
    'phonetic'      TEXT NOT NULL DEFAULT '', 
    'projectid'     TEXT NOT NULL DEFAULT '',
    PRIMARY KEY ('id', 'lesson')
);
```

## project设计
- 一条project记录，对应一次语料处理
- 同一种类型的 lesson 仅允许有一条 **进行中** 的工程记录
- 如果已导入语料暂时不想生成视频，可以使用步骤`x.导出素材`备份，需要的时候再导入制作
- duration = 0 或者 archived = '' 视为进行中的工程
- video 在生成之后，duration 字段会被填上 video 长度
- 如果记录被存档，project 的 archived 字段会成为 yes
- 如果导入的语料没有被制作视频，可以导出素材，然后存档
- 只要id在存档里就不会被新导入的内容占用
- 导入素材时，选择使用素材自带的id就可以把重用那些保留在存档表里的 id
- 从存档中生成课件的功能待制作
- 生成的video为裸视频，需自己添加视频头尾
- theme 为 背景图片，lesson 的缩写 + projectid = theme name
- lesson 在 lib/tool-util.js里增删改

## 导入用素材xlsx说明
- 使用excel制作导入文件
- 每个文件里的语料会被处理成一个视频
- 通过工具下载空模板，然后填充内容生成xlsx文件
- `type`字段留空或填写`story`, `sentence`或`word`，也可以使用中文`故事`, `句子`，`单词`，`词汇`，`词组`
- `type`字段留空表示`sentence`
- `voice`字段留空或填写`child`, `man`, `woman`, `man2`, `woman2`, `man3`, `woman3`, `elder`
- `voice`有值的话，只会生成相应性别的语音
- `voice`字段留空表示使用`man`和`woman`都生成音频
- 导入语料的工程如果要更改`lesson`只能清空material表然后重来
- 素材xlsx至少有1个sheet，`语料`
- 导出的素材文件会自动生成`语料`和`课件`sheet，可以用来导入


## material设计
- material表记录了视频制作的过程，语料导入该表进行处理
- 如果过程被打断，工具会从material表恢复出已经完成的步骤
- 每次导入语料，id会使用material和archive中，最大的id+1开始
- 视频制作完成后，使用存档功能，背景图片移入archive文件夹存档
- chinese lesson下，phonetic 为 chinese 字段的拼音
- english lesson 的句子类型, phonetic为空
- english lesson 的单词类型, phonetic为词汇的音标
- english lesson 的单词类型, chinese为词典翻译（非api）
- english lesson 的单词类型不会有中文语音

