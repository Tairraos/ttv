/* global conf, util, lines */
let $media = document.querySelector("#media_table"),
    $slide = document.querySelector("#slide_table");

function file_exists(filename) {
    return conf.files.includes(filename);
}

function getCell(line, field, media) {
    let status = media === "theme" ? true : util.checkMediaStatus(line, field, media),
        filename = media === "theme" ? `${conf.info.theme}.png` : util.getMediaFilename(line.id, field, media),
        is_exist = file_exists(filename),
        mediaString;
    if (media.match(/audio/)) {
        mediaString = `<audio controls src="media/material/audio/${filename}"></audio>`;
    } else if (media.match(/video/)) {
        mediaString = `<video controls src="media/material/video/${filename}"></video>`;
    } else if (media.match(/slide/)) {
        mediaString = `<img src="media/material/slide/${filename}" />`;
    } else {
        mediaString = `<img src="media/material/${filename}" />`;
    }
    return [
        `<td class="media">`,
        is_exist ? mediaString : status ? `<span class="error">缺少必要素材</span>` : `<span class="pass">不需要</span>`,
        `<div class="filename ${is_exist ? "" : status ? "error" : "pass"}">${filename}</div>`,
        "</td>"
    ].join("");
}

for (let line of lines) {
    $media.innerHTML += `<tr><td colspan="4" class="label">id: ${line[`id`]}, 类型: 语音, 中文: [ ${line[`chinese`]} ], 英文: [ ${line[`english`]} ]</td></tr><tr>`;
    $media.innerHTML += `<tr>${["media_cn1", "media_cn2", "media_en1", "media_en2"].map((field) => getCell(line, field, "audio")).join("")}</tr>`;
    $media.innerHTML += `<tr><td colspan="4" class="label">id: ${line[`id`]}, 类型: 字幕视频, 中文: [ ${line[`chinese`]} ], 英文: [ ${line[`english`]} ]</td></tr><tr>`;
    $media.innerHTML += `<tr>${["media_cn1", "media_cn2", "media_en1", "media_en2"].map((field) => getCell(line, field, "video-text")).join("")}</tr>`;
    $media.innerHTML += `<tr><td colspan="4" class="label">id: ${line[`id`]}, 类型: 听力视频, 中文: [ ${line[`chinese`]} ], 英文: [ ${line[`english`]} ]</td></tr><tr>`;
    $media.innerHTML += `<tr>${["media_cn1", "media_cn2", "media_en1", "media_en2"].map((field) => getCell(line, field, "video-listen")).join("")}</tr>`;
}

$slide.innerHTML += `<tr>${["theme", "slide-text", "slide-listen", "video-ding"].map((media) => getCell(lines[0], "slide", media)).join("")}</tr>`;
