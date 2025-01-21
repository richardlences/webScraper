import axios from "axios";
import { load } from "cheerio";
import { readFileSync, appendFileSync, writeFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Product = {
    Name: string,
    Price: number,
    Type: string,
}

async function main() {
    const file = readFileSync("using.txt", "utf-8").split("\n").filter(url => url !== "");
    const num = parseInt(process.argv[2]);
    const threads = parseInt(process.argv[3]);
    const products: Product[] = [];
    for (let i = num; i < file.length; i += threads) {
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
        } catch (err) {
            console.log("ERROR");
            appendFileSync("failed.txt", file[i] + "\n")
        }
    }
    await writeToDB(products);
}

async function writeToDB(products: Product[]) {
    for (const product of products) {
        try {
            await prisma.products.create({
                data: {
                    name: product.Name,
                    price: product.Price,
                    type: product.Type
                }
            })
        } catch (err) {
            console.log(err);
        }
    }
}

main();