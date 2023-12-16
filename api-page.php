<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Moore's Language</title>
    <link rel="stylesheet" href="lib/page.css">
    <style>
        .backimg {
            background-image: url('media/images/<?= $_REQUEST['theme'] ?? 'default' ?>.png');
            background-size: 100% 100%;
        }

        #watermark {
            position: absolute;
            height: 32px;
            opacity: 0.4;
            <?= in_array($_REQUEST['watermark'] ?? 0, [0, 1]) ? "top: 40px;" : "bottom: 40px;" ?>
            <?= in_array($_REQUEST['watermark'] ?? 0, [0, 2]) ? "left: 30px;" : "right: 30px;" ?>
        }
    </style>
</head>

<body>
    <div class="backimg"></div>
    <div class="container">
        <div class="subcontainer">
            <?php
            if (($_REQUEST['type'] ?? "") == "ding") {
                ?>
                <div class="listen-container">
                    <object type="image/svg+xml" data="lib/listen<?= $_REQUEST['svg'] ?? 0 ?>.svg"
                        class="listen-svg"></object>
                    <object type="image/svg+xml" data="lib/listen-text.svg" class="listen-svg"></object>
                </div>
                <?php
            } else if (!isset($_REQUEST['language'])) {
                echo '缺少参数 language';
            } else {
                $language = $_REQUEST['language'];
                require("api-data.php");
                //$rows的长度
                $vol = count($rows);
                foreach ($rows as $index => $row) {
                    $id = $row['id'];
                    $type = $row['type'];
                    $english = $row['english'];
                    $chinese = $row['chinese'];
                    $phonetic = $row['phonetic'];
                    $cnarr = preg_split('//u', $row['chinese'], -1, PREG_SPLIT_NO_EMPTY);
                    $pyarr = array_map(fn($item) => mb_ereg_replace('[，。？！]', ' ', $item), explode(' ', $row['phonetic']));

                    echo '<div class="subtitle vol-' . $vol . '">';
                    echo '<div class="subtitle-id">';
                    echo $id;
                    echo '</div>';
                    echo '<div class="text lesson-' . $language . ' type-' . $type . '">';
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

</html>