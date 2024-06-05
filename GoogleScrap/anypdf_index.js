const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  const searchGoogle = async () => {
    try {
      const searchTerm = 'global network maps filetype:pdf';
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      await page.waitForSelector('h3');

      const results = await page.evaluate(() => {
        const searchResults = [];
        const items = document.querySelectorAll('div.g');
        let count = 0;

        items.forEach((item) => {
          if (count < 10) {  // Limit to the top 10 results
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

  const allPdfLinks = await searchGoogle();
  console.log('PDF links:', allPdfLinks);

  const networkPdfsDir = path.join(__dirname, 'scraped_network_pdfs');
  if (!fs.existsSync(networkPdfsDir)) {
    fs.mkdirSync(networkPdfsDir);
  }

  for (const result of allPdfLinks) {
    const filename = path.basename(result.link);
    const filepath = path.join(networkPdfsDir, filename);
    try {
      await downloadPdf(result.link, filepath);
      console.log(`Downloaded: ${filename}`);
    } catch (error) {
      console.error(`Failed to download ${filename}:`, error);
    }
  }

  await browser.close();
})();
