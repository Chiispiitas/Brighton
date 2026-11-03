import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const repoRoot = process.cwd();
const a1Dir = path.join(repoRoot, "Horizons", "A1");
const lessonsDir = path.join(a1Dir, "Lessons");
const backmatterDir = path.join(a1Dir, "Backmatter");
const frontmatterDir = path.join(a1Dir, "Frontmatter");
const annexesDir = path.join(a1Dir, "Annexes");
const practiceDir = path.join(a1Dir, "Practice");
const practiceManifestPath = path.join(practiceDir, "manifest.json");
const practiceManifest = fs.existsSync(practiceManifestPath) ? JSON.parse(fs.readFileSync(practiceManifestPath, "utf8")) : { masters: [] };
const outputPath = path.join(a1Dir, "Student's Book.html");

const lessonPattern = /^\d+[A-Z]\.html$/i;
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const cssCache = new Map();
const installedStylesheets = new Set();
const installedLiveLessonStylesheets = new Set();
const deferredEditorialStyles = [];
const registeredMasters = new Map();

function readEditorialManifest(directory) {
  const manifestPath = path.join(directory, "manifest.json");
  if (!fs.existsSync(manifestPath)) return { masters: [], closing_masters: [] };
  const manifest = JSON.parse(readText(manifestPath));
  for (const key of ["masters", "closing_masters"]) {
    if (manifest[key] !== undefined && !Array.isArray(manifest[key])) {
      throw new Error(`${manifestPath}: ${key} must be an ordered array.`);
    }
  }
  return { ...manifest, masters: manifest.masters || [], closing_masters: manifest.closing_masters || [] };
}

function masterPath(entry) {
  if (!entry || typeof entry.file !== "string" || !entry.file.trim()) throw new Error("A book master needs a file path.");
  const absolute = path.resolve(a1Dir, entry.file);
  if (!absolute.startsWith(a1Dir + path.sep) || !/\.html$/i.test(absolute) || !fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    throw new Error(`Missing or invalid book master: ${entry.file}`);
  }
  return absolute;
}

const frontmatterManifest = readEditorialManifest(frontmatterDir);
const annexesManifest = readEditorialManifest(annexesDir);

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

