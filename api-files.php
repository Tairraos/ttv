<?php
// ************
// 检查文件是否存在
// ************

header('Content-Type: application/json');

if (!isset($_REQUEST['action'])) {
    die(json_encode(['result' => 'failed', 'reason' => "未传入 action 参数"], JSON_UNESCAPED_UNICODE));
}
if (!isset($_REQUEST['book_cn'])) {
    die(json_encode(['result' => 'failed', 'reason' => "未传入 book_cn 参数"], JSON_UNESCAPED_UNICODE));
}

$action = $_REQUEST['action'];
$book_cn = $_REQUEST['book_cn'];
$root = "media/" . $book_cn;

function getAllFilesRecursive($path) {
    if (!is_dir($path)) {
        return false;
    }

    $fileList = array();
    $data = scandir($path);
    foreach ($data as $value) {
        if ($value != '.' && $value != '..') {
            $subPath = $path . "/" . $value;
            if (is_dir($subPath)) {
                // 递归处理子目录
                $subFiles = getAllFilesRecursive($subPath);
                $fileList = array_merge($fileList, $subFiles);
            } else {
                // 添加文件到列表
                $fileList[] = $value;
            }
        }
    }

    return $fileList;
}

if ($action == "create") {
    foreach (["", "audio", "video", "slide", "cover", "theme", "dist", "courseware"] as $name) {
        $path = $root . "/" . $name;
        !file_exists($path) && mkdir($path);
    }


} else if ($action == "list") {
    $files = [];
    foreach (["", "audio", "video", "slide", "cover", "theme", "dist", "courseware"] as $name) {
        $path = $root . "/" . $name;
        !file_exists($path) && mkdir($path);
        $list = getAllFilesRecursive($path);
        $files[$name == '' ? "root" : $name] = $list;
    }

    $list = scandir($root);
    $list = array_values(array_filter($list, fn($item) => !is_dir($root . "/" . $item)));
    $files['root'] = $list;
    echo json_encode(['result' => 'success', 'files' => $files], JSON_UNESCAPED_UNICODE);


} else if ($action == "move") {
    $file = $_REQUEST['filename'];
    if (file_exists("D:/Downloads/" . $file)) {
        rename("D:/Downloads/" . $file, $root . "/" . $file);
        echo json_encode(['result' => 'success'], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['result' => 'failed', 'reason' => "文件不存在"], JSON_UNESCAPED_UNICODE);
    }


} else if ($action == "test") {
    $path = $root . "/dist";

//遍历$path下的所有文件，包括子目录
    $files = getAllFilesRecursive($path);
    echo json_encode(['result' => 'success', 'files' => $files], JSON_UNESCAPED_UNICODE);


} else {
    echo json_encode(['result' => 'failed', 'reason' => "传入了未知的 action"], JSON_UNESCAPED_UNICODE);
}
