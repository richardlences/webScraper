import { spawn } from "child_process";
import { readFileSync, writeFileSync } from "fs";

const threads = 20;

async function getUrls() {
    writeFileSync("urlsWithPage.txt", "", "utf-8");
    writeFileSync("using.txt", readFileSync("urls.txt", "utf-8"));
    const promises = [];
    for (let i = 0; i < threads; i++) {
        const child = spawn("ts-node", ["./getUrls.ts", i.toString(), threads.toString()]);
        child.stdout.on("data", data => console.log(data.toString().trim()));
        promises.push(new Promise((resolve) => {
            child.on('close', resolve);
        }));
    }
    await Promise.all(promises);
}

async function scrape() {
    writeFileSync("using.txt", readFileSync("failed.txt", "utf-8"));
    for (let i = 0; i < threads; i++) {
        const child = spawn("ts-node", ["./scraper.ts", i.toString(), threads.toString()]);
        child.stdout.on("data", data => console.log(data.toString().trim()));
    }
}

async function main() {
    writeFileSync("failed.txt", "", "utf-8");
    // await getUrls();
    // console.log("URLS DONE");
    scrape();
}

main();