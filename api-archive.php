<?php
// ************
// 数据库存档
// ************
// projectid关联到project表

$projectid = $_REQUEST['projectid'];
$lesson = $_REQUEST['lesson'];
$theme = $_REQUEST['theme'];
$stamp = date('Y-m-d H:i:s');

rename('media/images/' . $theme . '.png', 'media/archive/' . $theme . '.png');

$db = new PDO('sqlite:ttv-data.db');

// 插入数据到archive表
$stmt = $db->prepare("INSERT INTO archive (`id`, `lesson`, `type`, `group`, `chinese`, `english`, `phonetic`, `projectid`) SELECT `id`, `lesson`, `type`, `group`, `chinese`, `english`, `phonetic`, '$projectid' AS projectid FROM material");
$stmt->execute();


// 更新project表
$stmt = $db->prepare("UPDATE `project` SET `archived` = 'yes', `stamp` = '$stamp' WHERE projectid = $projectid AND lesson = '$lesson'");
$stmt->execute();

// 删除material表中的数据
$db->exec("DELETE FROM material;");

header('Content-Type: application/json');
echo json_encode(['result' => 'success'], JSON_UNESCAPED_UNICODE);

$db = NULL;
?>