<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Moore's Materials Previewer</title>
    <style>
        img {
            width: 640px;
        }

        .id {
            display: block;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
        }

        .slide {
            display: inline-block;
            margin: 5px;
        }
    </style>
</head>

<body>
    <?php
    $book_cn = $_REQUEST['book_cn'];
    $ids = json_decode($_REQUEST['ids']);
    foreach ($ids as $id) {
        echo ('<span class="slide"><span class="id">' . $id . '</span><img src="media/' . $book_cn . '/slide/' . $id . '.text.png" /></span>');
    }
    ?>
</body>

</html>