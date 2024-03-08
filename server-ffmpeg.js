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
        util = require("./server-util.js"),
        action = args.action,
        book_cn = args.book_cn,
        base_path = process.cwd(),
        media_path = `media/${book_cn}`;

    console.log(`视频生成参数: ${JSON.stringify(args)}`);

    if (action === "piece") {
        /********************************/
        // 为每一组slide和audio生成一个video片段
        /********************************/
        let slidename = util.getShortname(book_cn, args.slidename),
            audioname = args.audioname === "DING" ? "../common/ding.m4a" : util.getShortname(book_cn, args.audioname),
            targetname = util.getShortname(book_cn, args.filename);

        process.chdir(media_path);
        await util.execCommand(
            book_cn,
            [
                `ffmpeg -hwaccel cuda -framerate 25 -loop 1 -i "${slidename}" -i "${audioname}"`,
                `-c:v h264_nvenc -r 25 -pix_fmt yuv420p`, // 视频用x264编码，stillimage优化静态图像，象素格式yuv420p
                `-c:a copy`, // 音频直接复制，否则会有bug
                `-shortest -v quiet -y "${targetname}` // 视频长度和audio一致，静默执行，覆盖目标文件
            ].join(" ")
        );

        let duration = await util.execCommand(book_cn, `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${audioname}`);
        process.chdir(base_path);
        return { result: "success", action, filename: targetname, duration: +(+duration).toFixed(3) };
        /*
         *
         * 
         *
         action end */
    } else if (action === "cover") {
        /********************************/
        // 生成静音封面
        /********************************/
        let imgname = `cover/${args.imgname}`,
            audioname = "../common/silence.m4a",
            targetname = util.getShortname(book_cn, args.filename);

        process.chdir(media_path);
        await util.execCommand(
            book_cn,
            [
                `ffmpeg -hwaccel cuda -framerate 25 -loop 1 -i "${imgname}" -i "${audioname}"`,
                `-c:v h264_nvenc -r 25 -pix_fmt yuv420p`, // 视频用x264编码，stillimage优化静态图像，象素格式yuv420p
                `-c:a copy`,
                `-shortest -v quiet -y "${targetname}` // 视频长度和audio一致，静默执行，覆盖目标文件
            ].join(" ")
        );

        process.chdir(base_path);
        return { result: "success", action, filename: targetname };
        /*
         *
         * 
         *
         action end */
    } else if (action === "concat") {
        /********************************/
        // 把所有的video片段合并成一个大的video
        /********************************/
        let videolist = args.videolist.split("|"),
            distvideo = util.getDistname(args.filename);

        await fs.writeFileSync(`${media_path}/filelist.txt`, videolist.map((filename) => `file '${util.getShortname(book_cn, filename)}'`).join("\n")); // 生成文件列表
        util.saveLog(book_cn, `生成文件列表: filelist.txt`);

        process.chdir(media_path);
        await util.execCommand(book_cn, `ffmpeg -f concat -safe 0 -i "filelist.txt" -c copy -strict -2 -async 1000 -v quiet -y "${distvideo}"`); // 合并
        let duration = await util.execCommand(book_cn, `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${distvideo}"`);

        //删除文件 filelist.txt
        await fs.unlinkSync("filelist.txt");
        util.saveLog(book_cn, `删除文件列表: filelist.txt`);

        process.chdir(base_path);
        return { result: "success", action, filename: distvideo, duration: +(+duration).toFixed(3) };
        /*
         *
         * 
         *
         action end */
    } else if (action === "encode") {
        /********************************/
        // intro是由剪映做的，把intro编码成和其它生成的mp4同样的格式，放在video目录，通常文件名叫过0.intro.mp4
        /********************************/
        let inputvideo = args.inputvideo,
            distvideo = util.getDistname(book_cn, args.filename);
        process.chdir(media_path);
        await util.execCommand(
            book_cn,
            [
                `ffmpeg -hwaccel cuda -i "${inputvideo}"`,
                `-c:a aac -b:a 128k -ar 44100 -ac 2`,
                `-c:v h264_nvenc -r 25 -pix_fmt yuv420p`,
                `-v quiet -y "${distvideo}"`
            ].join(" ")
        ); // 合并

        let duration = await util.execCommand(book_cn, `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${distvideo}"`);
        process.chdir(base_path);
        return { result: "success", action, filename: distvideo, duration: +(+duration).toFixed(3) };
        /*
         *
         * 
         *
         action end */
    } else if (action === "duration") {
        let targetname = util.getShortname(book_cn, args.filename);
        /********************************/
        // 返回给定media文件的长度
        /********************************/
        process.chdir(media_path);
        let duration = await util.execCommand(book_cn, `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${targetname}"`);
        process.chdir(base_path);
        return { result: "success", duration: +(+duration).toFixed(3) };
        /*
         *
         * 
         *
         action end */
    } else {
        return { result: "failed", action, reason: "未指定 action" };
    }
};
