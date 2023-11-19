/**
 * 逆向Edge浏览器的Bing语音插件获得的TTS接口
 * 在本工程中没有使用，本来想用的，发现azure够用了，就没有整合进工程
 * edge接口仅支持6，7两种Mp3
 * Audio24Khz48KBitRateMonoMp3 = 6	    audio-24khz-48kbitrate-mono-mp3
 * Audio24Khz96KBitRateMonoMp3 = 7	    audio-24khz-96kbitrate-mono-mp3
 */

let { randomBytes } = require("crypto"),
    { WebSocket } = require("ws"),
    fs = require("fs");

class Service {
    ws = null;
    executorMap;
    bufferMap;
    timer = null;

    constructor() {
        this.executorMap = new Map();
        this.bufferMap = new Map();
    }

    async connect() {
        const connectionId = randomBytes(16).toString("hex").toLowerCase();
        let url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=${connectionId}`;
        let ws = new WebSocket(url, {
            host: "speech.platform.bing.com",
            origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.66 Safari/537.36 Edg/103.0.1264.44"
            }
        });
        return new Promise((resolve, reject) => {
            ws.on("open", () => {
                resolve(ws);
            });
            ws.on("close", (code, reason) => {
                // 服务器会自动断开空闲超过30秒的连接
                this.ws = null;
                if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = null;
                }
                for (let [, value] of this.executorMap) {
                    value.reject(`连接已关闭: ${reason} ${code}`);
                }
                this.executorMap.clear();
                this.bufferMap.clear();
                console.info(`连接已关闭： ${reason} ${code}`);
            });

            ws.on("message", (message, isBinary) => {
                let pattern = /X-RequestId:(?<id>[a-z|0-9]*)/;
                if (!isBinary) {
                    let data = message.toString();
                    if (data.includes("Path:turn.start")) {
                        // 开始传输
                        let matches = data.match(pattern);
                        let requestId = matches.groups.id;
                        this.bufferMap.set(requestId, Buffer.from([]));
                    } else if (data.includes("Path:turn.end")) {
                        // 结束传输
                        let matches = data.match(pattern);
                        let requestId = matches.groups.id;

                        let executor = this.executorMap.get(requestId);
                        if (executor) {
                            this.executorMap.delete(matches.groups.id);
                            let result = this.bufferMap.get(requestId);
                            executor.resolve(result);
                            console.info(`传输完成：${requestId}……`);
                        } else {
                            console.info(`请求已被丢弃：${requestId}`);
                        }
                    }
                } else if (isBinary) {
                    let separator = "Path:audio\r\n";
                    let data = message;
                    let contentIndex = data.indexOf(separator) + separator.length;

                    let headers = data.slice(2, contentIndex).toString();
                    let matches = headers.match(pattern);
                    let requestId = matches.groups.id;

                    let content = data.slice(contentIndex);
                    let buffer = this.bufferMap.get(requestId);
                    if (buffer) {
                        buffer = Buffer.concat([buffer, content], buffer.length + content.length);
                        this.bufferMap.set(requestId, buffer);
                    } else {
                        console.info(`请求已被丢弃：${requestId}`);
                    }
                }
            });
            ws.on("error", (error) => {
                console.error(`连接失败： ${error}`);
                reject(`连接失败： ${error}`);
            });
        });
    }

    async convert(ssml, format) {
        if (this.ws == null || this.ws.readyState != WebSocket.OPEN) {
            console.info("准备连接服务器……");
            let connection = await this.connect();
            this.ws = connection;
            console.info("连接成功！");
        }
        let requestId = randomBytes(16).toString("hex").toLowerCase();
        let result = new Promise((resolve, reject) => {
            // 等待服务器返回后这个方法才会返回结果
            this.executorMap.set(requestId, {
                resolve,
                reject
            });
            // 发送配置消息
            let configData = {
                context: {
                    synthesis: {
                        audio: {
                            metadataoptions: {
                                sentenceBoundaryEnabled: "false",
                                wordBoundaryEnabled: "false"
                            },
                            outputFormat: format
                        }
                    }
                }
            };
            let configMessage =
                `X-Timestamp:${Date()}\r\n` + "Content-Type:application/json; charset=utf-8\r\n" + "Path:speech.config\r\n\r\n" + JSON.stringify(configData);
            this.ws.send(configMessage, (configError) => {
                if (configError) {
                    console.error(`配置请求发送失败：${requestId}\n`);
                }

                // 发送SSML消息
                let ssmlMessage =
                    `X-Timestamp:${Date()}\r\n` + `X-RequestId:${requestId}\r\n` + `Content-Type:application/ssml+xml\r\n` + `Path:ssml\r\n\r\n` + ssml;
                this.ws.send(ssmlMessage, (ssmlError) => {
                    if (ssmlError) {
                        console.error(`SSML消息发送失败：${requestId}\n`);
                    }
                });
            });
        });

        // 收到请求，清除超时定时器
        if (this.timer) {
            console.info("收到新的请求，清除超时定时器");
            clearTimeout(this.timer);
        }
        // 设置定时器，超过10秒没有收到请求，主动断开连接
        this.timer = setTimeout(() => {
            if (this.ws && this.ws.readyState == WebSocket.OPEN) {
                this.ws.close(1000);
                this.timer = null;
            }
        }, 10000);

        let data = await Promise.race([
            result,
            new Promise((resolve, reject) => {
                // 如果超过 20 秒没有返回结果，则清除请求并返回超时
                setTimeout(() => {
                    this.executorMap.delete(requestId);
                    this.bufferMap.delete(requestId);
                    reject("转换超时");
                }, 10000);
            })
        ]);
        return data;
    }
}

let service = new Service();
async function retry(fn, times, errorFn, failedMessage) {
    let reason = {
        message: failedMessage ?? "多次尝试后失败",
        errors: []
    };
    for (let i = 0; i < times; i++) {
        try {
            return await fn();
        } catch (error) {
            if (errorFn) {
                errorFn(i, error);
            }
            reason.errors.push(error);
        }
    }
    throw reason;
}

async function edgeApi(ssml) {
    try {
        let format = "audio-24khz-96kbitrate-mono-mp3",
            result = await retry(
                async () => {
                    let result = await service.convert(ssml, format);
                    return result;
                },
                3,
                (index, error) => {
                    console.error(`第${index}次转换失败：${error}`);
                },
                "服务器多次尝试后转换失败"
            );
        return result;
    } catch (error) {
        console.error(`发生错误, ${error.message}`);
        // response.status(503).json(error);
    }
}

(async () => {
    let result = await edgeApi(
        [
            `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">`,
            `<voice name="zh-CN-XiaoxiaoNeural">`,
            `欢迎使用语音合成服务，`,
            `<prosody rate="+50%">本次合成的语音是由机器人自动生成。</prosody>`,
            `</voice>`,
            `</speak>`
        ].join("")
    );

    fs.writeFileSync("__tts_temp__.mp3", result);
})();
