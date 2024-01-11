<?php
// ************
// 读取数据的API
// ************
// 如果带id参数 {id: 1}
// 如果id所在行，group为0，则返回指定id的行
// 如果id所在行，group不为0，则返回整个group

$id = $_REQUEST['id'] ?? 0;
$action = $_REQUEST['action'] ?? 'material';
$db = new PDO('sqlite:ttv-data.db');

// 如果被 require 用返回，程序会来读取 $rows
if (realpath(__FILE__) != realpath($_SERVER['SCRIPT_FILENAME'])) {
    $condition = $id ? " WHERE (`id` = $id AND `group` = 0) OR (`group` = (SELECT `group` FROM `material` WHERE `id` = $id AND `group` != 0))" : "";
    $results = $db->query("SELECT * FROM `material` $condition");
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);
} else {
    if ($action == 'material') {
        $condition = $id ? " WHERE (`id` = $id AND `group` = 0) OR (`group` = (SELECT `group` FROM `material` WHERE `id` = $id AND `group` != 0))" : "";
        $results = $db->query("SELECT * FROM `material` $condition");
    } else if ($action == 'lesson') {
        $results = $db->query("SELECT * FROM `lesson`");
    }
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);
    header('Content-Type: application/json');
    echo json_encode(['result' => 'success', 'data' => $rows], JSON_UNESCAPED_UNICODE);
}

$db = NULL;
?>