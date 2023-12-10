@echo off

echo 工作目录已经准备中...

cd ..

if not exist "media" mkdir "media"
echo 媒体文件目录准备完成 media

cd media

if not exist "archive" mkdir "archive"
echo 存档目录准备完成 media\archive 存放用过的素材

if not exist "common" mkdir "common"
echo 公用文件目录准备完成 media\common 存放的是公用文件，ding 声音和片头

if not exist "common\ding.m4a" copy "..\work\ding.m4a" "common\ding.m4a"
if not exist "common\intro-cn.mp4" copy "..\work\intro-cn.mp4" "common\intro-cn.mp4"
if not exist "common\intro-en.mp4" copy "..\work\intro-en.mp4" "common\intro-en.mp4"
echo 公用文件已经准备好 media\dist\*.*

if not exist "dist" mkdir "dist"
echo 目标输出目录准备完成 media\dist 存放的是生成完成的 mp4 文件

if not exist "images" mkdir "images"
echo 图片目录准备完成 media\images 存放的未使用过的背景图片

if not exist "material" mkdir "material"
echo 素材目录准备完成 media\material 存放的是生成视频过程中产生的素材

cd material
if not exist "audio" mkdir "audio"
if not exist "video" mkdir "video"
if not exist "slide" mkdir "slide"

echo 所有目录准备完成

pause
