let cheerio = require("cheerio");
let x = require("xtool.js");
let dict = require("./ref.js");
let list = require("./list.js");
let result = [];
(async function () {
    async function getHTML(url) {
        let ret = await fetch(url);
        return await ret.text();
    }

    async function cllect(word) {
        result.push(`w - ${word}`);
        if (dict[word]) {
            let ret = await getHTML(dict[word]);
            let $ = await cheerio.load(ret);
            let doma = $("#student div");
            for (let j = 0; j < 10; j++) {
                let txt = doma.eq(j).text();
                if (!txt.match(/造 句|adsbygoogle/)) {
                    result.push(`s - ${txt}`);
                }
            }
            if (doma.length <= 12) {
                doma = $("#all div");
                for (let j = 0; j < 10; j++) {
                    let txt = doma.eq(j).text();
                    if (!txt.match(/造 句|adsbygoogle/)) {
                        result.push(`s - ${txt}`);
                    }
                }
            }
        } else {
            result.push(``);
            result.push(``);
        }
    }
    //用for遍历list
    for (let i = 0; i < list.length; i++) {
        for (let word of list[i]) {
            await cllect(word);
        }
        x.saveFile(`hsk${i + 1}.txt`, result.join("\n"));
    }
})();
