<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Moore's Materials Previewer</title>
    <link rel="stylesheet" href="lib/overview.css">
</head>

<body>
    <?php
    $book_cn = $_REQUEST['book_cn'];
    $language = $_REQUEST['language'];
    $rows = json_decode($_REQUEST['rows'], JSON_UNESCAPED_UNICODE);
    $files = [];
    $theme = $rows[0]['theme'];
    function checkFile($path, $filename)
    {
        global $files;
        if (file_exists($path . $filename)) {
            $files[] = $filename;
        }
    }
    checkFile('media/' . $book_cn . '/theme/', $theme . '.png');
    foreach ($rows as $row) {
        checkFile('media/' . $book_cn . '/audio/', $row['id'] . '/' . $row['id'] . '.cn1.m4a');
        checkFile('media/' . $book_cn . '/video/', $row['id'] . '/' . $row['id'] . '.cn1.listen.mp4');
        checkFile('media/' . $book_cn . '/video/', $row['id'] . '/' . $row['id'] . '.cn1.text.mp4');
        checkFile('media/' . $book_cn . '/audio/', $row['id'] . '/' . $row['id'] . '.cn2.m4a');
        checkFile('media/' . $book_cn . '/video/', $row['id'] . '/' . $row['id'] . '.cn2.listen.mp4');
        checkFile('media/' . $book_cn . '/video/', $row['id'] . '/' . $row['id'] . '.cn2.text.mp4');
        checkFile('media/' . $book_cn . '/audio/', $row['id'] . '/' . $row['id'] . '.en1.m4a');
        checkFile('media/' . $book_cn . '/video/', $row['id'] . '/' . $row['id'] . '.en1.listen.mp4');
        checkFile('media/' . $book_cn . '/video/', $row['id'] . '/' . $row['id'] . '.en1.text.mp4');
        checkFile('media/' . $book_cn . '/audio/', $row['id'] . '/' . $row['id'] . '.en2.m4a');
        checkFile('media/' . $book_cn . '/video/', $row['id'] . '/' . $row['id'] . '.en2.listen.mp4');
        checkFile('media/' . $book_cn . '/video/', $row['id'] . '/' . $row['id'] . '.en2.text.mp4');
        checkFile('media/' . $book_cn . '/slide/', $row['id'] . '/' . $row['id'] . '.text.png');
        checkFile('media/' . $book_cn . '/slide/', $row['id'] . '/' . $row['id'] . '.listen.png');
        checkFile('media/' . $book_cn . '/video/', $row['id'] . '/' . $row['id'] . '.ding.mp4');
    }
    ?>
    <div id="title">素材预览</div>
    <table class="material" id="data">
        <tr>
            <th>id</th>
            <th>类型</th>
            <th>音色</th>
            <th>中文</th>
            <th>英文</th>
            <th>音标或拼音</th>
        </tr>
        <?php
        foreach ($rows as $row) {
            echo '<tr><td>' . $row['id'] . '</td><td>' . $row['type'] . '</td><td>' . $row['voice'] . '</td><td>' . $row['chinese'] . '</td><td>' . $row['english'] . '</td><td class="phonetic">' . $row['phonetic'] . '</td></tr>';
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
<script src="tool-conf.js"></script>
<script>
    let lines = <?= json_encode($rows, JSON_UNESCAPED_UNICODE); ?>,
        theme = "<?= $theme ?>";
    conf.files = <?= json_encode($files, JSON_UNESCAPED_UNICODE); ?>;
    conf.info.language = "<?= $language ?>";
    conf.info.book_cn = "<?= $book_cn ?>";
    conf.rules = setup.programRules.listen;
    conf.materials = {};
    for (let line of lines) {
        conf.materials[line.id] = line;
    }
</script>
<script src="tool-util.js"></script>
<script src="lib/overview.js"></script>

</html>