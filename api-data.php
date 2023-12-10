<?php
// ************
// 读取数据的API
// ************
// 不带任何参数会返回整个material表的数据
// 如果带id参数 {id: 1}
// 如果id所在行，group为0，则返回指定id的行
// 如果id所在行，group不为0，则返回整个group

$id = $_REQUEST['id'] ?? 0;
if ($id != 0) {
    $db = new PDO('sqlite:ttv-data.db');
    $condition = isset($_REQUEST['id']) ? " WHERE (`id` = $id AND `group` = 0) OR (`group` = (SELECT `group` FROM `material` WHERE `id` = $id AND `group` != 0))" : '';
    $results = $db->query("SELECT * FROM `material` $condition");
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);

    // 如果是直接访问api就输出结果，如果是其它 php require 则不用返回，程序会来读取 $rows
    if (realpath(__FILE__) == realpath($_SERVER['SCRIPT_FILENAME'])) {
        header('Content-Type: application/json');
        echo json_encode(['result' => 'success', 'data' => $rows], JSON_UNESCAPED_UNICODE);
    }
    $db = NULL;
}
?>
