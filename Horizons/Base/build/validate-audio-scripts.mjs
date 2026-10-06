import fs from "node:fs";
import path from "node:path";

const scriptsDir = path.resolve(process.argv[2] || "Horizons/A1/Audio scripts");
const forbidden = /\[\s*clearly\s*\]/i;
const failures = [];
let checked = 0;

function inspect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) inspect(filename);
    else if (entry.isFile() && /\.txt$/i.test(entry.name)) {
      checked += 1;
      fs.readFileSync(filename, "utf8").split(/\r?\n/).forEach((line, index) => {
        if (forbidden.test(line)) failures.push(`${path.relative(scriptsDir, filename)}:${index + 1}`);
      });
    }
  }
}

inspect(scriptsDir);
if (failures.length) {
  console.error(`Forbidden audio tag found in ${failures.length} script line(s):\n${failures.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Audio preflight passed: ${checked} scripts contain no forbidden clarity tag.`);
}
