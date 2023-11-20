<?php
// ************
// 数据库存档
// ************
// projectid关联到project表

$projectid = $_REQUEST['projectid'];

rename('media/images/' . $projectid . '.jpg', 'media/archive/' . $projectid . '.jpg');

$db = new PDO('sqlite:ttv-data.db');

// 插入数据到archive表
$stmt = $db->prepare("INSERT INTO archive (id, type, `group`, chinese, english, phonetic, projectid) SELECT id, type, `group`, chinese, english, phonetic, :projectid AS projectid FROM material;");
$stmt->bindParam(':projectid', $projectid);
$stmt->execute();

// 删除material表中的数据
$db->exec("DELETE FROM material;");

header('Content-Type: application/json');
echo json_encode(['result' => 'success'], JSON_UNESCAPED_UNICODE);

$db = NULL;
?>