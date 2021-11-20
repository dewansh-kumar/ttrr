// node instagram.js --data="person.json" --info="info.json" --username="dewansh kumar"
// npm install minimist
// npm install puppeteer

let mainUrl = 'https://www.instagram.com';
let minimist = require("minimist");
let puppeteer = require("puppeteer");
let args = minimist(process .argv);
let fs = require("fs");
const { url } = require("inspector");

let detailObj = [];
let infoString = fs.readFileSync(args.info, "utf-8");
  let info = JSON.parse(infoString);
async function run(){
  let browser = await puppeteer.launch({
    headless : false,
    defaultViewport : null,
    args:[
      '--start-maximized' 
   ]
  });
  let pages = await browser.pages();
  let page = pages[0];
  await page.goto(mainUrl);
  await page.waitFor(3000);
  await page.type("input[type='text']", info.email);
  await page.type("input[type='password']", info.password);
  await page.click("button[type='submit']");

  await page.waitForSelector(".cmbtv", {visible : true});
  await page.click(".cmbtv");

  await page.waitForSelector("svg[aria-label='Home']", {visible : true});
  await page.click("svg[aria-label='Home']");

  await page.waitForSelector(".HoLwm", {visible : true});
  await page.click(".HoLwm ");
   await page.waitFor(1000);
  // await page.waitForSelector("input[type='text']", {visible : true});
  await page.type("input[type='text']", args.username);
  // await page.waitFor(2000);
  // await page.keyboard.press("Enter");

await page.waitForSelector("a.-qQT3");
 await page.waitForSelector("a.-qQT3");
  let users = await page.$$eval("a.-qQT3", function(userUrl){
    let urls = [];
    for(let i = 0; i < userUrl.length; i++){
      let url = userUrl[i].getAttribute("href");
      urls.push(url);
    }
    return urls;
  })
 
  //click on url of each user
   for(let i = 0; i < 2; i++){
     await goToUserProfile(users[i], browser, page);
   }

  //  console.log(detailObj);
  let strOfDetailObj = JSON.stringify(detailObj);
  fs.writeFileSync("detail.json", strOfDetailObj);
};
run();
  


async function goToUserProfile(url, browser, page){
  let npage = await browser.newPage();
  await npage.bringToFront();
  await npage.goto(mainUrl + url);

  await npage.waitForSelector(".nZSzR > h2");
  let userName = await npage.$eval(".nZSzR > h2", function(name){
    return name.textContent;
  })
  
  // console.log(userName);

  await npage.waitForSelector(".-vDIg h1");
let name = await npage.$eval(".-vDIg h1", function(name){
   return name.textContent;
})

  await npage.waitForSelector(".g47SY");
  let pff = await npage.$$eval(".g47SY", function(con){
    let conArr = [];
    for(let i = 0; i < con.length; i++){
        conArr.push(con[i].textContent);
    }
    return conArr;
  })
  // console.log(pff);

  let pa = pff[0].split(",");
  let nop = "";
   for(let i = 0; i < pa.length; i++){
     nop += pa[i];
   } 

 let obj = {
   userName : userName,
   name : name,
   post : pff[0],
   followers : pff[1],
   following : pff[2],
   postInfo :[]
 }
 detailObj.push(obj);

 await postDetail(npage, parseInt(nop), page, browser);
}


async function postDetail(npage, nop, page, browser){
  // console.log(nop);
  let urls = await noOfPost(npage);
    while(nop - urls.length > 2){
     await npage.evaluate(function() {
        window.scrollBy(0, window.innerHeight);
    });
    
    urls = await noOfPost(npage);
  }
for(let i = 0; i < 2; i++){
  await goToPost(npage, browser,urls[i]);
}
  // console.log(urls.length);

  await npage.waitFor(4000);
  await npage.close();
  await page.waitFor(2000);
}

async function noOfPost(npage){
   await npage.waitForSelector(".v1Nh3 a");
   let posts = await npage.$$eval(".v1Nh3 a", function(cposts){
     let urls = [];

     for(let i = 0; i < cposts.length; i++){
       urls.push(cposts[i].getAttribute("href"));
     }
     return urls;
   })
  return posts;
}

async function goToPost(page, browser, url){

  let npage = await browser.newPage();
  await npage.goto(mainUrl + url);

  await npage.waitForSelector(".EDfFK > div");
 let likes = await npage.$eval(".EDfFK >div", function(noOfLikes){
    return noOfLikes.textContent;
  });

  let postDate = await npage.$eval(".c-Yi7 time", function(date){
    return date.textContent;
  });

  let obj = {
    likes : likes,
    time : postDate
  }

  detailObj[detailObj.length - 1].postInfo.push(obj);

 await npage.close(); 
await page.waitFor(1000);

}