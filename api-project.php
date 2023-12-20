<?php
// ************
// 工程表API
// ************
// 查询/新建/更新 工程记录：{projectid: "0001", lesson: "Living Chinese", duration: "300"}
// 如果archived为空，则删除所有同样前缀未完成的记录，并在数据表插入一条新记录，projectid顺延
// 否则更新duration
// 无论如何，stamp都会被更新成当前时间，精确到秒


header('Content-Type: application/json');
$projectid = $_REQUEST['projectid'] ?? '';
$lesson = $_REQUEST['lesson'] ?? 'Living Chinese';
$duration = $_REQUEST['duration'] ?? 0;
$theme = $_REQUEST['theme'] ?? "default";
$stamp = date('Y-m-d H:i:s');

if (!$projectid) {
    die(json_encode(['result' => 'faild', 'reason' => '未传入projectid'], JSON_UNESCAPED_UNICODE));
}

$db = new PDO('sqlite:ttv-data.db');
function create_project($lesson)
{
    global $db, $duration, $theme, $stamp;
    $projectid = getNewProjectid($lesson);
    $stmt = $db->prepare("INSERT INTO `project` (`projectid`, `lesson`, `theme`, `duration`, `stamp`) VALUES ('$projectid', '$lesson', '$theme', 0, '$stamp')");
    $stmt->execute();
    prepareBgImg($theme);
    prepareFolder();
    echoProject($projectid, $lesson);
}

function getNewProjectid($lesson)
{
    global $db;
    // 删除同样前缀的未完成记录
    $db->query("DELETE FROM `project` WHERE lesson = '$lesson' AND archived = '' AND duration = 0");
    // 找到合适的projectid
    $stmt = $db->query("SELECT IFNULL(MAX(projectid),0) AS maxid FROM project WHERE lesson = '$lesson'");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return $rows[0]['maxid'] + 1;
}

function updateProject($projectid, $lesson)
{
    global $db, $duration, $stamp;
    // 如果$lesson是null则不更新lesson字段
    $stmt = $db->prepare("UPDATE `project` SET `duration` = '$duration', `stamp` = '$stamp' WHERE projectid = $projectid AND lesson = '$lesson'");
    $stmt->execute();
    echoProject($projectid, $lesson);
}

function echoProject($projectid, $lesson)
{
    global $db;

    $stmt = $db->query("SELECT MAX(`maxid`) as `maxid` FROM ( " .
        "SELECT IFNULL(MAX(`id`), 0) AS `maxid` FROM `archive` WHERE `lesson` = '$lesson' " .
        "UNION ALL " .
        "SELECT IFNULL(MAX(`id`), 0) AS `maxid` FROM `material` WHERE `lesson` = '$lesson'" .
        ")");
    $maxid = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $db->query("SELECT * FROM `project` WHERE projectid = '$projectid' AND lesson = '$lesson'");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['result' => 'success', 'data' => $rows[0], 'maxid' => $maxid[0]['maxid']], JSON_UNESCAPED_UNICODE);
}

function prepareBgImg($theme)
{
    if (!file_exists("media/images/$theme.png")) {
        $files = glob("media/images/*.png");
        if ($files) {
            rename($files[0], "media/images/$theme.png");
        }
    }
}

function prepareFolder()
{
    //检查目录 media/material/audio 是否存在，不存在则创建
    if (!file_exists("media/material/audio")) {
        mkdir("media/material/audio");
    }
    if (!file_exists("media/material/video")) {
        mkdir("media/material/video");
    }
    if (!file_exists("media/material/slide")) {
        mkdir("media/material/slide");
    }
}

if ($duration == 0) {
    create_project($lesson);
} else {
    updateProject($projectid, $lesson);
}
$db = NULL;
?>