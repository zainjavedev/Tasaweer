#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const allow = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function isAllowed(file) {
  return allow.has(path.extname(file).toLowerCase());
}

async function main() {
  const dir = path.join(process.cwd(), 'public', 'apparels');
  try {
    await fs.access(dir);
  } catch {
    console.error(`No directory: ${dir}`);
    process.exit(1);
  }

  const files = (await fs.readdir(dir)).filter(isAllowed);
  if (files.length === 0) {
    console.log('No apparel images found.');
    return;
  }

  files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  // Write sequential JPEGs to temporary names first to avoid collisions
  const temps = [];
  let i = 1;
  for (const f of files) {
    const src = path.join(dir, f);
    const tmp = path.join(dir, `.__tmp_${i}.jpg`);
    try {
      const buf = await fs.readFile(src);
      const out = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
      await fs.writeFile(tmp, out);
      temps.push({ tmp, final: path.join(dir, `${i}.jpg`) });
      console.log(`Prepared ${path.basename(tmp)} from ${f}`);
    } catch (e) {
      console.warn(`Failed to convert ${f}: ${e?.message || e}`);
    }
    i++;
  }

  // Remove all originals that are not one of our temps
  for (const f of files) {
    const p = path.join(dir, f);
    if (temps.some(t => path.basename(t.tmp) === path.basename(f))) continue;
    try { await fs.unlink(p); console.log(`Removed original ${f}`); } catch {}
  }

  // Move temps into final names
  for (const { tmp, final } of temps) {
    try { await fs.unlink(final); } catch {}
    await fs.rename(tmp, final);
    console.log(`Wrote ${path.basename(final)}`);
  }

  console.log('Normalization complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

