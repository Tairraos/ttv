<?php
// ************
// 工程表API
// ************
// 查询/新建/更新 工程记录：{projectid: "dc0001", lesson: "chinese", duration: "300"}
// 如果projectid仅有前缀，删除所有同样前缀未完成的记录，并在数据表插入一条新记录，projectid顺延
// 如果projectid完整，表里 没有 同样id的记录，则添加记录，并返回整条记录
// 如果projectid完整，表里 有 同样id的记录，更新，并返回整条记录
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
    insertProject($projectid);
}

function queryProject($projectid)
{
    global $db;
    $results = $db->query("SELECT * FROM `project` WHERE projectid = '$projectid'");
    return $results->fetchAll(PDO::FETCH_ASSOC);

}

function insertProject($projectid)
{
    global $db, $lesson, $duration, $stamp;
    $lesson = $lesson == '' ? 'chinese' : $lesson;
    $results = $db->query("INSERT INTO `project` (`projectid`, `lesson`, `duration`, `stamp`) VALUES ('$projectid', '$lesson', '$duration', '$stamp')");
    $results->fetchAll(PDO::FETCH_ASSOC);
    echoProject($projectid);
}

function updateProject($projectid)
{
    global $db, $lesson, $duration, $stamp;
    // 如果$lesson是null则不更新lesson字段
    $lessonUpdate = $lesson == '' ? '' : "lesson = '$lesson', ";
    $results = $db->query("UPDATE `project` SET $lessonUpdate `duration` = '$duration', `stamp` = '$stamp' WHERE projectid = '$projectid'");
    $rows = $results->fetchAll(PDO::FETCH_ASSOC);
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

function echoProject($projectid)
{
    $rows = queryProject($projectid);
    echo json_encode(['result' => 'success', 'data' => $rows[0]], JSON_UNESCAPED_UNICODE);
}


if (strlen($projectid) != 6) {
    create_project($projectid); // 不是完整id，取前2位做前缀重新生成记录
} else {
    $rows = queryProject($projectid);
    if (empty($rows)) {
        create_project($projectid); // id不存在，取前两位做前缀重新生成记录
    } else {
        updateProject($projectid); // id存在，更新记录
    }
}
$db = NULL;
?>