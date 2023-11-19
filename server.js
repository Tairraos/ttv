let plugins = {
        "/tts": require("./server-tts.js").textToSpeech,
        "/slide": require("./server-slide.js").captureSlide,
        "/ffmpeg": require("./server-ffmpeg.js").mp4Generator,
        "/clean": require("./server-clean.js").clean,
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

server.listen(3000, "ttv.localweb.com", () => {
    console.log(`摩耳视频生成助手已启动，合法POST入口: ${JSON.stringify(entries)}`);
    require("child_process").exec("start https://ttv.localweb.com/");
});
