<?php
// **********************************
// 储存数据的API，插入新记录或更新某条记录
// **********************************
// 插入：{ id: "99", lesson:"", type:"", group:"", chinese:"", english:"", phonetic:""  }
// 更新：{ id: "1,2,3", field: 'phonetic', value: '5.chinese.(920.33).mp4' }

$field = $_REQUEST['field'] ?? '';

header('Content-Type: application/json');
if (!isset($_REQUEST['id'])) {
    die(json_encode(['result' => 'failed', 'reason' => '缺少参数'], JSON_UNESCAPED_UNICODE));
}

$db = new PDO('sqlite:ttv-data.db');

if ($field) { // 传入修改
    $id = $_REQUEST['id'];
    $toid = $_REQUEST['toid'] ?? $id;
    $value = $_REQUEST['value'] ?? '';
    $condition = 'WHERE id >=' . $id . ' AND id <= ' . $toid;
    $stmt = $db->prepare("UPDATE `material` SET `$field` = ? $condition");
    $stmt->bindParam(1, $value);
    $stmt->execute();

    echo json_encode(['result' => 'success'], JSON_UNESCAPED_UNICODE);
} else { // 插入
    $id = +$_REQUEST['id'];
    $lesson = $_REQUEST['lesson'] ?? 'Living Chinese';
    $type = $_REQUEST['type'] ?? 'sentence';
    $group = $_REQUEST['group'] ?? '';
    $voice = $_REQUEST['voice'] ?? '';
    $chinese = $_REQUEST['chinese'] ?? '';
    $english = $_REQUEST['english'] ?? '';
    $phonetic = $_REQUEST['phonetic'] ?? '';
    $comment = $_REQUEST['comment'] ?? '';
    $theme = $_REQUEST['theme'] ?? '';
    $stmt = $db->prepare("INSERT INTO `material` (`id`, `lesson`, `type`, `group`, `voice`,`chinese`, `english`, `phonetic`, `comment`, `theme`) VALUES ($id, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bindParam(1, $lesson);
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
}
$db = NULL;
