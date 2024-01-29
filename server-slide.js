/**
 * 抓图片服务
 * @param {*} args
 * @param {number} args.id          - id=0 为耳朵听力图标, 其他为字幕
 * @param {array}  args.rows        - 数据
 * @param {string} args.book_cn     - 目录名
 * @param {string} args.filename    - slide名字
 * @param {string} args.theme       - 背景图片
 * @param {string} args.language    - 书本语言
 * @param {string} args.type        - 听力，双语，单语
 * @param {string} args.watermark   - 水印位置
 * @param {string} args.svg         - 听力耳机图片
 * @return {JSON}
 */

exports.captureSlide = async function (args) {
    let puppeteer = require("puppeteer"),
        fs = require("fs"),
        path = require("path"),
        base_path = process.cwd(),
        browser = await puppeteer.launch({ headless: "new", args: ["--window-size=1920,1080"] }),
        page = await browser.newPage(),
        query = Object.keys(args)
            .map((s) => `${s}=${args[s]}`)
            .join("&");

    let saveLog = async function (text) {
        await fs.appendFileSync(path.join(base_path, "media/material/process_log.txt"), `${new Date().toISOString()} - ${text}\n`, "utf8");
    };

    try {
        console.log(`抓图参数: ${JSON.stringify(args)}`);
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setRequestInterception(true);

        page.on("request", (interceptedRequest) => {
            var data = {
                method: "POST",
                postData: "paramFoo=valueBar&paramThis=valueThat"
            };
            interceptedRequest.continue(data);
        });

        await page.goto(`https://ttv.localweb.com/html-slide.php`);
        // await page.goto(`https://ttv.localweb.com/html-slide.php?${query}`);
        await page.screenshot({ path: `media/material/slide/${args.filename}` });
        await browser.close();

        saveLog(`生成slide: https://ttv.localweb.com/html-slide.php?${query} => media/material/slide/${args.filename}`);
        return { result: "success", filename: args.filename, id: args.id };
    } catch (error) {
        return { result: "failed", reason: "遇到错误" };
    }
};
