import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const repoRoot = process.cwd();
const htmlPath = path.resolve(repoRoot, "Horizons", "A1", "Student's Book.html");
const pdfPath = path.resolve(repoRoot, "Horizons", "A1", "Student's Book.pdf");

function findChrome() {
  const candidates = [
    process.env.CHROME,
    process.env.CHROME_PATH,
    process.platform === "win32" ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : null,
    process.platform === "win32" ? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" : null,
    process.platform === "win32" ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" : null,
    process.platform === "win32" ? "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe" : null,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate));
}

const chromePath = findChrome();
if (!chromePath) throw new Error("No Chromium-compatible browser is available on the runner.");

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: [
    "--disable-gpu",
    "--allow-file-access-from-files",
    ...(process.platform === "linux" ? ["--no-sandbox"] : [])
  ]
});

try {
  const page = await browser.newPage();

  // Match the 96 CSS px/in physical mapping used by Chromium on Windows.
  // A4 = 793.70 x 1122.52 CSS px at 96 dpi.
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
  await page.emulateMediaType("print");

  // Wait until native fonts and raster assets have completely settled before
  // asking Chromium to lay out the print tree. This is critical for exact
  // line wrapping, weight interpolation and vertical metrics.
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;

    const images = [...document.images];
    await Promise.all(images.map(async (image) => {
      if (image.complete) {
        try { await image.decode(); } catch {}
        return;
      }
      await new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
      try { await image.decode(); } catch {}
    }));

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });

  await page.addStyleTag({ content: `
    @page {
      size: 210mm 297mm !important;
      margin: 0 !important;
    }

    @media print {
      html,
      body,
      body.hz-book,
      #hz-book {
        width: 210mm !important;
        min-width: 210mm !important;
        max-width: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
        zoom: 1 !important;
        transform: none !important;
      }

      #hz-book { display: block !important; }

      .hz-page {
        box-sizing: border-box !important;
        width: 210mm !important;
        min-width: 210mm !important;
        max-width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        zoom: 1 !important;
        transform: none !important;
        box-shadow: none !important;
        break-after: page !important;
        page-break-after: always !important;
      }

      .hz-page:last-child {
        break-after: auto !important;
        page-break-after: auto !important;
      }

      .hz-pdf-button { display: none !important; }
    }
  ` });

  const typography = await page.evaluate(() => {
    const selectors = [
      ".hz-content",
      ".hz-lesson-title",
      ".hz-exercise__instruction",
      ".hz-page-number",
      ".hz-new-words"
    ];

    return selectors.flatMap((selector) => {
      const element = document.querySelector(selector);
      if (!element) return [];
      const style = getComputedStyle(element);
      return [{
        selector,
        family: style.fontFamily,
        weight: style.fontWeight,
        size: style.fontSize,
        style: style.fontStyle,
        lineHeight: style.lineHeight
      }];
    });
  });

  console.log("Windows PDF typography snapshot:");
  for (const row of typography) {
    console.log(`${row.selector}: ${row.family}; weight=${row.weight}; size=${row.size}; style=${row.style}; line-height=${row.lineHeight}`);
  }

  await page.pdf({
    path: pdfPath,
    width: "210mm",
    height: "297mm",
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    printBackground: true,
    preferCSSPageSize: true,
    scale: 1,
    displayHeaderFooter: false
  });
} finally {
  await browser.close();
}

if (!fs.existsSync(pdfPath) || fs.statSync(pdfPath).size === 0) {
  throw new Error("Student's Book PDF was not generated.");
}

console.log(`Built ${path.relative(repoRoot, pdfPath)} using ${chromePath}`);
