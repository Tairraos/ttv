<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Moore's Language</title>
    <link rel="stylesheet" href="lib/page.css">
    <?php
    $book_cn = $_REQUEST['book_cn'];
    $rows = json_decode($_REQUEST['rows'], JSON_UNESCAPED_UNICODE);
    $style = $_REQUEST['style'] ?? "";
    $language = $_REQUEST['language'] ?? "";
    ?>
    <script>
        let style = "<?= $style ?>",
            language = "<?= $language ?>",
            vol = <?= count($rows) ?>;
    </script>
    <style>
        .backimg {
            background-image: url('media/<?= $book_cn ?>/theme/<?= $rows[0]['theme'] ?? 'default' ?>.png');
            background-size: 100% 100%;
        }

        #watermark {
            position: absolute;
            height: 32px;
            opacity: 0.4;
            <?= in_array($_REQUEST['watermark'] ?? 0, [0, 1]) ? "top: 50px;" : "bottom: 50px;" ?>
            <?= in_array($_REQUEST['watermark'] ?? 0, [0, 2]) ? "left: 50px;" : "right: 50px;" ?>
        }
    </style>
</head>

<body>
    <div class="backimg"></div>
    <div class="container">
        <div class="subcontainer">
            <?php
            if ($style == "listen") {
                ?>
                <div class="listen-container">
                    <object type="image/svg+xml" data="lib/listen<?= $_REQUEST['svg'] ?? 0 ?>.svg"
                        class="listen-svg"></object>
                    <object type="image/svg+xml" data="lib/listen-text.svg" class="listen-svg"></object>
                </div>
                <?php
            } else if ($language == '') {
                echo '缺少参数 language';
            } else {
                $vol = count($rows); // 字幕行数
                foreach ($rows as $index => $row) {
                    $sid = $row['sid']; //真正的内容id，有些slide是标题，不算内容成份
                    $type = $row['type'];
                    $english = $row['english'];
                    $chinese = $row['chinese'];
                    $phonetic = $row['phonetic'];
                    $cnarr = preg_split('//u', $row['chinese'], -1, PREG_SPLIT_NO_EMPTY);
                    $pyarr = array_map(fn($item) => mb_ereg_replace('[、，。？！：.,:?!“”]', ' ', $item), explode(' ', $row['phonetic']));

                    echo '<div class="subtitle vol-' . $vol . '">';
                    echo '<div class="subtitle-id">' . ($sid == 0 ? '' : $sid) . '</div>';
                    echo '<div class="text book-' . $language . ' type-' . $type . '">';
                    if ($language == "chinese") {
                        echo '<div class="combined">';
                        foreach ($cnarr as $key => $value) {
                            echo '<span class="char"><ruby><rb class="cn">' . $value . '</rb><rt class="py">' . $pyarr[$key] . '</rt></ruby></span>';
                        }
                        echo '</div>';
                        echo '<div class="english">' . $english . '</div>';
                    } else if ($type == "sentence") {
                        echo '<div class="english">' . $english . '</div>';
                        echo '<div class="chinese">' . $chinese . '</div>';
                    } else if ($type == "word") {
                        echo '<div class="combined"><span class="en">' . $english . '</span><span class="phonetic">' . $phonetic . '</span></div>';
                        echo '<div class="chinese">' . $chinese . '</div>';
                    }
                    echo '</div>';
                    echo '</div>';
                }
            }
            ?>
        </div>
        <?php
        ?>
    </div>
    <img src="lib/watermark-<?= preg_match("/chinese/i", $_REQUEST['language']) ? 'chinese' : 'english' ?>.svg"
        id="watermark" />
</body>
<script>
    if (style !== "listen" && language === "chinese" && vol === 1) {
        let chars = document.querySelectorAll(".char"),
            leftRef = chars[0].offsetLeft,
            issueChars = Array.from(document.querySelectorAll(".char")).filter(line => line.offsetLeft === leftRef && line.innerText.match(/[，。！]/));
        if (issueChars.length) {
            Array.from(document.styleSheets).filter(line => String(line.href).match(/page\.css/)).forEach(
                sheets => Array.from(sheets.cssRules).filter(rule => String(rule.selectorText).match(/\.subtitle\.vol-\d \.book-chinese \.cn/))
                    .forEach(rule => rule.style["font-size"] = +rule.style["font-size"].replace(/px/, "") - 3 + "px")
            );
        }
    }
</script>

</html>