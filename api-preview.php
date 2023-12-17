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
    $theme = $_REQUEST['theme'] ?? '';
    require("api-data.php");

    function getAudioDom($filename)
    {
        return implode('', [
            '<td class="media">',
            file_exists($filename) ? '<audio controls src="' . $filename . '"></audio>' : '<span class="error">素材未生成</span>',
            '<div class="filename">' . $filename . '</div>',
            '</td>'
        ]);
    }
    function getVideoDom($filename)
    {
        return implode('', [
            '<td class="media">',
            file_exists($filename) ? '<video controls src="' . $filename . '" /></video>' : '<span class="error">素材未生成</span>',
            '<div class="filename">' . $filename . '</div>',
            '</td>'
        ]);
    }
    function getImageDom($filename)
    {
        return implode('', [
            '<td class="media">',
            file_exists($filename) ? '<img src="' . $filename . '" />' : '<span class="error">素材未生成</span>',
            '<div class="filename">' . $filename . '</div>',
            '</td>'
        ]);

    }
    ?>
    <div id="title">素材预览</div>
    <table id="material">
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
            echo '<tr><td>' . $row['id'] . '</td><td>' . $row['lesson'] . '</td><td>' . $row['type'] . '</td><td>' . $row['voice'] . '</td><td>' . $row['chinese'] . '</td><td>' . $row['english'] . '</td><td class="phonetic">' . $row['phonetic'] . '</td></tr>';
        }
        ?>
    </table>
    <table id="material">
        <tr>
            <th>中文素材1</th>
            <th>中文素材2</th>
            <th>英文素材1</th>
            <th>英文素材2</th>
        </tr>
        <?php
        foreach ($rows as $row) {
            echo '<tr><td colspan="4" class="label">id: ' . $row['id'] . ', 类型: 语音</td></tr><tr>';
            echo getAudioDom('media/material/audio/' . $row['id'] . '.cn1.m4a');
            echo ($row['voice'] == '') ? getAudioDom('media/material/audio/' . $row['id'] . '.cn2.m4a') : '<td><span class="pass">不需要</span></td>';
            echo getAudioDom('media/material/audio/' . $row['id'] . '.en1.m4a');
            echo ($row['voice'] == '') ? getAudioDom('media/material/audio/' . $row['id'] . '.en2.m4a') : '<td><span class="pass">不需要</span></td>';
            echo '</tr>';

            echo '<tr><td colspan="4" class="label">id: ' . $row['id'] . ', 类型: 字幕视频</td></tr><tr>';
            echo getVideoDom('media/material/video/' . $row['id'] . '.cn1.text.mp4');
            echo ($row['voice'] == '') ? getAudioDom('media/material/video/' . $row['id'] . '.cn2.text.mp4') : '<td><span class="pass">不需要</span></td>';
            echo getVideoDom('media/material/video/' . $row['id'] . '.en1.text.mp4');
            echo ($row['voice'] == '') ? getAudioDom('media/material/video/' . $row['id'] . '.en2.text.mp4') : '<td><span class="pass">不需要</span></td>';
            echo '</tr>';

            echo '<tr><td colspan="4" class="label">id: ' . $row['id'] . ', 类型: 听力视频</td></tr><tr>';
            echo getVideoDom('media/material/video/' . $row['id'] . '.cn1.listen.mp4');
            echo ($row['voice'] == '') ? getAudioDom('media/material/video/' . $row['id'] . '.cn2.listen.mp4') : '<td><span class="pass">不需要</span></td>';
            echo getVideoDom('media/material/video/' . $row['id'] . '.en1.listen.mp4');
            echo ($row['voice'] == '') ? getAudioDom('media/material/video/' . $row['id'] . '.en2.listen.mp4') : '<td><span class="pass">不需要</span></td>';
            echo '</tr>';

        }
        ?>
    </table>
    <table id="material">
        <tr>
            <th>背景图片</th>
            <th>字幕图片</th>
            <th>听力图片</th>
            <th>ding视频</th>
        </tr>
        <tr>
            <?= getImageDom('media/images/' . $theme . '.png') ?>
            <?= getImageDom('media/material/slide/' . $id . '.text.png') ?>
            <?= getImageDom('media/material/slide/' . $id . '.listen.png') ?>
            <?= getVideoDom('media/material/video/' . $row['id'] . '.ding.mp4'); ?>
        </tr>
    </table>

</body>

</html>