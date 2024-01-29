<?php
// ************
// 读取数据的API,只能被其它.php require 
// ************
// 如果带id参数 {id: 1}
// 如果id所在行，group为0，则返回指定id的行
// 如果id所在行，group不为0，则返回整个group

$id = $_REQUEST['id'] ?? 0;
$db = new PDO('sqlite:ttv-data.db');
// 如果被 require 用返回，程序会来读取 $rows
$condition = $id ? " WHERE (`id` = $id AND `group` = 0) OR (`group` = (SELECT `group` FROM `material` WHERE `id` = $id AND `group` != 0))" : "";
$results = $db->query("SELECT * FROM `material` $condition");
$rows = $results->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_UNESCAPED_UNICODE);
$db = NULL;
