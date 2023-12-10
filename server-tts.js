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
        path = require("path"),
        thread = require("child_process"),
        basePath = process.cwd(),
        ssml = [
            `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">`,
            `<voice name="${args.voice}">`,
            +args.rate ? `<prosody rate="${args.rate > 0 ? "+" : ""}${+args.rate}%">` : "",
            `<break time="500ms" />${args.text}<break time="500ms" />`,
            +args.rate ? "</prosody>" : "",
            `</voice>`,
            `</speak>`
        ].join(""),
        progress;

    let saveLog = async function (text) {
        await fs.appendFileSync(path.join(basePath, "media/material/process_log.txt"), `${new Date().toISOString()} - ${text}\n`, "utf8");
    };

    let execCommand = async function (command) {
        await saveLog(command);
        return await thread.execSync(command);
    };

    console.log(`TTS参数: ${JSON.stringify(args)}`);

    let sdk = require("microsoft-cognitiveservices-speech-sdk"),
        speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY, process.env.AZURE_SPEECH_REGION),
        audio_config = sdk.AudioConfig.fromDefaultSpeakerOutput();

    try {
        speechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary, "true");
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3;
        let speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audio_config);

        progress = `通过API生成语音：${args.text}`;
        saveLog(`azure tts api: ${args.voice} => ${args.text}`);
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

        process.chdir("media/material/audio");

        progress = `保存文件：${args.filename}.mp3`;
        await fs.writeFileSync(`${args.filename}.mp3`, result); // 写临时文件
        saveLog(`writeFileSync: ${args.filename}.mp3`);

        progress = `修正静音，输出成：${args.filename}.m4a`;
        await execCommand(
            [
                `ffmpeg -i "${args.filename}.mp3"`,
                `-filter_complex`,
                [
                    `"`,
                    `silenceremove=`, // 删除静音
                    `start_periods=1:`,
                    `start_duration=0:`,
                    `start_threshold=-60dB:`, // 小于最大音量-60dB的才算静音
                    `start_silence=0.5:`, // 头上保留0.5秒静音
                    `detection=peak,`,
                    `areverse,`, // 反过来，因为从后面剪音频有问题
                    `silenceremove=`, // 删除静音
                    `start_periods=1:`,
                    `start_duration=0:`,
                    `start_threshold=-60dB:`,
                    `start_silence=0.5:`,
                    `detection=peak,`,
                    `areverse`, // 反回来
                    `"`
                ].join(""),
                `-c:a aac -b:a 128k -ar 44100 -ac 2`,
                `-v quiet -y "${args.filename}.m4a"`
            ].join(" ")
        );

        progress = `删除mp3源文件：${args.filename}.m4a`;
        await fs.unlinkSync(`${args.filename}.mp3`);
        saveLog(`unlinkSync: ${args.filename}.mp3`);

        process.chdir(basePath);
        return { result: "success", filename: args.filename };
    } catch (error) {
        return { result: "failed", progress: progress, data: error };
    }
};
