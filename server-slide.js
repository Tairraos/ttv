/**
 * 抓图片服务
 * @param {*} args
 * @param {number} args.id          - 图片对应的数据库记录，如果id=0，内容为耳朵听力图标
 * @param {string} args.filename    - 要生成的图片名称，图片会生成在 media/material 目录下
 * @param {string} args.theme       - 指定背景图名字，背景图是放在 media/images 目录下的 jpg 文件
 * @param {string} args.language    - 教学的是英语还是汉语
 * @return {JSON}
 */

exports.captureSlide = async function (args) {
    let puppeteer = require("puppeteer"),
        fs = require("fs"),
        path = require("path"),
        basePath = process.cwd(),
        browser = await puppeteer.launch({ headless: "new", args: ["--window-size=1920,1080"] }),
        page = await browser.newPage(),
        query = Object.keys(args)
            .map((s) => `${s}=${args[s]}`)
            .join("&");

    let saveLog = async function (text) {
        await fs.appendFileSync(path.join(basePath, "media/material/process_log.txt"), `${new Date().toISOString()} - ${text}\n`, "utf8");
    };

    try {
        console.log(`抓图参数: ${JSON.stringify(args)}`);
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(`https://ttv.localweb.com/api-page.php?${query}`);
        await page.screenshot({ path: `media/material/slide/${args.filename}` });
        await browser.close();

        saveLog(`生成slide: https://ttv.localweb.com/api-page.php?${query} => media/material/slide/${args.filename}`);
        return { result: "success", filename: args.filename, id: args.id };
    } catch (error) {
        return { result: "failed", reason: "遇到错误" };
    }
};
