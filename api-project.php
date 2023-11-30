<?php
// ************
// 工程表API
// ************
// 查询/新建/更新 工程记录：{projectid: "0001", lesson: "Living Chinese", duration: "300"}
// 如果duraion为0，则删除所有同样前缀未完成的记录，并在数据表插入一条新记录，projectid顺延
// 否则更新duration
// 无论如何，stamp都会被更新成当前时间，精确到秒


header('Content-Type: application/json');
$projectid = $_REQUEST['projectid'] ?? '';
$lesson = $_REQUEST['lesson'] ?? 'Living Chinese';
$duration = $_REQUEST['duration'] ?? 0;
$stamp = date('Y-m-d H:i:s');

if (!$projectid) {
    die(json_encode(['result' => 'faild', 'reason' => '未传入projectid'], JSON_UNESCAPED_UNICODE));
}

$db = new PDO('sqlite:ttv-data.db');
function create_project($lesson)
{
    global $db, $duration, $stamp;
    $projectid = getNewProjectid($lesson);
    $theme = implode("", array_map(fn($c) => strtoupper($c[0]), explode(" ", $lesson))) . str_pad($projectid, 4, '0', STR_PAD_LEFT);
    $results = $db->query("INSERT INTO `project` (`projectid`, `lesson`, `theme`, `duration`, `stamp`) VALUES ('$projectid', '$lesson', '$theme', 0, '$stamp')");
    $results->fetchAll(PDO::FETCH_ASSOC);
    echoProject($projectid, $lesson);
}

function getNewProjectid($lesson)
{
    global $db;
        // 删除同样前缀的未完成记录
    $db->query("DELETE FROM `project` WHERE lesson = '$lesson' AND duration = 0");
    // 找到合适的projectid
    $results = $db->query("SELECT IFNULL(MAX(projectid),0) AS maxid FROM project WHERE lesson = '$lesson'");
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);
    return $rows[0]['maxid'] + 1;
}

function updateProject($projectid, $lesson)
{
    global $db, $duration, $stamp;
    // 如果$lesson是null则不更新lesson字段
    $results = $db->query("UPDATE `project` SET `duration` = '$duration', `stamp` = '$stamp' WHERE projectid = '$projectid' AND lesson = '$lesson'");
    $results->fetchAll(PDO::FETCH_ASSOC);
    echoProject($projectid, $lesson);
}


function echoProject($projectid, $lesson)
{
    global $db;

    $results = $db->query("SELECT MAX(`maxid`) as `maxid` FROM ( SELECT IFNULL(MAX(`id`), 0) AS `maxid` FROM `archive` WHERE `lesson` = '$lesson' UNION ALL SELECT IFNULL(MAX(`id`), 0) AS `maxid` FROM `material` WHERE `lesson` = '$lesson')");
    $maxid = $results->fetchAll(PDO::FETCH_ASSOC);

    $results = $db->query("SELECT * FROM `project` WHERE projectid = '$projectid' AND lesson = '$lesson'");
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['result' => 'success', 'data' => $rows[0], 'maxid' => $maxid[0]['maxid']], JSON_UNESCAPED_UNICODE);
}


if ($duration == 0) {
    create_project($lesson);
} else {
    updateProject($projectid, $lesson);
}
$db = NULL;
?>