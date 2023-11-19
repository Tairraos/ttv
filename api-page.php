<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Moore's Language School</title>
    <link rel="stylesheet" href="lib/page.css">
    <style>
        .backimg {
            background-image: url('media/images/<?= $_REQUEST['theme'] ?? 'default' ?>.jpg');
            background-repeat: none;
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
                echo '<div class="subtitle">';
                echo '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 256 256"><path fill="currentColor" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm20 128a4.21 4.21 0 0 0 1.33-.22a8 8 0 0 1 5.34 15.08A20 20 0 0 1 128 148c0-8.85 4.77-15.23 9-20.87c3.77-5 7-9.38 7-15.13a16 16 0 0 0-32 0a8 8 0 0 1-16 0a32 32 0 0 1 64 0c0 11.07-5.66 18.63-10.2 24.71c-3.6 4.81-5.8 7.93-5.8 11.29a4 4 0 0 0 4 4Zm36-32a8 8 0 0 1-8-8a48 48 0 0 0-96 0c0 11.9 6.71 20.5 13.82 29.6c7 8.92 14.18 18.15 14.18 30.4a20 20 0 0 0 34 14.29a8 8 0 1 1 11.19 11.42A36 36 0 0 1 92 172c0-6.74-5-13.14-10.79-20.55C73.54 141.63 64 129.41 64 112a64 64 0 0 1 128 0a8 8 0 0 1-8 8Z"/></svg>';
                echo '</div>';
            } else {
                require("api-data.php");
                $lesson = $_REQUEST['lesson'];
                foreach ($rows as $index => $row) {
                    $id = $row['id'];
                    $type = $row['type'];
                    $english = $row['english'];
                    $chinese = $row['chinese'];
                    $phonetic = $row['phonetic'];
                    $cnarr = preg_split('//u', $row['chinese'], -1, PREG_SPLIT_NO_EMPTY);
                    $pyarr = array_map(fn($item) => mb_ereg_replace('[，。？！]', ' ', $item), explode(' ', $row['phonetic']));

                    echo '<div class="subtitle">';
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
                        if ($type != "practice") {
                            echo '<div class="english">' . $english . '</div>';
                        }
                    } else if ($type == "sentense") {
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
        <!-- <div class="channel-name">Moore's Language</div> -->
    </div>
</body>

</html>