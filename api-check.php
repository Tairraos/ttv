<?php
// ************
// 检查文件是否存在
// ************

$filename = $_REQUEST['filename'] ?? "";
$ext = substr($filename, -4);
$type = $ext == '.m4a' ? 'audio' : ($ext == '.mp4' ? 'video' : 'slide');
$path = 'media/material/' . $type . '/' . $filename;

header('Content-Type: application/json');

if ($filename == "") {
    echo json_encode(['result' => 'success', 'path' => $path, 'found' => "no"]);
} else {
    echo json_encode(['result' => 'success', 'path' => $path, 'found' => file_exists($path) ? "yes" : "no"]);
}

?>