function rebaseLocalAssetUrl(value, sourcePath) {
  const raw = value.trim();
  if (!raw || /^(?:data:|blob:|https?:|file:|#|\/|mailto:|tel:|javascript:)/i.test(raw)) return value;

  const suffixMatch = raw.match(/^([^?#]*)([?#].*)?$/);
  const assetPart = suffixMatch?.[1] || raw;
  const suffix = suffixMatch?.[2] || "";
  const absoluteAsset = path.resolve(path.dirname(sourcePath), decodeURIComponent(assetPart));
  let relativeAsset = path.relative(a1Dir, absoluteAsset).replaceAll(path.sep, "/");
  if (!relativeAsset.startsWith(".")) relativeAsset = `./${relativeAsset}`;
  return `${relativeAsset}${suffix}`;
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

function rewriteBodyAssetUrls(bodyHtml, lessonPath) {
  let output = bodyHtml.replace(/\b(src|poster)\s*=\s*(["'])(.*?)\2/gi, (match, attr, quote, value) => {
    const rebased = rebaseLocalAssetUrl(value, lessonPath);
    return `${attr}=${quote}${rebased}${quote}`;
  });

  output = output.replace(/\bsrcset\s*=\s*(["'])(.*?)\1/gi, (match, quote, value) => {
    const rebasedSet = value
      .split(",")
      .map((candidate) => {
        const trimmed = candidate.trim();
        if (!trimmed) return trimmed;
        const parts = trimmed.split(/\s+/);
        const url = parts.shift();
        const descriptor = parts.join(" ");
        const rebased = rebaseLocalAssetUrl(url, lessonPath);
        return descriptor ? `${rebased} ${descriptor}` : rebased;
      })
      .join(", ");
    return `srcset=${quote}${rebasedSet}${quote}`;
  });

  // Every registered book master stays inside the assembled book. The source
  // HTML retains real relative links for opening each master independently.
  output = output.replace(/\bhref\s*=\s*(["'])(.*?)\1/gi, (match, quote, value) => {
    if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value)) return match;
    const hash = value.indexOf("#");
    const localPath = hash < 0 ? value : value.slice(0, hash);
    const fragment = hash < 0 ? "" : value.slice(hash + 1);
    const absolute = localPath ? path.resolve(path.dirname(lessonPath), cleanLocalHref(localPath)) : path.resolve(lessonPath);
    const entry = registeredMasters.get(absolute);
    if (entry && (!localPath || /\.html$/i.test(absolute))) {
      const target = fragment ? (entry.renamedIds.get(decodeURIComponent(fragment)) || fragment) : entry.firstPageId;
      return `href=${quote}#${target}${quote}`;
    }
    if (localPath && /\.html$/i.test(absolute) && [practiceDir, lessonsDir, frontmatterDir, annexesDir, backmatterDir].some(directory => absolute.startsWith(directory + path.sep))) {
      throw new Error(`Internal book link has no registered master: ${value}`);
    }
    if (localPath && !/\.html$/i.test(absolute)) {
      const rebased = rebaseLocalAssetUrl(value, lessonPath).replaceAll(quote, quote === "'" ? "&#39;" : "&quot;");
      return `href=${quote}${rebased}${quote}`;
    }
    return match;
  });
  return output;
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
    const labeledCss = `/* ${path.relative(repoRoot, stylesheetPath).replaceAll(path.sep, "/")} */\n${css}`;
    // Cross-lesson edition layers must follow all older individual lesson rules,
    // matching the order used in each standalone master.
    if (path.dirname(stylesheetPath) === lessonsDir && /^(?:editorial|expressive)-/.test(path.basename(stylesheetPath))) {
      deferredEditorialStyles.push({ name: path.basename(stylesheetPath), css: labeledCss });
    } else output.push(labeledCss);
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

function collectLiveLessonStyles(headHtml, lessonPath) {
  const output = [];
  const lessonRoot = `${path.normalize(lessonsDir)}${path.sep}`;

  for (const match of headHtml.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (attrValue(tag, "rel").toLowerCase() !== "stylesheet") continue;

    const href = attrValue(tag, "href");
    if (!href || /^https?:/i.test(href)) continue;

    const stylesheetPath = path.normalize(path.resolve(path.dirname(lessonPath), cleanLocalHref(href)));
    if (!stylesheetPath.startsWith(lessonRoot)) continue;

    const media = attrValue(tag, "media").trim();
    let relativeHref = path.relative(a1Dir, stylesheetPath).replaceAll(path.sep, "/");
    if (!relativeHref.startsWith(".")) relativeHref = `./${relativeHref}`;

    const key = `${relativeHref}|${media}`;
    if (installedLiveLessonStylesheets.has(key)) continue;
    installedLiveLessonStylesheets.add(key);

    const mediaAttr = media ? ` media="${media}"` : "";
    output.push(`<link rel="stylesheet" href="${relativeHref}"${mediaAttr}>`);
  }

  return output;
}

const lessons = fs.readdirSync(lessonsDir)
  .filter((name) => lessonPattern.test(name))
  .sort((a, b) => collator.compare(a, b));

if (!lessons.length) throw new Error("No A1 lesson masters found.");

const coreMasters = lessons.map(file => ({ file: `Lessons/${file}` }));
const contentMasters = [...frontmatterManifest.masters, ...coreMasters, ...practiceManifest.masters, ...annexesManifest.masters];
const closingMasters = frontmatterManifest.closing_masters;
const backmatter = fs.existsSync(backmatterDir)
  ? fs.readdirSync(backmatterDir).filter(name => /\.html$/i.test(name)).sort((a, b) => collator.compare(a, b))
  : [];
let nextPrintedPage = Math.max(...contentMasters.flatMap(entry =>
  [...extractBody(readText(masterPath(entry)), entry.file).matchAll(/<article\b[^>]*>/gi)]
    .map(match => attrValue(match[0], "data-page")).filter(value => /^\d+$/.test(value)).map(Number)
)) + 1;
const backmatterPagination = new Map();

function registerMaster(entry, repaginate = false) {
  const sourcePath = masterPath(entry);
  if (registeredMasters.has(sourcePath)) throw new Error(`Book master is registered twice: ${entry.file}`);
  const articles = [...readText(sourcePath).matchAll(/<article\b[^>]*>/gi)].map(match => match[0]);
  if (!articles.length) throw new Error(`Book master has no article pages: ${entry.file}`);
  const renamedIds = new Map();
  const pageNumbers = [];
  let firstPageId;
  for (const tag of articles) {
    const oldId = attrValue(tag, "id") || `page-${attrValue(tag, "data-page")}`;
    const assignedPage = repaginate ? nextPrintedPage++ : null;
    const newId = repaginate ? `page-${assignedPage}` : oldId;
    renamedIds.set(oldId, newId);
    pageNumbers.push(assignedPage);
    firstPageId ||= newId;
  }
  registeredMasters.set(sourcePath, { firstPageId, renamedIds });
  if (repaginate) backmatterPagination.set(sourcePath, pageNumbers);
}

for (const entry of [...contentMasters, ...closingMasters]) registerMaster(entry);
for (const filename of backmatter) registerMaster({ file: `Backmatter/${filename}` }, true);

const compiledStyles = [];
const compiledBodies = [];
const liveLessonStyles = [];

function compileEditorialMaster(entry) {
  const sourcePath = masterPath(entry);
  const html = readText(sourcePath);
  compiledStyles.push(...collectHeadStyles(extractHead(html), sourcePath, entry.file));
  compiledBodies.push(`<!-- ===== ${entry.file} ===== -->\n${rewriteBodyAssetUrls(extractBody(html, entry.file), sourcePath)}`);
}

for (const entry of frontmatterManifest.masters) compileEditorialMaster(entry);

for (const filename of lessons) {
  const lessonPath = path.join(lessonsDir, filename);
  const html = readText(lessonPath);
  const head = extractHead(html);
  compiledStyles.push(...collectHeadStyles(head, lessonPath, filename));
  liveLessonStyles.push(...collectLiveLessonStyles(head, lessonPath));
  const body = rewriteBodyAssetUrls(extractBody(html, filename), lessonPath);
  compiledBodies.push(`<!-- ===== ${filename} ===== -->\n${body}`);
}

// Ordered book-owned practice banks follow the completed core. Their
// source pages and topic anchors are validated by check-practice-banks.py.
for (const master of practiceManifest.masters) {
  const sourcePath = path.resolve(a1Dir, master.file);
  if (!fs.existsSync(sourcePath)) throw new Error(`Missing practice master: ${master.file}`);
  const html = readText(sourcePath);
  const head = extractHead(html);
  compiledStyles.push(...collectHeadStyles(head, sourcePath, master.file));
  compiledBodies.push(`<!-- ===== ${master.file} ===== -->\n${rewriteBodyAssetUrls(extractBody(html, master.file), sourcePath)}`);
}

for (const entry of annexesManifest.masters) compileEditorialMaster(entry);

// Book-owned backmatter always follows the lesson and practice masters. Repaginate it from
// the actual final lesson page so future lessons cannot collide with credits.
for (const filename of backmatter) {
  const sourcePath = path.join(backmatterDir, filename);
  const html = readText(sourcePath);
  compiledStyles.push(...collectHeadStyles(extractHead(html), sourcePath, filename));
  let articleIndex = 0;
  const body = rewriteBodyAssetUrls(extractBody(html, filename), sourcePath).replace(
    /<article\b[\s\S]*?<\/article>/gi,
    (article) => {
      const page = backmatterPagination.get(sourcePath)[articleIndex++];
      return article.replace(/\bdata-page=["'][^"']*["']/, `data-page="${page}"`)
        .replace(/(<article\b[^>]*\s)id=["'][^"']*["']/, `$1id="page-${page}"`)
        .replace(/(<span class="hz-page-number">)[\s\S]*?(<\/span>)/, (_, open, close) => open + page + close);
    }
  );
  compiledBodies.push(`<!-- ===== Backmatter/${filename} ===== -->\n${body}`);
}

for (const entry of closingMasters) compileEditorialMaster(entry);

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
  html,
  body,
  body.hz-book,
  #hz-book {
    width: 210mm !important;
    min-width: 0 !important;
    max-width: 210mm !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  #hz-book {
    display: block !important;
  }

  .hz-pdf-button { display: none !important; }
}
`;

const editionVersion = createHash("sha256").update(readText(path.join(repoRoot, "Horizons", "Base", "design-system", "editorial-edition.css"))).digest("hex").slice(0, 12);
const navigationVersion = createHash("sha256").update(readText(path.join(repoRoot, "Horizons", "Base", "viewer", "book-navigation.js"))).digest("hex").slice(0, 12);
const output = `<!doctype html>
<html lang="en-US">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Horizons A1 — Student's Book</title>
  <style>
${compiledStyles.join("\n\n")}
${deferredEditorialStyles.sort((a,b) => Number(a.name.includes("-features")) - Number(b.name.includes("-features"))).map(x => x.css).join("\n\n")}
/* Edition contract follows all local compositions. */
${loadCss(path.join(repoRoot, "Horizons", "Base", "design-system", "editorial-edition.css"))}

/* Student's Book unifier */
${viewerCss}
  </style>
  <!-- Canonical lesson CSS is linked after the compiled snapshot so local CSS edits
       are reflected immediately when opening Student's Book.html during authoring. -->
  ${liveLessonStyles.sort((a,b) => (Number(/\/(?:editorial|expressive)-/.test(a)) * 2 + Number(a.includes("-features"))) - (Number(/\/(?:editorial|expressive)-/.test(b)) * 2 + Number(b.includes("-features")))).join("\n  ")}
  <link rel="stylesheet" href="../Base/design-system/editorial-edition.css?v=${editionVersion}">
  <link rel="stylesheet" href="../Base/viewer/book-navigation.css">
  <script src="../Base/viewer/audio-player.js" data-audio-base="./Audios/" defer></script>
  <script src="../Base/viewer/book-navigation.js?v=${navigationVersion}" defer></script>
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
