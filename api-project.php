<?php
// ************
// 工程表API
// ************
// 查询/新建/更新 工程记录：{projectid: "dc0001", lesson: "chinese", duration: "300"}
// 如果duraion为0，则删除所有同样前缀未完成的记录，并在数据表插入一条新记录，projectid顺延
// 否则更新duration
// 无论如何，stamp都会被更新成当前时间，精确到秒


header('Content-Type: application/json');
$projectid = $_REQUEST['projectid'] ?? '';
$lesson = $_REQUEST['lesson'] ?? '';
$duration = $_REQUEST['duration'] ?? 0;
$stamp = date('Y-m-d H:i:s');

if (!$projectid) {
    die(json_encode(['result' => 'faild', 'reason' => '未传入projectid'], JSON_UNESCAPED_UNICODE));
}

$db = new PDO('sqlite:ttv-data.db');
function create_project($projectid)
{
    global $db, $lesson, $duration, $stamp;
    $projectid = getNewProjectid($projectid);
    $lesson = $lesson == '' ? 'chinese' : $lesson;
    $results = $db->query("INSERT INTO `project` (`projectid`, `lesson`, `duration`, `stamp`) VALUES ('$projectid', '$lesson', 0, '$stamp')");
    $results->fetchAll(PDO::FETCH_ASSOC);
    echoProject($projectid);
}

function getNewProjectid($projectid)
{
    global $db;
    $projectid = substr($projectid, 0, 2);
    // 删除同样前缀的未完成记录
    $db->query("DELETE FROM `project` WHERE SUBSTR(projectid, 1, 2) = '$projectid' AND duration = 0");
    // 找到合适的projectid
    $results = $db->query("SELECT IFNULL(MAX(CAST(SUBSTR(projectid, 3) AS INTEGER)),0) AS maxid FROM project WHERE projectid LIKE '$projectid%'");
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);
    return $projectid . str_pad($rows[0]['maxid'] + 1, 4, '0', STR_PAD_LEFT);
}

function updateProject($projectid)
{
    global $db, $duration, $stamp;
    // 如果$lesson是null则不更新lesson字段
    $results = $db->query("UPDATE `project` SET `duration` = '$duration', `stamp` = '$stamp' WHERE projectid = '$projectid'");
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);
    echoProject($projectid);
}


function echoProject($projectid)
{
    global $db;
    $results = $db->query("SELECT * FROM `project` WHERE projectid = '$projectid'");
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['result' => 'success', 'data' => $rows[0]], JSON_UNESCAPED_UNICODE);
}


if ($duration == 0) {
    create_project($projectid); // 不是完整id，取前2位做前缀重新生成记录
} else {
    updateProject($projectid);
}
$db = NULL;
?>