let plugins = {
        "/ping": () => ({ result: "success" }),
        "/tts": require("./server-tts.js").textToSpeech,
        "/slide": require("./server-slide.js").captureSlide,
        "/ffmpeg": require("./server-ffmpeg.js").videoGenerator,
        "/os": require("./server-os.js").osOperation
    },
    entries = Object.keys(plugins);

let server = require("http").createServer(async (req, res) => {
    let postBody = "";
    res.statusCode = 200;
    console.log(`收到${req.method}请求，入口: ${req.url}`);

    if (req.method.toLowerCase() !== "post" || !entries.includes(req.url)) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.end(`调用非法（${req.method}, ${req.url}），合法POST入口: ${JSON.stringify(entries)}`);
    }
    req.on("data", function (chunk) {
        postBody += chunk;
    });
    req.on("end", async function () {
        let params = require("querystring").parse(postBody);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(await plugins[req.url](params)));
    });
});

console.log(`摩耳视频生成助手即将启动中...`);
console.log(`如果端口绑定出错，用管理员cmd执行命令：`);
console.log(`+---------------------------------------+`);
console.log(`|  \x1b[32mnet stop winnat && net start winnat\x1b[0m  |`);
console.log(`+---------------------------------------+`);
console.log(``);

server.listen(3000, "ttv.localweb.com", () => {
    console.log(`摩耳视频生成助手已启动，合法POST入口: ${JSON.stringify(entries)}`);
    require("child_process").exec("start https://ttv.localweb.com/");
});
