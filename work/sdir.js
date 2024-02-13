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
            let doma = $("#copy_content li");
            for (let j = 0; j < doma.length; j++) {
                let txt = doma.eq(j).text();
                result.push(`s - ${txt}`);
            }
        }
    }
    //用for遍历list
    for (let word of list) {
        await cllect(word);
    }
    x.saveFile(`hsk.txt`, result.join("\n"));
})();
