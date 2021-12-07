// This js file is responsible for extracting the URLs of each of the articles from the website 'First Post'
// The code written is generalized to accomodate the web scraping the articles from various categories of the website

// Core Packages
const fs = require("fs");
// NPM Packages
const puppeteer = require("puppeteer");

// This function makes the page instance to scroll down to its max extent, loading all the 'Lazy-Loading' images of the website
async function scrollToBottom() {
  await new Promise((resolve) => {
    const distance = 100; // should be less than or equal to window.innerHeight
    const delay = 100;
    const timer = setInterval(() => {
      document.scrollingElement.scrollBy(0, distance);
      if (
        document.scrollingElement.scrollTop + window.innerHeight >=
        document.scrollingElement.scrollHeight
      ) {
        console.log("scrolling is done");
        clearInterval(timer);
        resolve();
      }
    }, delay);
  });
}


// This Function is responsible for extracting the URLs from the respective categories based on the base URL 
const pageURLScraper = async (browser, url) => {
  try {
    const newPage = await browser.newPage();
    await newPage.goto(url, {
      timeout: 0,
      waitUntil: "networkidle2",
    });
    // console.log("the page has been loaded");
    // here, we must make sure to scroll the page upto bottom in order to load the whole page with the images
    await newPage.evaluate(scrollToBottom);
    // console.log("the page has scorlled down to its maximum extent");

    const articlesArrForThisPage = await newPage.$$eval(
      ".big-thumb > a",
      (articleDivArr) => {
        return articleDivArr.map((article) => article.href);
      }
    );
    // console.log(articlesArrForThisPage);
    return articlesArrForThisPage;
  } catch (err) {
    console.log(err);
  }
};


// This is the main function responsible for initiating the script, contains the top level code
const mainFunction = async () => {
  try {
    // Launch the chromeless browser and go to the respective url
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null, //Defaults to an 800x600 viewport
      executablePath:
        "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      //by default puppeteer runs Chromium buddled with puppeteer
      args: ["--start-maximized"],
    });

    // The number of pages to be scrapped, This is taken as input from the user
    const numberOfPagesToBeScraped = process.argv[3];
    let allArticlesURLArr = [];
    // The category of articles to be scraped, is also taken from the user
    for (let i = 0; i < numberOfPagesToBeScraped; i++) {
      let URL = `https://www.firstpost.com/category/${process.argv[2]}/page/${
        i + 1
      }`;
      const currentPageArticles = await pageURLScraper(browser, URL);
      // To check if there was any problem in extracting the URLs of a particular page
      if (currentPageArticles) {
        allArticlesURLArr = allArticlesURLArr.concat(currentPageArticles);
      }
    }
    // Save all the URLs extracted to a JSON file 
    fs.writeFileSync(
      `./articleURLs/${process.argv[2]}ArticleURLs.json`,
      JSON.stringify(allArticlesURLArr)
    );

    await browser.close();
  } catch (err) {
    console.log(err);
  }
};

mainFunction();
