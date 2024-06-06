const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pdf = require('pdf-parse');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  const searchGoogle = async () => {
    try {
      const searchTerm = 'global network maps filetype:pdf';
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });

      const results = [];

      // Function to extract PDF links from the current page
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

      // Extract results from the first page
      await extractResults();

      // Navigate to subsequent pages and extract results
      let nextPageExists = true;
      while (results.length < 40 && nextPageExists) {
        const nextPageButton = await page.$('a#pnnext');
        if (nextPageButton) {
          await nextPageButton.click();
          await page.waitForSelector('h3', { waitUntil: 'networkidle2' });
          await extractResults();
        } else {
          nextPageExists = false;
        }
      }

      // Limit the results to the top 40
      return results.slice(0, 40);
    } catch (error) {
      console.error('Error during search:', error);
      return [];
    }
  };

  const checkIfSinglePagePdf = async (url) => {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const data = await pdf(response.data);
      return data.numpages === 1;
    } catch (error) {
      console.error(`Failed to check PDF pages for ${url}:`, error.message);
      return false;
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

  const networkPdfsDir = path.join(__dirname, 'scraped_onepage_pdfs');
  if (!fs.existsSync(networkPdfsDir)) {
    fs.mkdirSync(networkPdfsDir);
  }

  for (const result of allPdfLinks) {
    const filename = path.basename(result.link);
    const filepath = path.join(networkPdfsDir, filename);

    // Skip downloading if the file already exists
    if (fs.existsSync(filepath)) {
      console.log(`Skipped: ${filename} (already downloaded)`);
      continue;
    }

    const isSinglePage = await checkIfSinglePagePdf(result.link);
    if (isSinglePage) {
      try {
        await downloadPdf(result.link, filepath);
        console.log(`Downloaded: ${filename}`);
      } catch (error) {
        console.error(`Failed to download ${filename}:`, error);
      }
    } else {
      console.log(`Skipped: ${result.link} (not a single-page PDF or could not be processed)`);
    }
  }

  await browser.close();
})();
