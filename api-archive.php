<?php
// ************
// 数据库存档
// ************

$action = $_REQUEST['action'] ?? '';
$lessons = $_REQUEST['lesson'] ?? '';
$stamp = date('Y-m-d H:i:s');

header('Content-Type: application/json');
$db = new PDO('sqlite:ttv-data.db');

function delLeson($source, $lesson)
{
    global $db;

    $stmt = $db->prepare("DELETE FROM `recycle` WHERE `lesson` = ?");
    $stmt->bindParam(1, $lesson);
    $stmt->execute();

    $stmt = $db->prepare(
        "INSERT INTO recycle (`id`, `sid`, `lesson`, `type`, `group`, `voice`, `chinese`, `english`, `phonetic`, `comment`, `theme`) " .
        "SELECT `id`, `sid`, `lesson`, `type`, `group`, `voice`, `chinese`, `english`, `phonetic`, `comment`, `theme` FROM $source WHERE `lesson`= ?"
    );
    $stmt->bindParam(1, $lesson);
    $stmt->execute();

    $stmt = $db->prepare("DELETE FROM $source WHERE `lesson` = ?");
    $stmt->bindParam(1, $lesson);
    $stmt->execute();
}

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
    $stmt->bindParam(1, $lessons);
    $stmt->execute();

    // 删除material表中的数据
    delLeson('material', $lessons);

    // 把已经用过的目录移动到archive存档
    rename('media/material', 'media/archive/' . $lessons);

    // 创建新的空目录准备开始下一个工程
    mkdir('media/material');
    mkdir('media/material/audio');
    mkdir('media/material/video');
    mkdir('media/material/slide');
    echo json_encode(['result' => 'success']);


} else if ($action == "delete") {
    delLeson('archive', $lessons);
    echo json_encode(['result' => 'success']);


} else if ($action == "unarchive") {
    if (isDirectoryEmpty('media/material')) {

        $stmt = $db->prepare("INSERT INTO material (`id`, `sid`, `lesson`, `type`, `group`, `voice`, `chinese`, `english`, `phonetic`, `comment`, `theme`) " .
            " SELECT `id`, `sid`, `lesson`, `type`, `group`, `voice`, `chinese`, `english`, `phonetic`, `comment`, `theme` FROM archive WHERE `lesson` = ?");
        $stmt->bindParam(1, $lessons);
        $stmt->execute();

        delLeson('archive', $lessons);
        deleteDirectory('media/material');
        rename('media/archive/' . $lessons, 'media/material');

        echo json_encode(['result' => 'success']);

    } else {
        echo json_encode(['result' => 'failed', 'reason' => 'material 目录下有文件'], JSON_UNESCAPED_UNICODE);
    }


} else if ($action == "getlesson") {
    $results = $db->query("SELECT DISTINCT `archive`.`lesson`, `lesson`.* FROM `archive` JOIN `lesson` ON `archive`.`lesson` = `lesson`.`lesson`");
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['result' => 'success', 'data' => $rows], JSON_UNESCAPED_UNICODE);


} else {
    echo json_encode(['result' => 'failed', 'reason' => "未指定 action"], JSON_UNESCAPED_UNICODE);
}
$db = NULL;
