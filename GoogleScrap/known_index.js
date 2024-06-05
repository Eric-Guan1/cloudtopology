const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  const searchGoogle = async (searchTerm) => {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      await page.waitForSelector('h3');

      const results = await page.evaluate(() => {
        const searchResults = [];
        const items = document.querySelectorAll('div.g');
        let count = 0;

        items.forEach((item) => {
          if (count < 3) {  // Limit to the top 3 results
            const linkElement = item.querySelector('a');
            if (linkElement && linkElement.href.endsWith('.pdf')) {
              const titleElement = item.querySelector('h3');
              if (titleElement) {
                const title = titleElement.innerText;
                const link = linkElement.href;
                searchResults.push({ title, link });
              }
            }
            count++;
          }
        });
        return searchResults;
      });

      return results;
    } catch (error) {
      console.error('Error during search:', error);
      return [];
    }
  };

  const downloadPdf = async (url, filepath) => {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filepath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  };

  const searchTerms = [
    'Level 3 Network Map', 
    'AT&T global network map', 
    'Hurricane Electric Network Map', 
    'PCCW Network Map', 
    'Telia Network Map', 
    'Telxius Network Map', 
    'Verizon global Network Map',
    'Vodafone global infrastructure'
  ];

  const allPdfLinks = [];

  for (const term of searchTerms) {
    const results = await searchGoogle(term);
    console.log(`PDF links for "${term}":`, results);
    results.forEach(result => {
      allPdfLinks.push(result.link);
    });
  }

  console.log('All PDF links:', allPdfLinks);

  const networkPdfsDir = path.join(__dirname, 'known_network_pdfs');
  if (!fs.existsSync(networkPdfsDir)) {
    fs.mkdirSync(networkPdfsDir);
  }

  for (const link of allPdfLinks) {
    const filename = path.basename(link);
    const filepath = path.join(networkPdfsDir, filename);
    try {
      await downloadPdf(link, filepath);
      console.log(`Downloaded: ${filename}`);
    } catch (error) {
      console.error(`Failed to download ${filename}:`, error);
    }
  }

  await browser.close();
})();
