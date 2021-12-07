const fs = require("fs");
const dotenv = require("dotenv");
const puppeteer = require("puppeteer");

process.on("uncaughtException", (err) => {
  console.log("Shutting down the server and application");
  console.log(err.name, err.message);
  console.log(err);
  process.exit(1);
});

dotenv.config({
  path: `./config.env`,
});
console.log(process.env.NODE_ENV);

const database = require("./database");
const ArticleModel = require(`./${process.argv[2]}ArticleModel`);

const articleUrlArr = JSON.parse(
  fs.readFileSync(`./articleURLs/${process.argv[2]}ArticleURLs.json`, "utf8")
);

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

const extractArticle = async (url, browser) => {
  try {
    const newPage = await browser.newPage();
    await newPage.goto(url, {
      timeout: 0,
      waitUntil: "networkidle2",
    });
    console.log("the page has been loaded");
    // here, we must make sure to scroll the page upto bottom in order to load the whole page with the images
    await newPage.evaluate(scrollToBottom);
    console.log("the page has scorlled down to its maximum extent");

    const articleDetails = {};
    // articleDetails.title = await newPage.$(".inner-main-title");
    articleDetails.url = url;
    articleDetails.title = await newPage.$eval(
      ".inner-main-title",
      (el) => el.innerText
    );
    articleDetails.subText = await newPage.$eval(
      ".inner-copy",
      (el) => el.innerText
    );
    articleDetails.imageUrl = await newPage.$eval(
      ".article-img > img",
      (el) => el.src
    );
    articleDetails.content = await newPage.$eval(
      ".article-full-content",
      (div) => {
        const pEle = Array.from(div.querySelectorAll("p"));
        return pEle.map((p) => p.innerText).join(" ");
      }
    );
    articleDetails.author = await newPage.$eval(
      ".article-by",
      (el) => el.innerText
    );
    articleDetails.publishDate = await newPage.$eval(
      ".author-info > span",
      (el) => el.innerText
    );
    articleDetails.tags = await newPage.$eval(".tags-list", (list) => {
      const tagsArr = [];
      list.querySelectorAll("li > a").forEach((textEle) => {
        console.log(textEle.innerText);
        tagsArr.push({ title: textEle.innerText, url: textEle.href });
      });
      return tagsArr;
    });
    articleDetails.relatedArticleURLs = await newPage.$eval(
      ".main-content",
      (el) => {
        const articleURLs = [];
        el.querySelectorAll(".big-thumb > a").forEach((article) =>{
        console.log(article);
        articleURLs.push(article.href);
        
      });
      return articleURLs;
      }
    );
    console.log(articleDetails);
    await newPage.close();
    return articleDetails;
  } catch (err) {
    console.log(err);
  }
};

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
    console.log(articleUrlArr);

   

    for(let i=0;i<articleUrlArr.length;i++){
      
        const check = await ArticleModel.findOne({ url: articleUrlArr[i] });
      if (check) {
        continue;
        console.log('the article',i+1,' is already present ');
      }
      console.log('scraping the article', i+1);
        const articleDetails = await extractArticle(articleUrlArr[i], browser);
        const savedArticle = await ArticleModel.create(articleDetails);
        if(savedArticle){
          console.log('the article', i+1, 'is saved');
        }
        else {
          continue;
        }
    }
  } catch (err) {
    console.log(err);
  }
};

mainFunction();
// Handling Unhandled Rejections
process.on("unhandledRejection", (err) => {
  console.log("Shutting down the server");
  console.log(err.name, err.message);
  console.log(err);
  //   server.close(() => {
  //     console.log("Shutting down the application");
  //     process.exit(1);
  //   });
});

// Handling Sigterm signals
process.on("SIGTERM", () => {
  console.log("SIGTERM recieved");
  //   server.close(() => {
  //     console.log("Terminating the application");
  //   });
});
