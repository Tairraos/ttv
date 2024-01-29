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


if ($action == "create") {
    foreach (["", "audio", "video", "slide", "book", "cover", "theme", "dist"] as $name) {
        $path = $root . "/" . $name;
        !file_exists($path) && mkdir($path);
    }


} else if ($action == "list") {
    $files = [];
    foreach (["", "audio", "video", "slide", "book", "cover", "theme", "dist"] as $name) {
        $path = $root . "/" . $name;
        !file_exists($path) && mkdir($path);
        $list = scandir($path);
        $list = array_values(array_filter($list, fn($item) => !is_dir($path . "/" . $item)));
        $files[$name == '' ? "root" : $name] = $list;
    }
    echo json_encode(['result' => 'success', 'files' => $files], JSON_UNESCAPED_UNICODE);

} else if ($action == "move") {
    $file = $_REQUEST['file'];
    if (file_exists("D:/Downloads/" . $file)) {
        rename("D:/Downloads/" . $file, $root . "/book/" . $file);
        echo json_encode(['result' => 'success'], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['result' => 'failed', 'reason' => "文件不存在"], JSON_UNESCAPED_UNICODE);
    }


} else {
    echo json_encode(['result' => 'failed', 'reason' => "传入了未知的 action"], JSON_UNESCAPED_UNICODE);
}
