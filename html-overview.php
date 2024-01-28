<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Moore's Materials Previewer</title>
    <link rel="stylesheet" href="lib/preview.css">
</head>

<body>
    <?php
    $id = $_REQUEST['id'] ?? 0;
    require("api-data.php");
    $files = [];
    $theme = $rows[0]['theme'];
    function checkFile($path, $filename)
    {
        global $files;
        if (file_exists($path . $filename)) {
            $files[] = $filename;
        }
    }
    checkFile('media/material/', $theme . '.png');
    foreach ($rows as $row) {
        checkFile('media/material/audio/', $row['id'] . '.cn1.m4a');
        checkFile('media/material/video/', $row['id'] . '.cn1.listen.mp4');
        checkFile('media/material/video/', $row['id'] . '.cn1.text.mp4');
        checkFile('media/material/audio/', $row['id'] . '.cn2.m4a');
        checkFile('media/material/video/', $row['id'] . '.cn2.listen.mp4');
        checkFile('media/material/video/', $row['id'] . '.cn2.text.mp4');
        checkFile('media/material/audio/', $row['id'] . '.en1.m4a');
        checkFile('media/material/video/', $row['id'] . '.en1.listen.mp4');
        checkFile('media/material/video/', $row['id'] . '.en1.text.mp4');
        checkFile('media/material/audio/', $row['id'] . '.en2.m4a');
        checkFile('media/material/video/', $row['id'] . '.en2.listen.mp4');
        checkFile('media/material/video/', $row['id'] . '.en2.text.mp4');
        checkFile('media/material/slide/', $row['id'] . '.text.png');
        checkFile('media/material/slide/', $row['id'] . '.listen.png');
        checkFile('media/material/video/', $row['id'] . '.ding.mp4');
    }
    ?>
    <div id="title">素材预览</div>
    <table class="material" id="data">
        <tr>
            <th>id</th>
            <th>课程</th>
            <th>类型</th>
            <th>音色</th>
            <th>中文</th>
            <th>英文</th>
            <th>音标或拼音</th>
        </tr>
        <?php
        foreach ($rows as $row) {
            echo '<tr><td>' . $row['id'] . '</td><td>' . $row['book_en'] . '</td><td>' . $row['type'] . '</td><td>' . $row['voice'] . '</td><td>' . $row['chinese'] . '</td><td>' . $row['english'] . '</td><td class="phonetic">' . $row['phonetic'] . '</td></tr>';
        }
        ?>
    </table>
    <table class="material" id="slide_table">
        <tr>
            <th>背景图片</th>
            <th>字幕图片</th>
            <th>听力图片</th>
            <th>ding视频</th>
        </tr>
    </table>
    <table class="material" id="media_table">
        <tr>
            <th>中文素材1</th>
            <th>中文素材2</th>
            <th>英文素材1</th>
            <th>英文素材2</th>
        </tr>

    </table>
</body>
<script src="lib/tool-conf.js"></script>
<script>
    let lines = <?= json_encode($rows, JSON_UNESCAPED_UNICODE); ?>;
    conf.files = <?= json_encode($files, JSON_UNESCAPED_UNICODE); ?>;
    conf.info.language = lines[0].book_en ? "chinese" : "english";
    conf.rules = conf.programRules.listen;
    conf.info.dist = "<?= $theme ?>";
    conf.info.id = <?= $id ?>;
    conf.materials = {};
    for (let line of lines) {
        conf.materials[line.id] = line;
    }
</script>
<script src="lib/tool-util.js"></script>
<script src="lib/preview.js"></script>

</html>