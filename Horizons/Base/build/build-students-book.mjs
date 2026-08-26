import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const a1Dir = path.join(repoRoot, "Horizons", "A1");
const lessonsDir = path.join(a1Dir, "Lessons");
const outputPath = path.join(a1Dir, "Student's Book.html");

const lessonPattern = /^\d+[A-Z]\.html$/i;
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const cssCache = new Map();
const installedStylesheets = new Set();

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function attrValue(tag, name) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match ? match[2] : "";
}

function cleanLocalHref(href) {
  return decodeURIComponent(href.split("#")[0].split("?")[0]);
}

function rewriteCssAssetUrls(css, stylesheetPath) {
  return css.replace(/url\(\s*(["']?)(.*?)\1\s*\)/gi, (match, quote, rawValue) => {
    const value = rawValue.trim();
    if (!value || /^(?:data:|blob:|https?:|#)/i.test(value)) return match;

    const absoluteAsset = path.resolve(path.dirname(stylesheetPath), cleanLocalHref(value));
    let relativeAsset = path.relative(a1Dir, absoluteAsset).replaceAll(path.sep, "/");
    if (!relativeAsset.startsWith(".")) relativeAsset = `./${relativeAsset}`;
    return `url("${relativeAsset}")`;
  });
}

function loadCss(cssPath, stack = []) {
  const normalized = path.normalize(cssPath);
  if (cssCache.has(normalized)) return cssCache.get(normalized);
  if (stack.includes(normalized)) {
    throw new Error(`Circular CSS import detected: ${normalized}`);
  }

  let css = readText(normalized);
  const nextStack = [...stack, normalized];
  const importPattern = /@import\s+(?:url\(\s*)?["']([^"']+)["']\s*\)?\s*([^;]*);/gi;
  const imports = [...css.matchAll(importPattern)];

  for (const match of imports) {
    const href = match[1];
    if (/^https?:/i.test(href)) continue;

    const importedPath = path.resolve(path.dirname(normalized), cleanLocalHref(href));
    let importedCss = loadCss(importedPath, nextStack);
    const mediaQuery = (match[2] || "").trim();
    if (mediaQuery) importedCss = `@media ${mediaQuery} {\n${importedCss}\n}`;
    css = css.replace(match[0], importedCss);
  }

  css = rewriteCssAssetUrls(css, normalized);
  cssCache.set(normalized, css);
  return css;
}

function extractHead(html) {
  return html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || "";
}

function extractBody(html, filename) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  if (!body) throw new Error(`${filename} has no body.`);
  return body.trim();
}

function collectHeadStyles(headHtml, lessonPath, filename) {
  const output = [];

  for (const match of headHtml.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (attrValue(tag, "rel").toLowerCase() !== "stylesheet") continue;

    const href = attrValue(tag, "href");
    if (!href || /^https?:/i.test(href)) continue;

    const stylesheetPath = path.resolve(path.dirname(lessonPath), cleanLocalHref(href));
    const media = attrValue(tag, "media").trim();
    const key = `${path.normalize(stylesheetPath)}|${media}`;
    if (installedStylesheets.has(key)) continue;
    installedStylesheets.add(key);

    let css = loadCss(stylesheetPath);
    if (media) css = `@media ${media} {\n${css}\n}`;
    output.push(`/* ${path.relative(repoRoot, stylesheetPath).replaceAll(path.sep, "/")} */\n${css}`);
  }

  let inlineIndex = 0;
  for (const match of headHtml.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi)) {
    inlineIndex += 1;
    const attrs = match[1] || "";
    const media = attrValue(attrs, "media").trim();
    let css = match[2];
    if (media) css = `@media ${media} {\n${css}\n}`;
    output.push(`/* ${filename} inline style ${inlineIndex} */\n${css}`);
  }

  return output;
}

function pdfRuntime() {
  const pdfButton = document.getElementById("hz-pdf-button");
  const book = document.getElementById("hz-book");
  const RAW_A1_ROOT = "https://raw.githubusercontent.com/Chiispiitas/Brighton/main/Horizons/A1/";
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const EXPORT_SCALE = 2.35;
  const JPEG_QUALITY = 0.97;
  const assetDataCache = new Map();

  function setExportBusy(isBusy) {
    pdfButton.disabled = isBusy;
    pdfButton.classList.toggle("is-busy", isBusy);
    pdfButton.setAttribute(
      "aria-label",
      isBusy ? "Building Student's Book PDF" : "Download Student's Book as PDF"
    );
    pdfButton.title = isBusy ? "Building PDF…" : "Download PDF";
  }

  function remoteAssetUrl(value) {
    const trimmed = value.trim();
    if (!trimmed || /^(?:data:|blob:|https?:|#)/i.test(trimmed)) return trimmed;
    return new URL(trimmed, RAW_A1_ROOT).href;
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result), { once: true });
      reader.addEventListener("error", () => reject(reader.error || new Error("Could not read export asset.")), { once: true });
      reader.readAsDataURL(blob);
    });
  }

  async function assetAsDataUrl(value) {
    const remote = remoteAssetUrl(value);
    if (!remote || /^(?:data:|blob:|#)/i.test(remote)) return remote;
    if (assetDataCache.has(remote)) return assetDataCache.get(remote);

    const pending = fetch(remote, { cache: "force-cache", mode: "cors" })
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load export asset: ${remote}`);
        return response.blob();
      })
      .then(blobToDataUrl);

    assetDataCache.set(remote, pending);
    return pending;
  }

  async function inlineCssAssets(css) {
    const pattern = /url\(\s*(["']?)(.*?)\1\s*\)/gi;
    const matches = [...css.matchAll(pattern)];
    const replacements = new Map();

    for (const match of matches) {
      const rawValue = (match[2] || "").trim();
      if (!rawValue || /^(?:data:|blob:|#)/i.test(rawValue)) continue;
      if (!replacements.has(match[0])) {
        const dataUrl = await assetAsDataUrl(rawValue);
        replacements.set(match[0], `url("${dataUrl}")`);
      }
    }

    let output = css;
    for (const [original, replacement] of replacements) {
      output = output.split(original).join(replacement);
    }
    return output;
  }

  async function collectExportCss() {
    const css = [...document.querySelectorAll("style")]
      .map((style) => style.textContent || "")
      .join("\n");
    return inlineCssAssets(css);
  }

  async function clonePageForExport(page) {
    const clone = page.cloneNode(true);

    for (const image of clone.querySelectorAll("img[src]")) {
      const src = image.getAttribute("src");
      if (src) image.setAttribute("src", await assetAsDataUrl(src));
    }

    for (const source of clone.querySelectorAll("source[src], source[srcset]")) {
      const src = source.getAttribute("src");
      if (src) source.setAttribute("src", await assetAsDataUrl(src));

      const srcset = source.getAttribute("srcset");
      if (srcset && !srcset.includes(",")) {
        source.setAttribute("srcset", await assetAsDataUrl(srcset.trim()));
      }
    }

    for (const element of clone.querySelectorAll("[style]")) {
      const style = element.getAttribute("style");
      if (style && style.includes("url(")) {
        element.setAttribute("style", await inlineCssAssets(style));
      }
    }

    clone.style.margin = "0";
    clone.style.boxShadow = "none";
    return clone;
  }

  function escapeCdata(value) {
    return value.replaceAll("]]>", "]]]]><![CDATA[>");
  }

  async function renderPage(page, exportCss) {
    const rect = page.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const clone = await clonePageForExport(page);
    const pageMarkup = new XMLSerializer().serializeToString(clone);
    const cleanupCss = `
      .hz-export-root {
        width: ${width}px;
        height: ${height}px;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: #fff;
      }
      .hz-export-root > .hz-page {
        margin: 0 !important;
        box-shadow: none !important;
      }
      .hz-pdf-button {
        display: none !important;
      }
    `;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="${width}"
           height="${height}"
           viewBox="0 0 ${width} ${height}">
        <foreignObject x="0" y="0" width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" class="hz-book hz-export-root">
            <style><![CDATA[${escapeCdata(exportCss + cleanupCss)}]]></style>
            ${pageMarkup}
          </div>
        </foreignObject>
      </svg>
    `;

    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const image = new Image();
      const loaded = new Promise((resolve, reject) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", () => reject(new Error("Could not rasterize a book page.")), { once: true });
      });
      image.src = svgUrl;
      await loaded;

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * EXPORT_SCALE));
      canvas.height = Math.max(1, Math.round(height * EXPORT_SCALE));

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas rendering is not available.");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.setTransform(EXPORT_SCALE, 0, 0, EXPORT_SCALE, 0, 0);
      context.drawImage(image, 0, 0, width, height);
      return canvas;
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  async function exportPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error("The PDF library could not be loaded. Check your internet connection and try again.");
    }

    const pages = [...book.querySelectorAll("article.hz-page")];
    if (!pages.length) throw new Error("No book pages are available to export.");

    const exportCss = await collectExportCss();
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
      putOnlyUsedFonts: true
    });

    pdf.setProperties({
      title: "Horizons A1 — Student's Book",
      subject: "Horizons A1 Student's Book",
      author: "Brighton",
      creator: "Horizons Student's Book assembler"
    });

    for (let index = 0; index < pages.length; index += 1) {
      const canvas = await renderPage(pages[index], exportCss);
      const imageData = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

      if (index > 0) pdf.addPage("a4", "portrait");
      pdf.addImage(imageData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, "FAST");

      canvas.width = 1;
      canvas.height = 1;
    }

    pdf.save("Horizons A1 - Student's Book.pdf");
  }

  pdfButton.addEventListener("click", async () => {
    if (pdfButton.disabled) return;
    setExportBusy(true);
    try {
      await exportPdf();
    } catch (error) {
      console.error(error);
      alert(`PDF export failed. ${error.message}`);
    } finally {
      setExportBusy(false);
    }
  });
}

