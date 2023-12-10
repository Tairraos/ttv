<?php
// ************
// 数据库存档
// ************
// projectid关联到project表

$projectid = $_REQUEST['projectid'];
$lesson = $_REQUEST['lesson'];
$theme = $_REQUEST['theme'];
$stamp = date('Y-m-d H:i:s');

$db = new PDO('sqlite:ttv-data.db');

// 插入数据到archive表
$stmt = $db->prepare("INSERT INTO archive (`id`, `lesson`, `type`, `group`, `chinese`, `english`, `phonetic`, `projectid`) SELECT `id`, `lesson`, `type`, `group`, `chinese`, `english`, `phonetic`, '$projectid' AS projectid FROM material");
$stmt->execute();


// 更新project表
$stmt = $db->prepare("UPDATE `project` SET `archived` = 'yes', `stamp` = '$stamp' WHERE projectid = $projectid AND lesson = '$lesson'");
$stmt->execute();

// 删除material表中的数据
$db->exec("DELETE FROM material;");

// 把已经用过的目录移动到archive存档
rename('media/material', 'media/archive/' . $theme);

// 创建新的空目录准备开始下一个工程
mkdir('media/material');
mkdir('media/material/audio');
mkdir('media/material/video');
mkdir('media/material/slide');

// 把已经用过的图片移动到archive存档
rename('media/images/' . $theme . '.png', 'media/archive/' . $theme . '/' . $theme . '.png');


header('Content-Type: application/json');
echo json_encode(['result' => 'success'], JSON_UNESCAPED_UNICODE);

$db = NULL;
?>