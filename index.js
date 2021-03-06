const express = require("express");
const axios = require("axios");
const handlebars = require('handlebars');
const puppeteer = require("puppeteer");
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 5000;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/certificado", async (request, response) => {
    const { name, course, organization, dateConclusion, hours } = request.body.data;
    const { template } = request.body;

    const htmlTemplate = await axios
        .get(template)
        .then((response) => {
            return response.data;
        });

    const handlebarsTemplate = handlebars.compile(htmlTemplate);
    const certificate = handlebarsTemplate({ name, course, organization, dateConclusion, hours });

    const browser = await puppeteer.launch({ headless: true,  args: ["--no-sandbox", "--disable-setuid-sandbox"] });

    const page = await browser.newPage();
    await page.setContent(certificate);

    const pdf = await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true
    });

    await browser.close();

    response.header("content-type", "application/pdf; charset=utf-8");
    response.header("Content-Disposition", `attachment; filename="Certificate_${name}_${course}.pdf"`);
    return response.send(pdf);
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));