<?php
// ************
// 检查文件是否存在
// ************

$filename = $_REQUEST['filename'] ?? '';

header('Content-Type: application/json');

//检查目录 media/material/audio 是否存在，不存在则创建
if (!file_exists("media/material/audio")) {
    mkdir("media/material/audio");
}
if (!file_exists("media/material/video")) {
    mkdir("media/material/video");
}
if (!file_exists("media/material/slide")) {
    mkdir("media/material/slide");
}

if ($filename != '') {
    $ext = substr($filename, -4);
    $type = $ext == '.m4a' ? 'audio' : ($ext == '.mp4' ? 'video' : 'slide');
    $path = 'media/material/' . $type . '/' . $filename;
    echo json_encode(['result' => 'success', 'path' => $path, 'found' => file_exists($path) ? 'yes' : 'no']);
} else {
    //返回 media/material/ 目录下的所有文件名列表
    $audio = scandir('media/material/audio/');
    $video = scandir('media/material/video/');
    $slide = scandir('media/material/slide/');
    $audio = array_values(array_filter($audio, fn($filename) => preg_match('/^\d/', $filename)));
    $video = array_values(array_filter($video, fn($filename) => preg_match('/^\d/', $filename)));
    $slide = array_values(array_filter($slide, fn($filename) => preg_match('/^\d/', $filename)));
    echo json_encode(['result' => 'success', 'files' => array_merge($audio, $video, $slide)]);
}

?>