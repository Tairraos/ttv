let fs = require("fs"),
    https = require("https"),
    privateKey = fs.readFileSync("D:\\Apps\\Xampp\\apache\\conf\\server.key"),
    certificate = fs.readFileSync("D:\\Apps\\Xampp\\apache\\conf\\server.crt"),
    credentials = {
        key: privateKey,
        cert: certificate
    };
let server = https.createServer(credentials, async (req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.write("It works!");
    res.end();
});
server.listen(3000, "ttv.localweb.com", () => {
    console.log(`服务已启动`);
    // require("child_process").exec("start https://ttv.localweb.com:3000/");
});
