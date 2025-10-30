import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

export const runtime = 'nodejs';

function isAllowedImage(file: string) {
  const allow = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
  return allow.has(path.extname(file).toLowerCase());
}

async function normalizeFilenames(dir: string, files: string[]) {
  // Build mapping old -> final sequential name with .jpg extension
  const imgFiles = files.filter(isAllowedImage);
  imgFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const finals: string[] = [];
  let i = 1;
  for (const oldName of imgFiles) {
    const final = `${i}.jpg`;
    const srcPath = path.join(dir, oldName);
    const tmpName = `._tmp_${crypto.randomBytes(4).toString('hex')}.jpg`;
    const tmpPath = path.join(dir, tmpName);
    const finalPath = path.join(dir, final);

    try {
      // Read source and convert to JPEG
      const buf = await fs.readFile(srcPath);
      const out = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
      await fs.writeFile(tmpPath, out);
      // Move tmp to final, replacing if exists
      try { await fs.unlink(finalPath); } catch {}
      await fs.rename(tmpPath, finalPath);
      // Remove original if name differs
      if (path.basename(srcPath) !== final) {
        try { await fs.unlink(srcPath); } catch {}
      }
      finals.push(final);
    } catch (e) {
      // Cleanup tmp if something failed
      try { await fs.unlink(tmpPath); } catch {}
      // If conversion fails, attempt a rename-as-is to .jpg extension (no re-encode)
      try {
        try { await fs.unlink(finalPath); } catch {}
        await fs.rename(srcPath, finalPath);
        finals.push(final);
      } catch {
        // fallback: keep old name
        finals.push(oldName);
      }
    }

    i++;
  }

  return finals;
}

export async function GET(req: NextRequest) {
  try {
    const dir = path.join(process.cwd(), 'public', 'apparels');
    let entries: string[] = [];
    const normalize = new URL(req.url).searchParams.get('normalize') === '1';
    try {
      const files = await fs.readdir(dir);
      if (normalize) {
        const finals = await normalizeFilenames(dir, files);
        entries = finals.filter(isAllowedImage).map((f) => `/apparels/${f}`);
      } else {
        entries = files.filter(isAllowedImage).map((f) => `/apparels/${f}`);
      }
    } catch {
      // directory missing — return empty list gracefully
      entries = [];
    }
    return NextResponse.json({ items: entries });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to list apparels' }, { status: 500 });
  }
}
