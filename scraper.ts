import axios from "axios";
import { load } from "cheerio";
import { Client } from "pg";
import { readFileSync, appendFileSync } from "fs";
import "dotenv/config";

type Product = {
    Name: String,
    Price: Number,
    Type: String,
}

const client = new Client();

async function main() {
    const file = readFileSync("urlsWithPage.txt", "utf-8").split("\n");
    const products: Product[] = [];
    for (let i = 0; i < 5; i++) {
        try {
            const site = file[i];
            const $ = load((await axios.get(site)).data);
            const productsHTML = $(".product-box--main");
            for (const productHTML of productsHTML) {
                const name = $(productHTML).find("h3").first().text();
                const price = $(productHTML).find(".product-box__price-bundle strong").first().text().replace(/\u00a0/g, "").replace(/,/, ".");
                const productType = $(productHTML).find(".product-box__parameters").first().text().split(", ").at(0) || "unknown";
                const product: Product = {
                    Name: name.trim(),
                    Price: parseFloat(price),
                    Type: productType.trim()
                }
                products.push(product);
            }
            console.log(i);
        } catch (error) {
            appendFileSync("failed.txt", file[i] + "\n", "utf-8");
        }
    }
    await writeToDB(products);
}

async function writeToDB(products: Product[]) {
    try {
        await client.connect();
        for (const product of products) {
            await client.query("INSERT INTO products (name, price, type) VALUES ($1, $2, $3) on conflict (name) do nothing", Object.values(product));
        }
        await client.end()
    } catch (error) {
        console.error(error);
    }
}

main();