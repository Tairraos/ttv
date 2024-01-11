<?php
// ************
// 数据库存档
// ************

$lesson = $_REQUEST['lesson'];
$action = $_REQUEST['action'];
$stamp = date('Y-m-d H:i:s');

$db = new PDO('sqlite:ttv-data.db');

if ($action == "archive") {
    // 插入数据到archive表
    $stmt = $db->prepare("INSERT INTO archive (`id`, `sid`, `lesson`, `type`, `group`, `voice`, `chinese`, `english`, `phonetic`, `comment`, `theme`) " .
        " SELECT `id`, `sid`, `lesson`, `type`, `group`, `voice`, `chinese`, `english`, `phonetic`, `comment`, `theme` FROM material");
    $stmt->execute();

    // 删除material表中的数据
    $db->exec("DELETE FROM material;");

    // 把已经用过的目录移动到archive存档
    rename('media/material', 'media/archive/' . $lesson);

    // 创建新的空目录准备开始下一个工程
    mkdir('media/material');
    mkdir('media/material/audio');
    mkdir('media/material/video');
    mkdir('media/material/slide');

    header('Content-Type: application/json');
    echo json_encode(['result' => 'success'], JSON_UNESCAPED_UNICODE);
}
$db = NULL;
?>