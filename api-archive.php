<?php
// ************
// 数据库存档
// ************

$lesson = $_REQUEST['lesson'] ?? '';
$action = $_REQUEST['action'];
$stamp = date('Y-m-d H:i:s');

$db = new PDO('sqlite:ttv-data.db');
header('Content-Type: application/json');

function isDirectoryEmpty($directory)
{
    $files = glob($directory . '/*');
    foreach ($files as $file) {
        if (is_file($file) || isDirectoryEmpty($file) === false) {
            return false;
        }
    }
    return true;
}

function deleteDirectory($directory)
{
    $files = glob($directory . '/*');
    foreach ($files as $file) {
        if (is_dir($file)) {
            deleteDirectory($file);
        } else {
            unlink($file);
        }
    }
    rmdir($directory);
}

if ($action == "archive") {
    // 插入数据到archive表
    $stmt = $db->prepare("INSERT INTO archive (`id`, `sid`, `lesson`, `type`, `group`, `voice`, `chinese`, `english`, `phonetic`, `comment`, `theme`) " .
        " SELECT `id`, `sid`, `lesson`, `type`, `group`, `voice`, `chinese`, `english`, `phonetic`, `comment`, `theme` FROM `material` WHERE `lesson` = ?");
    $stmt->bindParam(1, $lesson);
    $stmt->execute();

    // 删除material表中的数据
    $stmt = $db->prepare("DELETE FROM `material` WHERE `lesson` = ?");
    $stmt->bindParam(1, $lesson);
    $stmt->execute();

    // 把已经用过的目录移动到archive存档
    rename('media/material', 'media/archive/' . $lesson);

    // 创建新的空目录准备开始下一个工程
    mkdir('media/material');
    mkdir('media/material/audio');
    mkdir('media/material/video');
    mkdir('media/material/slide');

    echo json_encode(['result' => 'success'], JSON_UNESCAPED_UNICODE);


} else if ($action == "delete") {
        $stmt = $db->prepare("DELETE FROM `archive` WHERE `lesson` = ?");
        $stmt->bindParam(1, $lesson);
        $stmt->execute();
        echo json_encode(['result' => 'success'], JSON_UNESCAPED_UNICODE);
    
    
} else if ($action == "unarchive") {
    if (isDirectoryEmpty('media/material')) {

        $stmt = $db->prepare("INSERT INTO material (`id`, `sid`, `lesson`, `type`, `group`, `voice`, `chinese`, `english`, `phonetic`, `comment`, `theme`) " .
            " SELECT `id`, `sid`, `lesson`, `type`, `group`, `voice`, `chinese`, `english`, `phonetic`, `comment`, `theme` FROM archive WHERE `lesson` = ?");
        $stmt->bindParam(1, $lesson);
        $stmt->execute();

        echo json_encode(['result' => 'success'], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['result' => 'failed', 'reason' => 'material目录下有文件'], JSON_UNESCAPED_UNICODE);
    }


} else if ($action == "getlesson") {
    $results = $db->query("SELECT DISTINCT `archive`.`lesson`, `lesson`.* FROM `archive` JOIN `lesson` ON `archive`.`lesson` = `lesson`.`lesson`");
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['result' => 'success', 'data' => $rows], JSON_UNESCAPED_UNICODE);
}
$db = NULL;
?>