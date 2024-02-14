/**
 * 封装服务，把audio和png文件封装成视频
 * @param {*} args
 * @param {string} args.action      open
 * @param {string} args.book_cn
 *
 */

exports.osOperation = async function (args) {
    let thread = require("child_process"),
        // fs = require("fs"),
        // path = require("path"),
        base_path = process.cwd(),
        action = args.action,
        book_cn = args.book_cn;

    console.log(`OS接口调用参数: ${JSON.stringify(args)}`);

    if (action === "open") {
        thread.exec(`explorer "${base_path}\\media\\${book_cn}"`); // 打开目标文件夹
    }

    return { result: "success" };
};
