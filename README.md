## 环境配置
### 1 数据表结构
照下列结构创建 `sqlite` 数据库 `ttv-data.db`
```
DROP TABLE IF EXISTS 'project';
CREATE TABLE 'project' (
    'projectid'     INTEGER NOT NULL DEFAULT 0,
    'lesson'        TEXT NOT NULL DEFAULT '',
    'lesson_cn'     TEXT NOT NULL DEFAULT '',
    'program'       TEXT NOT NULL DEFAULT '',
    'startid'       INTEGER NOT NULL DEFAULT 0, 
    'endid'         INTEGER NOT NULL DEFAULT 0, 
    'duration'      TEXT NOT NULL DEFAULT '',
    'dist'          TEXT NOT NULL DEFAULT '',
    'stamp'         TEXT NOT NULL DEFAULT '',
    PRIMARY KEY ('projectid', 'lesson')
);

DROP TABLE IF EXISTS 'material';
CREATE TABLE 'material' (
    'id'            INTEGER NOT NULL DEFAULT 0, 
    'sid'           INTEGER NOT NULL DEFAULT 0, 
    'lesson'        TEXT NOT NULL DEFAULT '',
    'type'          TEXT NOT NULL DEFAULT '',
    'group'         INTEGER NOT NULL DEFAULT 0,
    'voice'         TEXT NOT NULL DEFAULT '',
    'chinese'       TEXT NOT NULL DEFAULT '',
    'english'       TEXT NOT NULL DEFAULT '', 
    'phonetic'      TEXT NOT NULL DEFAULT '', 
    'comment'       TEXT NOT NULL DEFAULT '', 
    'theme'         TEXT NOT NULL DEFAULT '', 
    PRIMARY KEY ('id', 'lesson')
);

DROP TABLE IF EXISTS 'lesson';
CREATE TABLE 'lesson' (
    'lesson'       TEXT NOT NULL DEFAULT '',
    'lesson_cn'    TEXT NOT NULL DEFAULT '',
    'abbr'         TEXT NOT NULL DEFAULT '',
    PRIMARY KEY ('lesson')
);

DROP TABLE IF EXISTS 'archive';
CREATE TABLE 'archive' (
    'id'            INTEGER NOT NULL DEFAULT 0, 
    'sid'           INTEGER NOT NULL DEFAULT 0, 
    'lesson'        TEXT NOT NULL DEFAULT '',
    'type'          TEXT NOT NULL DEFAULT '',
    'group'         INTEGER NOT NULL DEFAULT 0,
    'voice'         TEXT NOT NULL DEFAULT '',
    'chinese'       TEXT NOT NULL DEFAULT '',
    'english'       TEXT NOT NULL DEFAULT '', 
    'phonetic'      TEXT NOT NULL DEFAULT '', 
    'comment'       TEXT NOT NULL DEFAULT '', 
    'theme'         TEXT NOT NULL DEFAULT '', 
    PRIMARY KEY ('id', 'lesson')
);

```

### 2 虚拟机配置
vhost文件里添加有ProxyPassMatch，完整的虚拟主机配置为：
```
<VirtualHost *:80>
    ServerAdmin webmaster@localweb.com
    DocumentRoot "D:/Workspace/ttv"
    ServerName ttv.localweb.com
    ErrorLog "D:/Apps/Xampp/apache/logs/ttv-error.log"
    CustomLog "D:/Apps/Xampp/apache/logs/ttv-access.log" common
</VirtualHost>
<VirtualHost *:443>
    DocumentRoot "D:/Workspace/ttv"
    ServerName ttv.localweb.com:443
    ServerAdmin webmaster@localweb.com
    ProxyPassMatch ^/api/(.*)$ http://ttv.localweb.com:3000/$1
    SSLEngine on
    SSLCertificateFile "D:/Apps/Xampp/apache/conf/server.crt"
    SSLCertificateKeyFile "D:/Apps/Xampp/apache/conf/server.key"
    ErrorLog "D:/Apps/Xampp/apache/logs/ttv-error.ssl.log"
    CustomLog "D:/Apps/Xampp/apache/logs/ttv-access.ssl.log" common
</VirtualHost>                       
<Directory "D:/Workspace/ttv">
    Options FollowSymLinks Multiviews Indexes
    MultiviewsMatch Any
    AllowOverride All
    Require all granted
</Directory>
```
确认`httpd.conf`文件里`proxy`模块的loader前面没有被注释

### 3 环境变量
- cmd用管理员启动，然后执行下面的命令存入 API KEY
- `setx /m AZURE_SPEECH_KEY xxxxxx`
- `setx /m AZURE_SPEECH_REGION xxxxxx`
- `setx /m BAIDU_APP_ID xxxxxx`
- `setx /m BAIDU_SEC_KEY xxxxxx`
- azure API 用来生成 tts 语音，baidu api 用来翻译中英文

### 4 php配置
- PHP.ini里，有可能被设置成`production`模式，确保 `variables_order = "EGPCS"`, 否则不能读取环境变量

### 5 准备目录
- 执行 `https://ttv.localweb.com/setup.php` 初始化目录

### 6 启动助手
- `npm run server` 把工具助手运行起来

### 7 使用~~~
- `https://ttv.localweb.com`

## 系统设计
- 一条project记录，对应一个视频
- 视频生成后才会记录project内容
- 每种不同的类型的 lesson 语料，会使用从1开始的id编号
- 可以一次性导入一本书的素材，分批生成多个视频
- `导出数据`功能会将使用当前显示的所有的语料生成excel和课件
- 生成的video为裸视频，需自己添加视频头尾
- theme 为 背景图片，lesson 的缩写 + projectid = theme name
- lesson 在 lib/tool-util.js里增删改
- 使用excel制作导入文件，通过工具下载空模板，然后填充内容生成xlsx文件
- `type`字段留空或填写`title`, `story`, `sentence`或`word`，也可以使用中文`故事`, `句子`，`单词`，`词汇`，`词组`
- `voice`字段留空或填写`child`, `man`, `woman`, `man2`, `woman2`, `man3`, `woman3`, `elder`
- `voice`有值的话，只会生成相应性别的语音, `voice`字段留空表示使用`woman`和`man`各生成一份语音
- 导入语料的工程如果要更改`lesson`只能清空material表然后重来
- 点击`type`会预览当前数据行的原始`slide`，可以用于调试
- 点击`check`会显示`preview.php`,显示该行或该`group`所有的必要语料，用于调试
