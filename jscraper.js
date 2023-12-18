const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  //Страницу сюда
  await page.goto('https://www.dns-shop.ru/catalog/17a8d26216404e77/vstraivaemye-xolodilniki/', { waitUntil: 'networkidle2' });

  let products = [];
  let hasMoreProducts = false;

  do {
    const productDetails = await page.$$eval('.products-list .catalog-product', (elements) => {

      //Элементы страницы сюда  
      return elements.map((element) => {
        const titleElement = element.querySelector('.catalog-product__name');
        const priceElement = element.querySelector('.product-buy__price');
        const title = titleElement ? titleElement.textContent : 'Not Found';
        const price = priceElement ? priceElement.textContent : 'Not Found';
        return { title, price };
      });
    });

    products = [...products, ...productDetails];
    //ВАЖНО! Страницы скрипт загружает через Showmorebutton а не через next page.
    const showMoreButton = await page.$('button.pagination-widget__show-more-btn')

    if (showMoreButton !== null) {
      hasMoreProducts = true;
      await Promise.all([
        showMoreButton.click(),
        page.waitForResponse(response => response.url().includes('?p=') && response.status() === 200),
        page.waitForTimeout(100),
      ]);
    } else {
      hasMoreProducts = false;
    }
  } while (hasMoreProducts);

  const csvWriter = createCsvWriter({
    path: 'products.csv',
    header: [
      { id: 'title', title: 'TITLE' },
      { id: 'price', title: 'PRICE' },
    ],
  });

  await csvWriter.writeRecords(products);
  await browser.close();
}

run();
