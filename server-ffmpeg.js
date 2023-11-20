/**
 * 完成所有的准备
 * 1 ui.js 会生成 slide 到 temp 目录
 * 2 把准备好的 mp3 从 audio 目录移到 temp 目录
 * 3 生成空白
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
        thread = require("child_process"),
        basePath = process.cwd();

    console.log(`视频生成参数: ${JSON.stringify(args)}`);
    if (args.action === "slide") {
        process.chdir("media/material");
        await thread.execSync(
            `ffmpeg -loop 1 -i "${args.slidename}" -i "${args.mp3name}" -c:a copy -c:v libx264 -shortest -v quiet -y "../video/${args.target}"`
        );
        process.chdir(basePath);
        return { result: "success", action: args.action, filename: args.target };
    } else if (args.action === "mp4") {
        let mp4list = args.mp4list.split("|");
        process.chdir("media/video");
        await fs.writeFileSync("filelist.txt", mp4list.map((line) => `file '${line}'`).join("\n"));
        await thread.execSync(`ffmpeg -f concat -safe 0 -i "filelist.txt" -c copy -v quiet -y "../dist/${args.target}"`);
        let result = await thread.execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "../dist/${args.target}"`);
        process.chdir(basePath);
        return { result: "success", action: args.action, filename: args.target, duration: +(+result).toFixed(3) };
    } else if (args.action === "duration") {
        let totalDuration = 0;
        process.chdir("media/material");
        for (const mp3 of args.mp3list.split("|")) {
            let result = await thread.execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${mp3}`);
            totalDuration += +result;
        }
        //把media/image/
        return { result: "success", duration: +totalDuration.toFixed(3) };
    } else {
        return { result: "failed", action: args.action, reason: "unknown action" };
    }
};
