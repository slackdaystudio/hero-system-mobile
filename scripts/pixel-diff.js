#!/usr/bin/env node
/*
 * Pixel-diff one screenshot against its committed baseline.
 *
 *   node scripts/pixel-diff.js <current.png> <baseline.png> <diff-out.png> [tolerance]
 *
 * - If the baseline is missing, it is ESTABLISHED from the current image and the run
 *   passes (first-time bootstrap; commit the baseline afterwards).
 * - Otherwise the images are compared with pixelmatch. The run FAILS if the number of
 *   differing pixels exceeds `tolerance` (a fraction of total pixels, default 0.1%).
 * - A visual diff image is always written to <diff-out.png> for artifact upload.
 *
 * Baselines are per-platform (iOS and Android render differently) and assume a pinned
 * OS image and a frozen status bar — see docs/UI_TESTING.md.
 */
const fs = require('fs');
const path = require('path');
const {PNG} = require('pngjs');
const pixelmatch = require('pixelmatch');

const [, , curPath, basePath, outPath, tolArg] = process.argv;
if (!curPath || !basePath || !outPath) {
    console.error('usage: pixel-diff.js <current.png> <baseline.png> <diff-out.png> [tolerance]');
    process.exit(2);
}
const tolerance = tolArg ? parseFloat(tolArg) : 0.001;

if (!fs.existsSync(curPath)) {
    console.error(`FAIL: current screenshot missing: ${curPath}`);
    process.exit(1);
}
if (!fs.existsSync(basePath)) {
    fs.mkdirSync(path.dirname(basePath), {recursive: true});
    fs.copyFileSync(curPath, basePath);
    console.log(`No baseline yet — established from current: ${basePath}`);
    console.log('Commit this baseline; subsequent runs will gate against it.');
    process.exit(0);
}

const cur = PNG.sync.read(fs.readFileSync(curPath));
const base = PNG.sync.read(fs.readFileSync(basePath));
if (cur.width !== base.width || cur.height !== base.height) {
    console.error(`FAIL: size mismatch — current ${cur.width}x${cur.height} vs baseline ${base.width}x${base.height}`);
    process.exit(1);
}

const {width, height} = cur;
const diff = new PNG({width, height});
const changed = pixelmatch(cur.data, base.data, diff.data, width, height, {threshold: 0.1});
fs.mkdirSync(path.dirname(outPath), {recursive: true});
fs.writeFileSync(outPath, PNG.sync.write(diff));

const total = width * height;
const limit = Math.floor(total * tolerance);
const pct = ((changed / total) * 100).toFixed(3);
console.log(`diff: ${changed}/${total} px (${pct}%) — limit ${limit} px (${(tolerance * 100).toFixed(2)}%)`);
if (changed > limit) {
    console.error(`FAIL: character sheet changed beyond tolerance. See ${outPath}.`);
    process.exit(1);
}
console.log('OK: within tolerance.');
