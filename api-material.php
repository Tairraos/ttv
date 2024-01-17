<?php
// **********************************
// 储存数据的API，插入新记录或更新某条记录
// **********************************
// 插入：{ id: "99", lesson:"", type:"", group:"", chinese:"", english:"", phonetic:""  }
// 更新：{ id: "1,2,3", field: 'phonetic', value: '5.chinese.(920.33).mp4' }

$action = $_REQUEST['action'] ?? '';
$lessons = $_REQUEST['lesson'] ?? '';

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

if ($action == 'getall') {
    $results = $db->query("SELECT * FROM `material`");
    $materials = $results->fetchAll(PDO::FETCH_ASSOC);
    $results = $db->query("SELECT * FROM `lesson`");
    $lessons = $results->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['result' => 'success', 'data' => $materials, 'lesson' => $lessons], JSON_UNESCAPED_UNICODE);


} else if ($action == 'getlesson') {
    $results = $db->query("SELECT DISTINCT `material`.`lesson`, `lesson`.* FROM `material` JOIN `lesson` ON `material`.`lesson` = `lesson`.`lesson`");
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['result' => 'success', 'data' => $rows], JSON_UNESCAPED_UNICODE);


} else if ($action == "delete") {
    delLeson('material', $lessons);
    echo json_encode(['result' => 'success']);


} else if ($action == 'update') { // 传入修改
    $id = +$_REQUEST['id'];
    $sid = +($_REQUEST['sid'] ?? 0);
    $field = $_REQUEST['field'];
    $toid = $_REQUEST['toid'] ?? $id;
    $value = $_REQUEST['value'] ?? '';
    $condition = 'WHERE id >=' . $id . ' AND id <= ' . $toid;
    $stmt = $db->prepare("UPDATE `material` SET `$field` = ? $condition");
    $stmt->bindParam(1, $value);
    $stmt->execute();
    echo json_encode(['result' => 'success']);


} else if ($action == 'insert') { // 插入
    $id = +$_REQUEST['id'];
    $sid = +($_REQUEST['sid'] ?? 0);
    $lessons = $_REQUEST['lesson'] ?? 'Living Chinese';
    $type = $_REQUEST['type'] ?? 'sentence';
    $group = $_REQUEST['group'] ?? '';
    $voice = $_REQUEST['voice'] ?? '';
    $chinese = $_REQUEST['chinese'] ?? '';
    $english = $_REQUEST['english'] ?? '';
    $phonetic = $_REQUEST['phonetic'] ?? '';
    $comment = $_REQUEST['comment'] ?? '';
    $theme = $_REQUEST['theme'] ?? '';
    $stmt = $db->prepare("INSERT INTO `material` (`id`, `sid`, `lesson`, `type`, `group`, `voice`,`chinese`, `english`, `phonetic`, `comment`, `theme`) VALUES ($id, $sid, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bindParam(1, $lessons);
    $stmt->bindParam(2, $type);
    $stmt->bindParam(3, $group);
    $stmt->bindParam(4, $voice);
    $stmt->bindParam(5, $chinese);
    $stmt->bindParam(6, $english);
    $stmt->bindParam(7, $phonetic);
    $stmt->bindParam(8, $comment);
    $stmt->bindParam(9, $theme);
    $stmt->execute();

    $results = $db->query("SELECT * FROM `material` WHERE id = $id");
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['result' => 'success', 'data' => $rows[0]], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['result' => 'failed', 'reason' => "未指定 action"], JSON_UNESCAPED_UNICODE);
}
$db = NULL;
