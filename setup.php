<?php
if (!file_exists('media')) {
    mkdir('media');
}
echo "媒体文件目录已创建 media<br>";

chdir('media');
if (!file_exists('archive')) {
    mkdir('archive');
}
echo "存档目录已创建 media/archive 存放用过的素材<br>";
if (!file_exists('common')) {
    mkdir('common');
}
echo "公用文件目录已创建 media/common 存放的是公用文件，ding 和片头<br>";
if (!file_exists('common/ding.m4a')) {
    copy('../work/ding.m4a', 'common/ding.m4a');
}
if (!file_exists('common/intro-cn.mp4')) {
    copy('../work/intro-cn.mp4', 'common/intro-cn.mp4');
}
if (!file_exists('common/intro-en.mp4')) {
    copy('../work/intro-en.mp4', 'common/intro-en.mp4');
}
echo "公用文件已经准备好 media/dist/*.*<br>";
if (!file_exists('dist')) {
    mkdir('dist');
}
echo "目标输出目录已创建 media/dist 存放的是生成完成的 mp4 文件<br>";
if (!file_exists('images')) {
    mkdir('images');
}
echo "图片目录已创建 media/images 存放的未使用过的背景图片<br>";
if (!file_exists('material')) {
    mkdir('material');
}
echo "素材目录已创建 media/material 存放的是生成视频过程中产生的素材<br>";

chdir('material');
if (!file_exists('audio')) {
    mkdir('audio');
}
if (!file_exists('video')) {
    mkdir('video');
}
if (!file_exists('slide')) {
    mkdir('slide');
}
echo "所有目录已创建<br>";
?>