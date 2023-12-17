/**
 * 封装服务，把audio和png文件封装成视频
 * @param {*} args
 * @param {string} args.action      <piece | video | duration> slide 转 video | video 合并 | media 时长
 * @param {string} args.filename    保存的文件名
 * @param {string} args.slidename   slide 素材
 * @param {string} args.audioname   audio 素材
 * @param {string} args.videolist   要合并的 video 列表
 * @param {string} args.audiolist   求长度的 audio 列表
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
        basePath = process.cwd();

    let saveLog = async function (text) {
        await fs.appendFileSync(path.join(basePath, "media/material/process_log.txt"), `${new Date().toISOString()} - ${text}\n`, "utf8");
    };

    let execCommand = async function (command) {
        await saveLog(command);
        return await thread.execSync(command);
    };

    console.log(`视频生成参数: ${JSON.stringify(args)}`);

    if (args.action === "piece") {
        /********************************/
        // 为每一组slide和audio生成一个video片段
        /********************************/

        let slidename = `slide/${args.slidename}`,
            audioname = args.audioname === "DING" ? "../common/ding.m4a" : `audio/${args.audioname}`;

        process.chdir("media/material");
        await execCommand(
            [
                `ffmpeg -loop 1 -i "${slidename}" -i "${audioname}"`,
                `-c:v libx264 -tune stillimage -pix_fmt yuv420p`, // 视频用x264编码，stillimage优化静态图像，象素格式yuv420p
                `-c:a copy`, // 音频直接复制，否则会有bug
                `-shortest -v quiet -y "video/${args.filename}` // 视频长度和audio一致，静默执行，覆盖目标文件
            ].join(" ")
        );

        process.chdir(basePath);

        return { result: "success", action: args.action, filename: args.filename };
    } else if (args.action === "video") {
        /********************************/
        // 把所有的video片段合并成一个大的video
        /********************************/

        let videolist = args.videolist.split("|");

        process.chdir("media/material");

        await fs.writeFileSync("filelist.txt", videolist.map((line) => `file 'video/${line}'`).join("\n")); // 生成文件列表
        saveLog(`writeFileSync: filelist.txt`);
        // command = `ffmpeg -f concat -safe 0 -i "filelist.txt" -c copy -v quiet -y "_tmp.mp4"`;
        await execCommand(`ffmpeg -f concat -safe 0 -i "filelist.txt" -c copy -v quiet -y "../dist/${args.filename}"`); // 合并
        let result = await execCommand(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "../dist/${args.filename}"`);

        process.chdir(basePath);

        return { result: "success", action: args.action, filename: args.filename, duration: +(+result).toFixed(3) };
    } else if (args.action === "duration") {
        /********************************/
        // 计算列表里audio的时间总长度
        /********************************/

        let totalDuration = 0;

        process.chdir("media/material/audio");

        for (let audio of args.audiolist.split("|")) {
            let audioname = audio === "DING" ? "../../common/ding.m4a" : audio,
                result = await execCommand(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${audioname}`);
            totalDuration += +result;
        }

        process.chdir(basePath);

        return { result: "success", duration: +totalDuration.toFixed(3) };
    } else {
        return { result: "failed", action: args.action, reason: "unknown action" };
    }
};
