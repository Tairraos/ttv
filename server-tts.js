/**
 * 文本转语音服务，使用 azure cognitive speech 服务
 * Key 和 Region 写在环境中，用 setx 写入
 * @param {*} args
 * @param {string} args.filename 保存的文件名
 * @param {string} args.voice 使用的神经模型名字
 * @param {string} args.text 要转换的文本
 * @param {number} args.rate 语速加速百分比，0 为不加速
 * @return {JSON}
 *
 * voice 参数可用值参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/language-support?tabs=tts
 * 如果要扩展其它 SSML 内容，express，role，rate，pitch 参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/speech-synthesis-markup-voice
 * 质量文档：https://learn.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/speechsynthesisoutputformat
 */

exports.textToSpeech = async function (args) {
    let fs = require("fs"),
        // child_process = require("child_process"),
        ssml = [
            `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">`,
            `<voice name="${args.voice}">`,
            +args.rate ? `<prosody rate="+${+args.rate}%">` : "",
            `<break time="500ms" />${args.text}<break time="500ms" />`,
            +args.rate ? "</prosody>" : "",
            `</voice>`,
            `</speak>`
        ].join(""),
        progress;

    console.log(`TTS参数: ${JSON.stringify(args)}`);

    let sdk = require("microsoft-cognitiveservices-speech-sdk"),
        speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY, process.env.AZURE_SPEECH_REGION),
        audio_config = sdk.AudioConfig.fromDefaultSpeakerOutput();

    try {
        speechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary, "true");
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3;
        let speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audio_config);

        progress = `正在生成语音... ${JSON.stringify(args)}`;
        let result = await new Promise((resolve, reject) => {
            speechSynthesizer.speakSsmlAsync(
                ssml,
                (result) => {
                    result.reason === sdk.ResultReason.SynthesizingAudioCompleted
                        ? resolve(Buffer.from(result.audioData))
                        : reject({ error: result.errorDetails });
                    speechSynthesizer.close();
                },
                (error) => {
                    speechSynthesizer.close();
                    reject({ error: error });
                }
            );
        });

        progress = `正在写入文件...`;
        fs.writeFileSync(`media/material/${args.filename}`, result);

        // 因为azure生成的Mp3是VBR的，时长有问题
        // progress = `正在转换格式...`;
        // child_process.execSync(`ffmpeg -i "__tts_temp__.wav" -acodec libmp3lame -ac 2 -ar 48000 -b:a 96k -v quiet -y "media/material/${args.filename}"`);

        // progress = `正在删除临时文件...`;
        // await fs.unlinkSync("__tts_temp__.mp3");

        // progress = `正在获取时长...`;
        // result = child_process.execSync(`ffprobe -i "media/material/${args.filename}" -show_entries format=duration -v quiet -of csv="p=0"`);

        // return { result: "success", filename: args.filename, duration: +String(result).trim() };
        return { result: "success", filename: args.filename };
    } catch (error) {
        return { result: "failed", progress: progress, data: error };
    }
};

