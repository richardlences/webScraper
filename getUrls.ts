import axios from "axios";
import { load } from "cheerio";
import { readFileSync, appendFileSync } from "fs";

async function main() {
    const file = readFileSync("using.txt", "utf-8").split("\n").filter(url => url !== "");
    const num = parseInt(process.argv[2]);
    const threads = parseInt(process.argv[3]);
    for (let i = num; i < file.length; i += threads) {
        try {
            const url = file[i];
            const $ = load((await axios.get(url)).data);
            const pagination = $(".pagination");
            if (pagination.length === 0) {
                appendFileSync("urlsWithPage.txt", url + "\n");
            } else {
                const numPages = parseInt(pagination.find("li").eq(-2).text());
                for (let j = 1; j <= numPages; j++) {
                    appendFileSync("urlsWithPage.txt", `${url}?page=${j}\n`);
                }
            }
            console.log(i);
        } catch (err) {
            appendFileSync("failed.txt", file[i] + "\n");
            console.log("error");
        }
    }
}

main();