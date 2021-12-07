// This js file is responsible for extracting the article of each of the URL from the website 'First Post'
// The code written is generalized to accomodate the web scraping the articles from various categories of the website
const fs = require("fs");
const dotenv = require("dotenv");
const puppeteer = require("puppeteer");

// Error Handling 
process.on("uncaughtException", (err) => {
  console.log("Shutting down the server and application");
  console.log(err.name, err.message);
  console.log(err);
  process.exit(1);
});


// middleware to handle env variables
dotenv.config({
  path: `./config.env`,
});


const database = require("./database");
// The article model is required based on the input argument i.e category of the articles
const ArticleModel = require(`./${process.argv[2]}ArticleModel`);

const articleUrlArr = JSON.parse(
  fs.readFileSync(`./articleURLs/${process.argv[2]}ArticleURLs.json`, "utf8")
);

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

// This Function is responsible for extracting the article from the respective url 
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
    await newPage.close();
    return articleDetails;
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
