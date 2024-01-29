let captureSlide = async function (args) {
    let puppeteer = require("puppeteer"),
        fs = require("fs"),
        path = require("path"),
        base_path = process.cwd(),
        querystring = require('querystring'),
        browser = await puppeteer.launch({ headless: "new", args: ["--window-size=1920,1080"] }),
        page = await browser.newPage(),
        query = Object.keys(args)
            .map((s) => `${s}=${JSON.stringify(args[s])}`)
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

        await page.goto(`https://ttv.localweb.com/test.php`);
        // await page.goto(`https://ttv.localweb.com/html-slide.php?${query}`);
        await page.screenshot({ path: `${args.filename}` });
        await browser.close();

        console.log({ result: "success", filename: args.filename, id: args.id });
    } catch (error) {
        console.log({ result: "failed", reason: "遇到错误" });
    }
};

captureSlide({
    filename: "test.png",
    action: "test",
    data: [
        { a: 100, b: 200, c: 300 },
        { a: 400, b: 500, c: 600 },
        { a: 700, b: 800, c: 900 }
    ]
});
