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
  if (stack.includes(normalized)) throw new Error(`Circular CSS import detected: ${normalized}`);

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
  text-decoration: none;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.hz-pdf-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgb(0 0 0 / 28%);
}

.hz-pdf-button:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
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

@media print {
  .hz-pdf-button { display: none !important; }
}
`;

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

  <a class="hz-pdf-button"
     href="./Student's Book.pdf"
     download="Horizons A1 - Student's Book.pdf"
     aria-label="Download Student's Book PDF"
     title="Download PDF">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12"></path>
      <path d="m7 10 5 5 5-5"></path>
      <path d="M5 21h14"></path>
    </svg>
  </a>
</body>
</html>
`;

fs.writeFileSync(outputPath, output, "utf8");
console.log(`Built ${path.relative(repoRoot, outputPath)} from ${lessons.length} lessons: ${lessons.join(", ")}`);