const lessons = fs.readdirSync(lessonsDir)
  .filter((name) => lessonPattern.test(name))
  .sort((a, b) => collator.compare(a, b));

if (!lessons.length) throw new Error("No A1 lesson masters found.");

const compiledStyles = [];
const compiledBodies = [];

for (const filename of lessons) {
  const lessonPath = path.join(lessonsDir, filename);
  const html = readText(lessonPath);
  compiledStyles.push(...collectHeadStyles(extractHead(html), lessonPath, filename));
  compiledBodies.push(`<!-- ===== ${filename} ===== -->\n${extractBody(html, filename)}`);
}

const viewerCss = `
html,
body {
  margin: 0;
  padding: 0;
  background: #ececec;
}

#hz-book {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 230mm;
  margin: 0;
  padding: 0;
}

.hz-pdf-button {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9999;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #202124;
  color: #fff;
  box-shadow: 0 4px 16px rgb(0 0 0 / 24%);
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
}

.hz-pdf-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgb(0 0 0 / 28%);
}

.hz-pdf-button:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.hz-pdf-button:disabled {
  opacity: .58;
  cursor: progress;
}

.hz-pdf-button svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.hz-pdf-button.is-busy svg {
  animation: hz-pdf-pulse 900ms ease-in-out infinite alternate;
}

@keyframes hz-pdf-pulse {
  from { opacity: .35; }
  to { opacity: 1; }
}

@media print {
  .hz-pdf-button { display: none !important; }
}
`;

const pdfScript = `(${pdfRuntime.toString()})();`;

const output = `<!doctype html>
<html lang="en-US">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Horizons A1 — Student's Book</title>
  <style>
${compiledStyles.join("\n\n")}

/* Student's Book unifier */
${viewerCss}
  </style>
</head>
<body class="hz-book">
  <main id="hz-book">
${compiledBodies.join("\n\n")}
  </main>

  <button class="hz-pdf-button" id="hz-pdf-button" type="button" aria-label="Download Student's Book as PDF" title="Download PDF">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12"></path>
      <path d="m7 10 5 5 5-5"></path>
      <path d="M5 21h14"></path>
    </svg>
  </button>

  <script src="https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js"></script>
  <script>
${pdfScript}
  </script>
</body>
</html>
`;

fs.writeFileSync(outputPath, output, "utf8");
console.log(`Built ${path.relative(repoRoot, outputPath)} from ${lessons.length} lessons: ${lessons.join(", ")}`);
