/**
 * 完成所有的准备
 */

exports.clean = async function (args) {
    let fs = require("fs"),
        thread = require("child_process"),
        basePath = process.cwd();

    console.log(`视频生成参数: ${JSON.stringify(args)}`);
    if (args.action === "slide") {
        process.chdir("media/material");
        thread.execSync(`ffmpeg -loop 1 -i "${args.slidename}" -i "${args.mp3name}" -c:a copy -c:v libx264 -shortest -v quiet -y "../video/${args.target}"`);
        await fs.unlinkSync(args.slidename);
        await fs.unlinkSync(args.mp3name);
        // await fs.unlinkSync(args.mp3name);
        process.chdir(basePath);
        return { result: "success", action: args.action, filename: args.target };
    } else if (args.action === "mp4") {
        let mp4list = args.mp4list.split("|");
        process.chdir("media/video");
        fs.writeFileSync("filelist.txt", mp4list.map((line) => `file '${line}'`).join("\n"));
        thread.execSync(`ffmpeg -f concat -safe 0 -i "filelist.txt" -c copy -v quiet -y "../dist/${args.target}"`);
        await fs.unlinkSync("filelist.txt");
        for (let file of mp4list) {
            await fs.unlinkSync(file);
        }
        process.chdir(basePath);
        return { result: "success", action: args.action, filename: args.target };
    } else {
        return { result: "failed", action: args.action, reason: "unknown action" };
    }
};
