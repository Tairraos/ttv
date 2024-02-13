<?php
// ************
// 读取数据的API
// ************

header('Content-Type: application/json');
if (isset($_REQUEST['key'])) {
    $db = new PDO('sqlite:lib/sentence.db');
    $results = $db->query("SELECT sentence FROM dict WHERE sentence LIKE '%" . $_REQUEST['key'] . "%'");
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['result' => 'success', 'sentence' => array_map(fn($item) => $item['sentence'], $rows)], JSON_UNESCAPED_UNICODE);
} else {
    die(json_encode(['result' => 'failed', 'reason' => "未传入 key 参数"], JSON_UNESCAPED_UNICODE));
}
