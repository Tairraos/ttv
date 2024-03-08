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
        util = require("./server-util.js"),
        book_cn = args.book_cn,
        targetslide = util.getFullname(book_cn, args.filename) ,
        browser = await puppeteer.launch({ headless: "new", args: ["--window-size=1920,1080"] }),
        page = await browser.newPage(),
        query = Object.keys(args)
            .map((s) => `${s}=${args[s]}`)
            .join("&");

    try {
        console.log(`抓图参数: ${JSON.stringify(args)}`);
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setRequestInterception(true);

        page.once("request", (request) => {
            var data = {
                method: "POST",
                postData: query,
                headers: {
                    ...request.headers(),
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            };
            request.continue(data);
            page.setRequestInterception(false);
        });

        await page.goto(`https://ttv.localweb.com/html-slide.php`);
        await page.screenshot({ path: targetslide});
        await browser.close();

        util.saveLog(book_cn, `生成slide: ${targetslide}`);
        return { result: "success", filename: args.filename, id: args.id };
    } catch (error) {
        return { result: "failed", reason: "遇到错误" };
    }
};
