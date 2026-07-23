import { webkit } from 'playwright';

const appUrl=process.env.APP_URL||'https://soutarounaka1016-max.github.io/munakata.now/';
const attempts=Number(process.env.APP_SMOKE_ATTEMPTS||10);
const retryDelayMs=Number(process.env.APP_SMOKE_RETRY_MS||15000);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function runAttempt(browser,attempt){
  const context=await browser.newContext({
    viewport:{width:1180,height:820},
    locale:'ja-JP',
    timezoneId:'Asia/Tokyo',
    serviceWorkers:'block'
  });
  const page=await context.newPage();
  const consoleMessages=[];
  page.on('console',message=>consoleMessages.push(`${message.type()}: ${message.text()}`));
  page.on('pageerror',error=>consoleMessages.push(`pageerror: ${error.message}`));
  try{
    const url=`${appUrl}${appUrl.includes('?')?'&':'?'}e2e=${Date.now()}-${attempt}`;
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#ai-recommender',{state:'visible',timeout:60000});
    await page.waitForFunction(()=>document.querySelector('.ai-mode')?.textContent?.includes('AI接続可能'),null,{timeout:30000});

    await page.selectOption('select[name="company"]','family');
    await page.selectOption('select[name="time"]','half');
    await page.selectOption('select[name="interest"]','event');
    await page.selectOption('select[name="weather"]','indoor');
    await page.selectOption('select[name="limited"]','yes');
    await page.click('#ai-recommender button[type="submit"]');

    await page.waitForFunction(()=>document.querySelector('.ai-status')?.textContent?.includes('AIが掲載中の情報から選びました。'),null,{timeout:65000});
    const cards=await page.locator('#ai-recommender .ai-card').count();
    if(cards<1)throw new Error('AI recommendation cards were not rendered');
    const mode=(await page.locator('.ai-mode').textContent())?.trim();
    const status=(await page.locator('.ai-status').textContent())?.trim();
    const firstTitle=(await page.locator('#ai-recommender .ai-card h3').first().textContent())?.trim();
    const firstReason=(await page.locator('#ai-recommender .ai-card .ai-reason').first().textContent())?.trim();
    if(!firstReason)throw new Error('AI recommendation reason was empty');
    console.log('Public app AI smoke test passed:',JSON.stringify({attempt,mode,status,cards,firstTitle,firstReason,consoleMessages}));
    return true;
  }catch(error){
    const mode=await page.locator('.ai-mode').textContent().catch(()=>null);
    const status=await page.locator('.ai-status').textContent().catch(()=>null);
    console.warn('Public app AI smoke attempt failed:',JSON.stringify({attempt,error:error.message,mode,status,consoleMessages}));
    return false;
  }finally{
    await context.close();
  }
}

const browser=await webkit.launch({headless:true});
let passed=false;
try{
  for(let attempt=1;attempt<=attempts;attempt+=1){
    console.log(`Public app AI smoke attempt ${attempt}/${attempts}`);
    if(await runAttempt(browser,attempt)){passed=true;break}
    if(attempt<attempts)await sleep(retryDelayMs);
  }
}finally{
  await browser.close();
}
if(!passed)throw new Error('Public app never displayed an AI recommendation');
