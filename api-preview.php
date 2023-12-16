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
    ?>
    <div id="title">Materials Preview</div>
    <table id="material">
    <tr><th>id</th><th>lesson</th><th>type</th><th>voice</th><th>chinese</th><th>english</th><th>phonetic</th></tr>
    <?php
    foreach ($rows as $row) {
        echo '<tr><td>' . $row['id'] . '</td><td>'.$row['lesson'].'</td><td>'.$row['type'].'</td><td>'.$row['voice'].'</td><td>'.$row['chinese'].'</td><td>'.$row['english'].'</td><td class="phonetic">'.$row['phonetic'].'</td></tr>';
    }
    ?>
    </table>
    <table id="material">
    <tr><th>id</th><th>type</th><th>media_cn1</th><th>media_cn2</th><th>media_en1</th><th>media_en2</th></tr>
    <?php
    foreach ($rows as $row) {
        echo '<tr><td>' . $row['id'] . '</td><td>audio</td>';
        echo '<td>'.(file_exists('media/material/audio/' . $row['id'] . '.media_cn1.m4a')?'<audio controls src="media/material/audio/' . $row['id'] . '.media_cn1.m4a">':'<span class="error">'.$row['id'].'.media_cn1.m4a 未生成').'</td>';
        if ($row['voice'] == '') {
            echo '<td>'.(file_exists('media/material/audio/' . $row['id'] . '.media_cn2.m4a')?'<audio controls src="media/material/audio/' . $row['id'] . '.media_cn2.m4a">':'<span class="error">'.$row['id'].'.media_cn2.m4a 未生成').'</td>';
        } else {
            echo '<td><span class="pass">不需要</span></td>';
        }
        echo '<td>'.(file_exists('media/material/audio/' . $row['id'] . '.media_en1.m4a')?'<audio controls src="media/material/audio/' . $row['id'] . '.media_en1.m4a">':'<span class="error">'.$row['id'].'.media_en1.m4a 未生成').'</td>';
        if ($row['voice'] == '') {
            echo '<td>'.(file_exists('media/material/audio/' . $row['id'] . '.media_en2.m4a')?'<audio controls src="media/material/audio/' . $row['id'] . '.media_en2.m4a">':'<span class="error">'.$row['id'].'.media_en2.m4a 未生成').'</td>';
        } else {
            echo '<td><span class="pass">不需要</span></td>';
        }
        echo '</tr>';
        echo '<tr><td>' . $row['id'] . '</td><td>video</td>';
        echo '<td>'.(file_exists('media/material/video/' . $row['id'] . '.media_cn1.mp4')?'<video controls src="media/material/video/' . $row['id'] . '.media_cn1.mp4">':'<span class="error">'.$row['id'].'.media_cn1.mp4 未生成').'</td>';
        if ($row['voice'] == '') {
            echo '<td>'.(file_exists('media/material/video/' . $row['id'] . '.media_cn2.mp4')?'<video controls src="media/material/video/' . $row['id'] . '.media_cn2.mp4">':'<span class="error">'.$row['id'].'.media_cn2.mp4 未生成').'</td>';
        } else {
            echo '<td><span class="pass">不需要</span></td>';
        }
        echo '<td>'.(file_exists('media/material/video/' . $row['id'] . '.media_en1.mp4')?'<video controls src="media/material/video/' . $row['id'] . '.media_en1.mp4">':'<span class="error">'.$row['id'].'.media_en1.mp4 未生成').'</td>';
        if ($row['voice'] == '') {
            echo '<td>'.(file_exists('media/material/video/' . $row['id'] . '.media_en2.mp4')?'<video controls src="media/material/video/' . $row['id'] . '.media_en2.mp4">':'<span class="error">'.$row['id'].'.media_en2.mp4 未生成').'</td>';
        } else {
            echo '<td><span class="pass">不需要</span></td>';
        }
        echo '</tr>';
    }
    ?>
    </table>
    <div id="slide">
        <div class="content"><?= file_exists('media/images/' . $theme . '.png') ? '<img src="media/images/' . $theme . '.png">' : '<span class="error">' . $theme . '.png 不存在</span>' ?></div>
        <div class="content"><?= file_exists('media/material/slide/' . $id . '.ding.png') ? '<img src="media/material/slide/' . $id . '.ding.png">' : '<span class="error">' . $id . '.ding.png 未生成</span>' ?></div>
        <div class="content"><?= file_exists('media/material/slide/' . $id . '.text.png') ? '<img src="media/material/slide/' . $id . '.text.png">' : '<span class="error">' . $id . '.text.png 未生成</span>' ?></div>
    </div>

</body>

</html>