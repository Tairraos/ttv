/**
 * 封装服务，把mp3和png文件封装成视频
 * @param {*} args
 * @param {string} args.action      <slide | mp4 | duration> slide 转 mp4 | mp4 合并 | media 时长
 * @param {string} args.target      保存的文件名
 * @param {string} args.slidename   slide 素材
 * @param {string} args.mp3name     mp3 素材
 * @param {string} args.mp4list     要合并的 mp4 列表
 * @param {string} args.mp3list     求长度的 mp3 列表
 * @return {JSON}
 *
 * voice 参数可用值参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/language-support?tabs=tts
 * 如果要扩展其它 SSML 内容，express，role，rate，pitch 参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/speech-synthesis-markup-voice
 * 质量文档：https://learn.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/speechsynthesisoutputformat
 */

exports.mp4Generator = async function (args) {
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
        // 为每一组slide和mp3生成一个mp4片段
        /********************************/

        let slidename = `slide/${args.slidename}`,
            mp3name = args.mp3name === "DING" ? "../common/ding.mp3" : `audio/${args.mp3name}`;

        process.chdir("media/material");

        await execCommand(
            [
                `ffmpeg -loop 1 -i "${slidename}" -i "${mp3name}"`,
                `-c:v libx264 -tune stillimage -pix_fmt yuv420p`, // 视频用x264编码，stillimage优化静态图像，象素格式yuv420p
                `-c:a aac -b:a 128k -ac 2`, // 音频用aac编码，128k码率，2声道
                `-shortest -v quiet -y "video/${args.target}` // 视频长度和mp3一致，静默执行，覆盖目标文件
            ].join(" ")
        );

        process.chdir(basePath);

        return { result: "success", action: args.action, filename: args.target };
    } else if (args.action === "mp4") {
        /********************************/
        // 把所有的mp4片段合并成一个大的mp4
        /********************************/

        let mp4list = args.mp4list.split("|");

        process.chdir("media/material");

        await fs.writeFileSync("filelist.txt", mp4list.map((line) => `file 'video/${line}'`).join("\n")); // 生成文件列表
        saveLog(`writeFileSync: filelist.txt`);
        // command = `ffmpeg -f concat -safe 0 -i "filelist.txt" -c copy -v quiet -y "_tmp.mp4"`;
        await execCommand(`ffmpeg -f concat -safe 0 -i "filelist.txt" -c copy -v quiet -y "../dist/${args.target}"`); // 合并
        let result = await execCommand(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "../dist/${args.target}"`);

        process.chdir(basePath);

        return { result: "success", action: args.action, filename: args.target, duration: +(+result).toFixed(3) };
    } else if (args.action === "duration") {
        /********************************/
        // 计算列表里mp3的时间总长度
        /********************************/

        let totalDuration = 0;

        process.chdir("media/material/audio");

        for (let mp3 of args.mp3list.split("|")) {
            let mp3name = mp3 === "DING" ? "../../common/ding.mp3" : mp3,
                result = await execCommand(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${mp3name}`);
            totalDuration += +result;
        }

        process.chdir(basePath);

        return { result: "success", duration: +totalDuration.toFixed(3) };
    } else {
        return { result: "failed", action: args.action, reason: "unknown action" };
    }
};
