<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Moore's Materials Previewer</title>
    <style>
        .container {
            display: flex;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            flex-direction: row;
        }

        #idList {
            font-size: 16px;
            width: 120px;
        }

        #copys {
            display: flex;
            flex-direction: column;
        }

        #copys button {
            font-size: 16px;
            padding: 4px 20px;
            margin: 2px 10px;
        }

        #copys hr {
            height: 0;
            padding: 0;
            margin: 5px;
            border: 0 solid #fff;
        }
    </style>
</head>

<body>
    <h2>摩耳视频发布助手</h2>
    <div class="container">
        <select name="idList" id="idList" size="10"></select>
        <div id="copys">
            <button id="copyCourseWare">课件名称</button>
            <hr>
            <button id="copyListenTitle">听力标题</button>
            <button id="copyReadTitle">阅读标题</button>
            <hr>
            <button id="copyDescription">内容</button>
            <hr>
            <button id="copyListenThemename">听力图片</button>
            <button id="copyReadThemename">阅读图片</button>
        </div>
    </div>
</body>
<?php
echo "<script>";
$bookList = [1 => "HSK1 练习", 2 => "HSK2 练习", 3 => "HSK3 练习", 4 => "HSK4 练习", 5 => "HSK5 练习", 6 => "HSK6 练习"];
$ids = [];
foreach ($bookList as $index => $book) {
    $path = "media/" . $book . "/dist";
    $list = scandir($path);
    $list = array_values(array_filter($list, fn($item) => !is_dir($path . "/" . $item)));
    foreach ($list as $video) {
        if (strpos($video, "listen") !== false) {
            array_push($ids, $index . "-" . preg_replace("/HSK.*(\d{4}-\d{4})\.mp4/", "$1", $video));
        }
    }
}
echo "let ids = " . json_encode($ids) . ";";
echo "</script>";
?>
<script src="tool-publish.js"></script>

</html>