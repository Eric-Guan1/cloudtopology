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

      const results = [];

      const extractResults = async () => {
        const searchResults = await page.evaluate(() => {
          const items = document.querySelectorAll('div.g');
          const links = [];
          items.forEach((item) => {
            const linkElement = item.querySelector('a');
            if (linkElement && linkElement.href.endsWith('.pdf')) {
              const titleElement = item.querySelector('h3');
              if (titleElement) {
                const title = titleElement.innerText;
                const link = linkElement.href;
                links.push({ title, link });
              }
            }
          });
          return links;
        });
        results.push(...searchResults);
      };

      await extractResults();

      let nextPageExists = true;
      let pageCounter = 1;
      while (results.length < 300 && nextPageExists) {
        const nextPageButton = await page.$('a#pnnext');
        const moreResultsButton = await page.$('h3 div.GNJvt.ipz2Oe span.RVQdVd');
        if (nextPageButton || moreResultsButton) {
          if (nextPageButton) {
            await nextPageButton.click();
          } else if (moreResultsButton) {
            await moreResultsButton.click();
          }
          await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000)); // Random delay to avoid bot detection
          await extractResults();
          pageCounter++;
        } else {
          nextPageExists = false;
        }
      }

      return results.slice(0, 300);
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

  const searchTerm = 'points of presence network map filetype:pdf';
  const allPdfLinks = await searchGoogle(searchTerm);

  console.log('PDF links:', allPdfLinks);

  const networkPdfsDir = path.join(__dirname, 'scraped_network_pdfs');
  if (!fs.existsSync(networkPdfsDir)) {
    fs.mkdirSync(networkPdfsDir);
  }

  const uniquePdfLinks = Array.from(new Set(allPdfLinks.map(link => link.link))).map(link => allPdfLinks.find(l => l.link === link));
  for (const result of uniquePdfLinks) {
    const filename = path.basename(result.link);
    const filepath = path.join(networkPdfsDir, filename);

    if (fs.existsSync(filepath)) {
      console.log(`Skipped: ${filename} (already downloaded)`);
      continue;
    }

    try {
      await downloadPdf(result.link, filepath);
      console.log(`Downloaded: ${filename}`);
    } catch (error) {
      console.error(`Failed to download ${filename}:`, error);
    }
  }

  await browser.close();
})();
