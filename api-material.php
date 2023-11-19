<?php
// **********************************
// 储存数据的API，插入新记录或更新某条记录
// **********************************
// 插入：{ id: "99", value: "type|group|chinese|english }
// 更新：{ id: "1,2,3", field: 'phonetic', value: '5.chinese.(920.33).mp4' }

$field = $_REQUEST['field'] ?? '';

header('Content-Type: application/json');
if (!isset($_REQUEST['id'])) {
    die(json_encode(['result' => 'failed', 'reason' => '缺少参数'], JSON_UNESCAPED_UNICODE));
}

$db = new PDO('sqlite:ttv-data.db');

if ($field) { // 传入修改
    $ids = array_map(fn($item) => '`id`=' . $item, explode(',', $_REQUEST['id']));
    $value = $_REQUEST['value'] ?? '';
    $condition = 'WHERE ' . implode(' OR ', $ids);

    $stmt = $db->prepare("UPDATE `material` SET `$field` = ? $condition");
    $stmt->bindParam(1, $value);
    $stmt->execute();

    echo json_encode(['result' => 'success'], JSON_UNESCAPED_UNICODE);
} else { // 插入
    $id = +$_REQUEST['id'];
    $type = $_REQUEST['type'];
    $group = $_REQUEST['group'];
    $chinese = $_REQUEST['chinese'];
    $english = $_REQUEST['english'];
    $stmt = $db->prepare("INSERT INTO `material` (`id`, `type`, `group`, `chinese`, `english`) VALUES ($id, '$type', '$group', ?, ?)");
    $stmt->bindParam(1, $chinese);
    $stmt->bindParam(2, $english);
    $stmt->execute();

    $results = $db->query("SELECT * FROM `material` WHERE id = $id");
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['result' => 'success', 'data' => $rows[0]], JSON_UNESCAPED_UNICODE);
}
$db = NULL;
