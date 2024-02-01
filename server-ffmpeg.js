/**
 * 封装服务，把audio和png文件封装成视频
 * @param {*} args
 * @param {string} args.action      <piece | video | duration> slide 转 video | video 合并 | media 时长
 * @param {string} args.book_cn     中文书名，也是目录名
 * @param {string} args.filename    保存的文件名
 * @param {string} args.slidename   slide 素材
 * @param {string} args.audioname   audio 素材
 * @param {string} args.videolist   要合并的 video 列表
 * @return {JSON}
 *
 * voice 参数可用值参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/language-support?tabs=tts
 * 如果要扩展其它 SSML 内容，express，role，rate，pitch 参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/speech-synthesis-markup-voice
 * 质量文档：https://learn.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/speechsynthesisoutputformat
 */

exports.videoGenerator = async function (args) {
    let fs = require("fs"),
        path = require("path"),
        thread = require("child_process"),
        base_path = process.cwd(),
        action = args.action,
        filename = args.filename;

    let saveLog = async function (text) {
        await fs.appendFileSync(path.join(base_path, `media/${args.book_cn}/process_log.txt`), `${new Date().toISOString()} - ${text}\n`, "utf8");
        return text;
    };

    let execCommand = async function (command) {
        await saveLog(command);
        return await thread.execSync(command);
    };

    console.log(`视频生成参数: ${JSON.stringify(args)}`);

    if (action === "piece") {
        /********************************/
        // 为每一组slide和audio生成一个video片段
        /********************************/
        let slidename = `slide/${args.slidename}`,
            audioname = args.audioname === "DING" ? "../common/ding.m4a" : `audio/${args.audioname}`;

        process.chdir(`media/${args.book_cn}`);
        await execCommand(
            [
                `ffmpeg -hwaccel cuda -loop 1 -i "${slidename}" -i "${audioname}"`,
                `-c:v h264_nvenc -pix_fmt yuv420p`, // 视频用x264编码，stillimage优化静态图像，象素格式yuv420p
                `-c:a copy`, // 音频直接复制，否则会有bug
                `-shortest -v quiet -y "video/${filename}` // 视频长度和audio一致，静默执行，覆盖目标文件
            ].join(" ")
        );

        let duration = await execCommand(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${audioname}`);
        process.chdir(base_path);
        return { result: "success", action, filename, duration: +(+duration).toFixed(3) };


    } else if (action === "concat") {
        /********************************/
        // 把所有的video片段合并成一个大的video
        /********************************/
        let videolist = args.videolist.split("|");

        process.chdir(`media/${args.book_cn}`);
        await fs.writeFileSync("filelist.txt", videolist.map((line) => `file 'video/${line}'`).join("\n")); // 生成文件列表
        saveLog(`writeFileSync: filelist.txt`);

        await execCommand(`ffmpeg -f concat -safe 0 -i "filelist.txt" -c copy -async 1000 -v quiet -y "dist/${filename}"`); // 合并

        let duration = await execCommand(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "dist/${filename}"`);
        process.chdir(base_path);
        return { result: "success", action, filename, duration: +(+duration).toFixed(3) };


    } else if (action === "encode") {
        /********************************/
        // 把所有的video片段合并成一个大的video
        /********************************/
        let inputvideo = args.inputvideo;
        await execCommand(
            [
                `ffmpeg -i "${inputvideo}" -hwaccel cuda`,
                `-c:a aac -b:a 128k -ar 44100 -ac 2`,
                `-c:v h264_nvenc -pix_fmt yuv420p`,
                `-v quiet -y "dist/${filename}"`
            ].join(" ")
        ); // 合并

        let duration = await execCommand(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "dist/${filename}"`);
        process.chdir(base_path);
        return { result: "success", action, filename, duration: +(+duration).toFixed(3) };
    } else if (action === "duration") {
        /********************************/
        // 返回给定media文件的长度
        /********************************/
        process.chdir(`media/${args.book_cn}`);
        let media_path = filename.match(/.mp4$/) ? "video" : "audio",
            duration = await execCommand(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${media_path}/${filename}"`);
        process.chdir(base_path);
        return { result: "success", duration: +(+duration).toFixed(3) };
    } else {
        return { result: "failed", action, reason: "未指定 action" };
    }
};
