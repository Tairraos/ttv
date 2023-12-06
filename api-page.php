<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Moore's Language School</title>
    <link rel="stylesheet" href="lib/page.css">
    <style>
        .backimg {
            background-image: url('media/images/<?= $_REQUEST['theme'] ?? 'default' ?>.png');
            background-size: 100% 100%;
        }
    </style>
</head>

<body>
    <div class="backimg"></div>
    <div class="container">
        <div class="subcontainer">
            <?php
            if (!isset($_REQUEST['lesson'])) {
                echo '缺少参数 lesson';
            } else if (!($_REQUEST['id'] ?? 0)) {
                mt_srand(round(microtime(true) * 1000000));
                ?>
                    <div class="listen-container">
                        <object type="image/svg+xml" data="lib/listen<?= rand(1, 100) % 4 + 1; ?>.svg"
                            class="listen-svg"></object>
                        <object type="image/svg+xml" data="lib/listen-text.svg" class="listen-svg"></object>
                    </div>
                <?php
            } else {
                require("api-data.php");
                $lesson = $_REQUEST['lesson'];
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
                    echo '<div class="text lesson-' . $lesson . ' type-' . $type . '">';
                    if ($lesson == "chinese") {
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
        /*<div class="channel-name">Moore's Language</div>*/
        ?>
    </div>
</body>

</html>