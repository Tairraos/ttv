@echo off

cd ..
if not exist "media" mkdir "media"

cd media
if not exist "archive" mkdir "archive"
if not exist "common" mkdir "common"
if not exist "dist" mkdir "dist"
if not exist "images" mkdir "images"
if not exist "material" mkdir "material"
if not exist "video" mkdir "video"
if not exist "common\ding.mp3" copy "..\work\ding.mp3" "common\ding.mp3"
if not exist "common\intro-cn.mp4" copy "..\work\intro-cn.mp4" "common\intro-cn.mp4"
if not exist "common\intro-en.mp4" copy "..\work\intro-en.mp4" "common\intro-en.mp4"

echo 工作目录已经准备完成
echo -----------------------
echo 目录 media\dist 存放的是生成完成的 mp4 文件
echo 目录 media\images 存放的未使用过的背景图片
echo 目录 media\common 存放的是公用文件，ding.mp3 和片头 mp4
echo 目录 media\material 存放的是生成视频过程中产生的 mp3 和 slide
echo 目录 media\video 存放的是生成视频过程中产生的 mp4 片段
echo 目录 media\archive 存放的是已经用过的背景图片
echo -----------------------

pause
