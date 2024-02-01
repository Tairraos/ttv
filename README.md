## 环境配置
### 1 虚拟机配置
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

### 2 环境变量
- cmd用管理员启动，然后执行下面的命令存入 API KEY
- `setx /m AZURE_SPEECH_KEY xxxxxx`
- `setx /m AZURE_SPEECH_REGION xxxxxx`
- `setx /m BAIDU_APP_ID xxxxxx`
- `setx /m BAIDU_SEC_KEY xxxxxx`
- azure API 用来生成 tts 语音，baidu api 用来翻译中英文

### 3 php配置
- PHP.ini里，有可能被设置成`production`模式，确保 `variables_order = "EGPCS"`, 否则不能读取环境变量

### 4 启动助手
- `npm run server` 把工具助手运行起来

### 5 使用~~~
- `https://ttv.localweb.com`

## 系统设计
- 先到管理工具里新建新书，并移动模板，把书本内容填入模板
- `导出数据`功能会将使用当前显示的所有的语料生成excel和课件
- 生成的dist video为裸视频，没有视频头，放在 dist 文件夹下
- dist mp4 可以用管理工具里的命令生成器添加视频头
- theme 为 背景图片，放在theme文件夹下
- `type`字段留空或填写`title`, `story`, `sentence`或`word`，也可以使用中文`标题`, `故事`, `句子`，`单词|词汇`
- `voice`字段留空或填写`child`, `man`, `woman`, `man2`, `woman2`, `man3`, `woman3`, `elder`
- `voice`有值的话，只会生成相应性别的语音, `voice`字段留空表示使用`woman`和`man`各生成一份语音
