/**
 * 摩耳助手服务器util
 */
let fs = require("fs"),
    path = require("path"),
    thread = require("child_process"),
    base_path = process.cwd();

let util = {};

util.saveLog = async function (book_cn, text) {
    await fs.appendFileSync(path.join(base_path, `media/${book_cn}/process_log.txt`), `${new Date().toISOString()} - ${text}\n`, "utf8");
    return text;
};

util.nameParser = function (book_cn, filename) {
    let typecheck = filename.match(/\.(mp3|m4a|mp4|png)$/),
        idcheck = filename.match(/^(\d+)\./),
        types = { mp3: "audio", m4a: "audio", mp4: "video", png: "slide" },
        typefolder = typecheck ? `${types[typecheck[1]]}/` : "",
        idfolder = idcheck ? `${idcheck[1]}/` : "",
        folderpath = `media/${book_cn}/${typefolder}${idfolder}`,
        fullname = `media/${book_cn}/${typefolder}${idfolder}${filename}`,
        shortname = `${typefolder}${idfolder}${filename}`;
    return { folderpath, fullname, shortname };
};

util.getFullname = function (book_cn, filename) {
    let parsed = util.nameParser(book_cn, filename);
    fs.existsSync(parsed.folderpath) || fs.mkdirSync(parsed.folderpath);
    return parsed.fullname;
};

// 如果要cd到media目录里去操作的，就getShortname
util.getShortname = function (book_cn, filename) {
    let parsed = util.nameParser(book_cn, filename);
    fs.existsSync(parsed.folderpath) || fs.mkdirSync(parsed.folderpath);
    return parsed.shortname;
};

util.getDistname = function (filename) {
    return `dist/${filename}`;
};

util.execCommand = async function (book_cn, command) {
    await util.saveLog(book_cn, command);
    return await thread.execSync(command);
};

module.exports = util;
