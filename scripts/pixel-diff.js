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
 * System chrome (the status/navigation bars) is EXCLUDED from the comparison via
 * CROP_TOP / CROP_BOTTOM env vars (pixels). We freeze the clock, but the status-bar
 * *background* still flickers on Android run-to-run — so we compare only the app's
 * own content. Baselines are per-platform (iOS and Android render differently) and
 * assume a pinned OS image — see docs/UI_TESTING.md.
 */
const fs = require('fs');
const path = require('path');
const {PNG} = require('pngjs');
const pixelmatch = require('pixelmatch');

const CROP_TOP = parseInt(process.env.CROP_TOP || '0', 10);
const CROP_BOTTOM = parseInt(process.env.CROP_BOTTOM || '0', 10);

// Return a PNG cropped to the content band [CROP_TOP, height - CROP_BOTTOM).
function cropChrome(png) {
    if (!CROP_TOP && !CROP_BOTTOM) return png;
    const height = png.height - CROP_TOP - CROP_BOTTOM;
    const out = new PNG({width: png.width, height});
    PNG.bitblt(png, out, 0, CROP_TOP, png.width, height, 0, 0);
    return out;
}

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

const curFull = PNG.sync.read(fs.readFileSync(curPath));
const baseFull = PNG.sync.read(fs.readFileSync(basePath));
if (curFull.width !== baseFull.width || curFull.height !== baseFull.height) {
    console.error(`FAIL: size mismatch — current ${curFull.width}x${curFull.height} vs baseline ${baseFull.width}x${baseFull.height}`);
    process.exit(1);
}

// Compare only the app content, excluding the status/navigation bars.
const cur = cropChrome(curFull);
const base = cropChrome(baseFull);
if (CROP_TOP || CROP_BOTTOM) {
    console.log(`comparing content band: rows ${CROP_TOP}..${curFull.height - CROP_BOTTOM} (excluding chrome)`);
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
