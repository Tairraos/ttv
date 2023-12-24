/**
 * 文本转语音服务，使用 azure cognitive speech 服务
 * Key 和 Region 写在环境中，用 setx 写入
 * @param {*} args
 * @param {string} args.filename 保存的文件名
 * @param {string} args.model 使用的神经模型名字
 * @param {string} args.text 要转换的文本
 * @param {number} args.rate 语速加速百分比，0 为不加速
 * @return {JSON}
 *
 * model 参数可用值参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/language-support?tabs=tts
 * 如果要扩展其它 SSML 内容，express，role，rate，pitch 参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/speech-synthesis-markup-voice
 * 质量文档：https://learn.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/speechsynthesisoutputformat
 */

exports.textToSpeech = async function (args) {
    let fs = require("fs"),
        path = require("path"),
        thread = require("child_process"),
        base_path = process.cwd(),
        is_rate = args.rate && +args.rate !== 0,
        ssml = [
            `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">`,
            `<voice name="${args.model}">`,
            is_rate ? `<prosody rate="${args.rate > 0 ? "+" : ""}${+args.rate}%">` : "",
            `<break time="800ms" />${args.text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;")
                .replace(/\[([^\]]+)\]/g, `<phoneme alphabet="sapi" ph="$1">`)
                .replace(/\[\]/g, `</phoneme>`)}<break time="800ms" />`,
            is_rate ? "</prosody>" : "",
            `</voice>`,
            `</speak>`
        ].join(""),
        progress;
    console.log(ssml);
    let saveLog = async function (text) {
        await fs.appendFileSync(path.join(base_path, "media/material/process_log.txt"), `${new Date().toISOString()} - ${text}\n`, "utf8");
        return text;
    };

    let execCommand = async function (command) {
        await saveLog(command);
        return await thread.execSync(command);
    };

    console.log(`TTS参数: ${JSON.stringify(args)}`);

    let sdk = require("microsoft-cognitiveservices-speech-sdk"),
        speech_config = sdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY, process.env.AZURE_SPEECH_REGION),
        audio_config = sdk.AudioConfig.fromDefaultSpeakerOutput();

    try {
        speech_config.setProperty(sdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary, "true");
        speech_config.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3;
        let speech_synthesizer = new sdk.SpeechSynthesizer(speech_config, audio_config);

        progress = saveLog(`通过api生成语音：${args.model} => ${args.text}`);
        let result = await new Promise((resolve, reject) => {
            speech_synthesizer.speakSsmlAsync(
                ssml,
                (result) => {
                    result.reason === sdk.ResultReason.SynthesizingAudioCompleted
                        ? resolve(Buffer.from(result.audioData))
                        : reject({ error: result.errorDetails });
                    speech_synthesizer.close();
                },
                (error) => {
                    speech_synthesizer.close();
                    reject({ error });
                }
            );
        });

        process.chdir("media/material/audio");

        progress = saveLog(`保存文件：${args.basename}.mp3`);
        await fs.writeFileSync(`${args.basename}.mp3`, result); // 写临时文件

        progress = saveLog(`修正静音，输出成：${args.basename}.m4a`);
        await execCommand(
            [
                `ffmpeg -i "${args.basename}.mp3"`,
                `-filter_complex`,
                [
                    `"`,
                    `silenceremove=`, // 删除静音
                    `start_periods=1:`,
                    `start_duration=0:`,
                    `start_threshold=-80dB:`, // 小于最大音量-80dB的才算静音
                    `start_silence=0.8:`, // 头上保留0.8秒静音
                    `detection=peak,`,
                    `areverse,`, // 反过来，因为从后面剪音频有问题
                    `silenceremove=`, // 删除静音
                    `start_periods=1:`,
                    `start_duration=0:`,
                    `start_threshold=-80dB:`,
                    `start_silence=0.8:`,
                    `detection=peak,`,
                    `areverse`, // 反回来
                    `"`
                ].join(""),
                `-c:a aac -b:a 128k -ar 44100 -ac 2`,
                `-v quiet -y "${args.basename}.m4a"`
            ].join(" ")
        );

        progress = saveLog(`删除mp3源文件：${args.basename}.mp3`);
        await fs.unlinkSync(`${args.basename}.mp3`);

        process.chdir(base_path);
        return { result: "success", filename: `${args.basename}.m4a` };
    } catch (error) {
        return { result: "failed", progress, data: error };
    }
};
