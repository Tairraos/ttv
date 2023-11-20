/**
 * 微软 TTS 服务的 Rest 和 Azure Api
 * -filename    <必要> 保存文件名
 * -api         调用接口，缺省azure，可选值为"rest"
 * -text        <必要> 需要转语音的内容
 * -voice       说话声音 缺省为 "zh-CN-XiaoxiaoNeural",
 * -express     说话风格
 * -role        说话角色
 * -rate        语速提升百分比，缺省0
 * -pitch       语调提升百分比，缺省0
 *
 * voice 参数可用值参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/language-support?tabs=tts
 * express，role，rate，pitch 参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/speech-synthesis-markup-voice
 * 质量文档：https://learn.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/speechsynthesisoutputformat
 *
 * edge接口仅支持6，7两种Mp3, rest 和 azure 支持所有
 * Audio24Khz48KBitRateMonoMp3 = 6	    audio-24khz-48kbitrate-mono-mp3
 * Audio24Khz96KBitRateMonoMp3 = 7	    audio-24khz-96kbitrate-mono-mp3
 * Audio24Khz160KBitRateMonoMp3 = 8     audio-24khz-160kbitrate-mono-mp3
 * Audio48Khz96KBitRateMonoMp3 = 21	    audio-48khz-96kbitrate-mono-mp3
 * Audio48Khz192KBitRateMonoMp3 = 22    audio-48khz-192kbitrate-mono-mp3
 *
 * 以下推荐的神经网络模型选择指标是：40%加速后仍然声音自然
 * Edge接口模型有限，中文做如下选择，英文的两个edge接口是支持的。
 * 英语选择：
 * 男声：en-US-SteffanNeural
 * 女声：en-US-JennyNeural
 * 中文选择：
 * 男声：zh-CN-YunfengNeural
 * 女声：zh-CN-XiaochenNeural
 * 男声：zh-CN-YunjianNeural
 * 女声：zh-CN-XiaoxiaoNeural
 */

function initArgs() {
    let argArr = [...process.argv.slice(2)],
        args = {},
        item = argArr.shift();

    while (item) {
        if (item.match(/^-/)) {
            args[item] = argArr.length && !argArr[0].match(/^-/) ? argArr[0] : "";
        }
        item = argArr.shift();
    }
    return args;
}

// REST接口，这是网页中逆向出来的免费接口
function restApi(ssml) {
    let axios = require("axios"),
        data = JSON.stringify({
            ssml,
            ttsAudioFormat: "audio-24khz-160kbitrate-mono-mp3",
            offsetInPlainText: 0,
            properties: {
                SpeakTriggerSource: "AccTuningPagePlayButton"
            }
        });

    let config = {
        method: "post",
        // url: "https://chinaeast2.api.speech.azure.cn/accfreetrial/texttospeech/acc/v3.0-beta1/vcg/speak",
        url: "https://southeastasia.api.speech.microsoft.com/accfreetrial/texttospeech/acc/v3.0-beta1/vcg/speak",
        responseType: "arraybuffer",
        headers: {
            // authority: "chinaeast2.api.speech.azure.cn",
            authority: "southeastasia.api.speech.microsoft.com",
            accept: "*/*",
            "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-TW;q=0.6",
            customvoiceconnectionid: "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, () => ((Math.random() * 16) | 0).toString(16)),
            // origin: "https://speech.azure.cn",
            origin: "https://speech.microsoft.com",
            "sec-ch-ua": `"Microsoft Edge";v="119", "Chromium";v="119", "Not?A_Brand";v="24"`,
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": `"Windows"`,
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
            "content-type": "application/json"
        },

        data: data
    };

    return new Promise((resolve, reject) => {
        axios(config)
            .then(function (response) {
                resolve(response.data);
            })
            .catch(function (error) {
                reject({ status: error.response.status, statusText: error.response.statusText });
            });
    });
}

function azureApi(ssml) {
    // 每个月免费500K, 速度较快
    let sdk = require("microsoft-cognitiveservices-speech-sdk"),
        speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY, process.env.AZURE_SPEECH_REGION);
    speechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary, "true");
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;
    let audio_config = sdk.AudioConfig.fromDefaultSpeakerOutput(),
        speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audio_config);
    return new Promise((resolve, reject) => {
        speechSynthesizer.speakSsmlAsync(
            ssml,
            (result) => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    resolve(Buffer.from(result.audioData));
                } else {
                    reject({ errorDetail: result.errorDetails });
                }
                speechSynthesizer.close();
                speechSynthesizer = null;
            },
            (error) => {
                speechSynthesizer.close();
                speechSynthesizer = null;
                reject({ error: error });
            }
        );
    });
}

/** 生成SSML, 如果想要SSML更强大，text是可以带命令的，参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/speech-synthesis-markup-structure */
function makeSSML(text, voice = "zh-CN-XiaoxiaoNeural", /* express = "", role = "", */ rate = 0 /* pitch = 0 */) {
    // return `
    //     <speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">
    //         <voice name="${voice}">
    //             <mstts:express-as ${express && `style="${express}"`} ${role && `role="${role}"`}>
    //                 <prosody rate="${rate}%" pitch="${pitch}%">
    //                     <break time="500ms" />${text}<break time="500ms" />
    //                 </prosody>
    //             </mstts:express-as>
    //         </voice>
    //     </speak>`;
    return `
        <speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">
            <voice name="${voice}">${rate ? `<prosody rate="${rate}%">` : ""}
                <break time="500ms" />${text}<break time="500ms" />
            ${rate ? "</prosody>" : ""}</voice>
        </speak>`;
}

/** 程序入口 */
(async () => {
    let fs = require("fs"),
        thread = require("child_process"),
        arg = initArgs(),
        progress = "",
        filename = arg["-filename"] || "测试文字转语音.mp3",
        api = arg["-api"] || "rest",
        text = arg["-text"] || "测试语音，请使用参数定制内容",
        voice = arg["-voice"] || "zh-CN-XiaoxiaoNeural",
        // express = arg["-express"] || "",
        // role = arg["-role"] || "",
        rate = arg["-rate"] || 0,
        // pitch = arg["-pitch"] || 0,
        SSML = makeSSML(text, voice, /* express, role, */ +rate /* +pitch */);

    try {
        progress = `正在生成语音... api=${api}, text=${text}, voice=${voice}, rate=${rate}`;
        let result = api === "azure" ? await azureApi(SSML) : await restApi(SSML);

        progress = `正在写入文件...`;
        fs.writeFileSync("__tts_temp__.mp3", result);

        progress = `正在转换格式...`;
        thread.execSync(`ffmpeg -i __tts_temp__.mp3 -acodec libmp3lame -ac 2 -ar 48000 -b:a 128k -v quiet -y ${filename}`);

        progress = `正在获取时长...`;
        let stdout = thread.execSync(`ffprobe -i "${filename}" -show_entries format=duration -v quiet -of csv="p=0"`);

        progress = `正在删除临时文件...`;
        await fs.unlinkSync("__tts_temp__.mp3");
        console.log(JSON.stringify({ result: "success", filename: filename, duration: +String(stdout).trim() }));
    } catch (error) {
        console.log(JSON.stringify({ result: "failed", progress: progress, data: error }));
    }
})();
