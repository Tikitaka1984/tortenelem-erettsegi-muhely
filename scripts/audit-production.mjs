import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const fail = [];

const courseFiles = fs.readdirSync(path.join(root, "courses"))
  .filter((name) => name.endsWith(".html"))
  .sort();
const imageFiles = fs.readdirSync(path.join(root, "images"))
  .filter((name) => fs.statSync(path.join(root, "images", name)).isFile())
  .sort();
const meta = JSON.parse(read("course-meta.json"));
const manifest = JSON.parse(read("manifest.webmanifest"));
const courses = Array.isArray(meta) ? meta : meta.courses;

if (courseFiles.length !== 32) fail.push(`Kurzusfájlok száma: ${courseFiles.length}`);
if (imageFiles.length !== 62) fail.push(`Képfájlok száma: ${imageFiles.length}`);
if (!Array.isArray(courses) || courses.length !== 32) fail.push(`Metaadat-rekordok száma: ${courses?.length ?? 0}`);

const ids = courses?.map((course) => String(course.id)) ?? [];
const sources = courses?.map((course) => course.source || course.file || course.src || course.path).filter(Boolean) ?? [];
if (new Set(ids).size !== ids.length) fail.push("Duplikált kurzusazonosító a metaadatban");
if (new Set(sources).size !== sources.length) fail.push("Duplikált kurzusfájl a metaadatban");
const courseHashes = courseFiles.map((name) => crypto.createHash("sha256").update(read(`courses/${name}`)).digest("hex"));
if (new Set(courseHashes).size !== courseHashes.length) fail.push("Tartalmilag duplikált kurzusfájl");
for (const source of sources) {
  const coursePath = source.startsWith("courses/") ? source : `courses/${source}`;
  if (!exists(coursePath)) fail.push(`Hiányzó kurzusfájl: ${source}`);
}

const htmlFiles = ["index.html", ...courseFiles.map((name) => `courses/${name}`)];
const brokenReferences = [];
const scriptErrors = [];
const referencePattern = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
const cssReferencePattern = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

for (const htmlFile of htmlFiles) {
  const html = read(htmlFile);
  let match;
  while ((match = referencePattern.exec(html))) {
    const reference = match[1].trim();
    if (!reference || /^(?:https?:|data:|mailto:|tel:|javascript:|#|\/\/)/i.test(reference)) continue;
    const clean = decodeURIComponent(reference.split(/[?#]/)[0]);
    const target = clean.startsWith("/")
      ? path.join(root, clean.slice(1))
      : path.resolve(root, path.dirname(htmlFile), clean);
    if (!fs.existsSync(target)) brokenReferences.push(`${htmlFile} -> ${reference}`);
  }
  while ((match = cssReferencePattern.exec(html))) {
    const reference = match[1].trim();
    if (!reference || /^(?:https?:|data:|#|\/\/)/i.test(reference)) continue;
    const clean = decodeURIComponent(reference.split(/[?#]/)[0]);
    const target = clean.startsWith("/")
      ? path.join(root, clean.slice(1))
      : path.resolve(root, path.dirname(htmlFile), clean);
    if (!fs.existsSync(target)) brokenReferences.push(`${htmlFile} -> ${reference}`);
  }

  while ((match = scriptPattern.exec(html))) {
    const attrs = match[1];
    const code = match[2];
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (type && !["text/javascript", "application/javascript", "module"].includes(type)) continue;
    try {
      new vm.Script(code, { filename: `${htmlFile}:inline-script` });
    } catch (error) {
      scriptErrors.push(`${htmlFile}: ${error.message}`);
    }
  }
}

for (const icon of manifest.icons ?? []) {
  const iconPath = String(icon.src ?? "").replace(/^\//, "");
  if (!iconPath || !exists(iconPath)) brokenReferences.push(`manifest.webmanifest -> ${icon.src}`);
}
for (const image of imageFiles) {
  if (fs.statSync(path.join(root, "images", image)).size === 0) fail.push(`Üres képfájl: images/${image}`);
}

for (const file of ["dashboard-logic.js", "account-cloud.js", "service-worker.js", "api/config.js"]) {
  try {
    new vm.Script(read(file), { filename: file });
  } catch (error) {
    scriptErrors.push(`${file}: ${error.message}`);
  }
}

fail.push(...brokenReferences.map((item) => `Hibás helyi hivatkozás: ${item}`));
fail.push(...scriptErrors.map((item) => `JavaScript szintaktikai hiba: ${item}`));

const result = {
  status: fail.length ? "FAIL" : "PASS",
  courseHtml: courseFiles.length,
  courseMetadata: courses?.length ?? 0,
  uniqueCourseIds: new Set(ids).size,
  uniqueCourseSources: new Set(sources).size,
  uniqueCourseContents: new Set(courseHashes).size,
  images: imageFiles.length,
  htmlFilesChecked: htmlFiles.length,
  brokenLocalReferences: brokenReferences.length,
  javascriptSyntaxErrors: scriptErrors.length,
  manifestPresent: exists("manifest.webmanifest"),
  vercelConfigPresent: exists("vercel.json"),
  failures: fail,
};

console.log(JSON.stringify(result, null, 2));
process.exitCode = fail.length ? 1 : 0;
