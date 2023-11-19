/**
 * 完成所有的准备
 * 1 ui.js 会生成 slide 到 temp 目录
 * 2 把准备好的 mp3 从 audio 目录移到 temp 目录
 * 3 生成空白
 * 封装服务，把mp3和png文件封装成视频
 * @param {*} args
 * @param {string} args.action      <slide | mp4> slide 转 mp4 | mp4 合并
 * @param {string} args.target      保存的文件名
 * @param {string} args.slidename   slide 素材
 * @param {string} args.mp3name     mp3 素材
 * @param {string} args.mp4list     要合并的 mp4 列表
 * @return {JSON}
 *
 * voice 参数可用值参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/language-support?tabs=tts
 * 如果要扩展其它 SSML 内容，express，role，rate，pitch 参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/speech-synthesis-markup-voice
 * 质量文档：https://learn.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/speechsynthesisoutputformat
 */

exports.mp4Generator = async function (args) {
    let fs = require("fs"),
        child_process = require("child_process"),
        basePath = process.cwd();

    console.log(`视频生成参数: ${JSON.stringify(args)}`);
    if (args.action === "slide") {
        process.chdir("media/material");
        await child_process.execSync(`ffmpeg -loop 1 -i "${args.slidename}" -i "${args.mp3name}" -c:a copy -c:v libx264 -shortest -v quiet -y "../video/${args.target}"`);
        // await fs.renameSync(args.slidename, `../archive/${args.slidename}`);
        // await fs.renameSync(args.mp3name, `../archive/${args.mp3name}`);
        // await fs.unlinkSync(args.mp3name);
        process.chdir(basePath);
        return { result: "success", action: args.action, filename: args.target };
    } else if (args.action === "mp4") {
        let mp4list = args.mp4list.split("|");
        process.chdir("media/video");
        await fs.writeFileSync("filelist.txt", mp4list.map((line) => `file '${line}'`).join("\n"));
        await child_process.execSync(`ffmpeg -f concat -safe 0 -i "filelist.txt" -c copy -v quiet -y "../dist/${args.target}"`);
        // await fs.unlinkSync("filelist.txt");
        // for (let file of mp4list) {
        //     await fs.unlinkSync(file);
        // }
        process.chdir(basePath);
        return { result: "success", action: args.action, filename: args.target };
    } else {
        return { result: "failed", action: args.action, reason: "unknown action" };
    }
};
