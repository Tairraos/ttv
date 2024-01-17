<?php
// ************
// 工程表API
// ************
// 查询/新建 工程记录：{action: "create|getid", lesson: "Living Chinese", duration: "03:25.3"}


header('Content-Type: application/json');

$action = $_REQUEST['action'] ?? '';
$lessons = $_REQUEST['lesson'] ?? '';
$lesson_cn = $_REQUEST['lesson_cn'] ?? '';
$program = $_REQUEST['program'] ?? '';
$startid = $_REQUEST['startid'] ?? 0;
$endid = $_REQUEST['endid'] ?? 0;
$duration = $_REQUEST['duration'] ?? '';
$lesson_abbr = $_REQUEST['lesson_abbr'] ?? 'Default';
$stamp = date('Y-m-d H:i:s');

if (!$action || !$lessons) {
    die(json_encode(['result' => 'failed', 'reason' => '未传入action或lesson'], JSON_UNESCAPED_UNICODE));
}

$db = new PDO('sqlite:ttv-data.db');
function getNewProjectid($lesson)
{
    global $db;
    $stmt = $db->query("SELECT IFNULL(MAX(projectid),0) AS maxid FROM project WHERE lesson = '$lesson'");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return $rows[0]['maxid'] + 1;
}

function prepareFolder()
{
    //检查目录 media/material 是否存在，不存在则创建
    if (!file_exists("media/material")) {
        mkdir("media/material");
    }
    if (!file_exists("media/material/audio")) {
        mkdir("media/material/audio");
    }
    if (!file_exists("media/material/video")) {
        mkdir("media/material/video");
    }
    if (!file_exists("media/material/slide")) {
        mkdir("media/material/slide");
    }
    if (!file_exists("media/material/dist")) {
        mkdir("media/material/dist");
    }
}

$projectid = getNewProjectid($lessons);
$dist = $lesson_abbr . "-" . str_pad($projectid, 3, "0", STR_PAD_LEFT);

if ($action == "create") {
    $stmt = $db->prepare("INSERT INTO `project` (projectid, lesson, lesson_cn, program, startid, endid, duration, dist, stamp) " .
        "VALUES($projectid, '$lessons', '$lesson_cn', '$program', +$startid, +$endid, '$duration', '$dist', '$stamp')");
    $stmt->execute();
    echo json_encode(['result' => 'success']);
} else if ($action == "getid") {
    prepareFolder();
    $stmt = $db->query("SELECT MAX(`maxid`) as `maxid` FROM ( " .
        "SELECT IFNULL(MAX(`id`), 0) AS `maxid` FROM `archive` WHERE `lesson` = '$lessons' " .
        "UNION ALL " .
        "SELECT IFNULL(MAX(`id`), 0) AS `maxid` FROM `material` WHERE `lesson` = '$lessons'" .
        ")");
    $maxid = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['result' => 'success', 'projectid' => $projectid, 'maxid' => $maxid[0]['maxid']], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['result' => 'failed', 'reason' => "未指定 action"], JSON_UNESCAPED_UNICODE);
}
$db = NULL;
?>