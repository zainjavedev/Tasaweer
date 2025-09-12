// Minimal ZIP (stored no compression) generator for browser
// Creates a Blob for download without external dependencies

function crc32(buf: Uint8Array): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

// Precompute CRC32 table
const table = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : (c >>> 1);
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function encodeUTF8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function numToLE(n: number, bytes: number): Uint8Array {
  const out = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i++) out[i] = (n >>> (8 * i)) & 0xff;
  return out;
}

export type ZipInput = { name: string; data: Uint8Array; mtime?: Date };

export function createZip(inputs: ZipInput[]): Blob {
  const fileRecords: { header: Uint8Array; data: Uint8Array; central: Uint8Array; offset: number }[] = [];
  let offset = 0;
  const chunks: Uint8Array[] = [];

  for (const file of inputs) {
    const nameBytes = encodeUTF8(file.name);
    const data = file.data;
    const crc = crc32(data);
    const mtime = file.mtime || new Date();
    const dostime = toDosTime(mtime);
    const dosdate = toDosDate(mtime);

    // Local file header
    const lf = new Uint8Array(30 + nameBytes.length);
    writeSig(lf, 0, 0x04034b50);
    writeU16(lf, 4, 20); // version needed
    writeU16(lf, 6, 0); // flags
    writeU16(lf, 8, 0); // method 0 (stored)
    writeU16(lf, 10, dostime);
    writeU16(lf, 12, dosdate);
    writeU32(lf, 14, crc);
    writeU32(lf, 18, data.length);
    writeU32(lf, 22, data.length);
    writeU16(lf, 26, nameBytes.length);
    writeU16(lf, 28, 0); // extra len
    lf.set(nameBytes, 30);

    const localOffset = offset;
    offset += lf.length + data.length;
    chunks.push(lf, data);

    // Central directory header
    const cf = new Uint8Array(46 + nameBytes.length);
    writeSig(cf, 0, 0x02014b50);
    writeU16(cf, 4, 20); // version made
    writeU16(cf, 6, 20); // version needed
    writeU16(cf, 8, 0); // flags
    writeU16(cf, 10, 0); // method
    writeU16(cf, 12, dostime);
    writeU16(cf, 14, dosdate);
    writeU32(cf, 16, crc);
    writeU32(cf, 20, data.length);
    writeU32(cf, 24, data.length);
    writeU16(cf, 28, nameBytes.length);
    writeU16(cf, 30, 0); // extra len
    writeU16(cf, 32, 0); // comment len
    writeU16(cf, 34, 0); // disk number
    writeU16(cf, 36, 0); // internal attrs
    writeU32(cf, 38, 0); // external attrs
    writeU32(cf, 42, localOffset);
    cf.set(nameBytes, 46);

    fileRecords.push({ header: lf, data, central: cf, offset: localOffset });
  }

  const centralOffset = offset;
  for (const fr of fileRecords) {
    chunks.push(fr.central);
    offset += fr.central.length;
  }
  const centralSize = offset - centralOffset;

  // End of central directory
  const eocd = new Uint8Array(22);
  writeSig(eocd, 0, 0x06054b50);
  writeU16(eocd, 4, 0); // disk
  writeU16(eocd, 6, 0); // disk start
  writeU16(eocd, 8, fileRecords.length);
  writeU16(eocd, 10, fileRecords.length);
  writeU32(eocd, 12, centralSize);
  writeU32(eocd, 16, centralOffset);
  writeU16(eocd, 20, 0); // comment len
  chunks.push(eocd);

  // Concatenate all chunks
  const totalSize = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(totalSize);
  let p = 0;
  for (const c of chunks) { out.set(c, p); p += c.length; }
  return new Blob([out], { type: 'application/zip' });
}

function writeSig(buf: Uint8Array, off: number, sig: number) { writeU32(buf, off, sig); }
function writeU16(buf: Uint8Array, off: number, n: number) {
  buf[off] = n & 0xff; buf[off + 1] = (n >>> 8) & 0xff;
}
function writeU32(buf: Uint8Array, off: number, n: number) {
  buf[off] = n & 0xff; buf[off + 1] = (n >>> 8) & 0xff; buf[off + 2] = (n >>> 16) & 0xff; buf[off + 3] = (n >>> 24) & 0xff;
}

function toDosTime(d: Date): number {
  const sec = Math.floor(d.getSeconds() / 2);
  return (d.getHours() << 11) | (d.getMinutes() << 5) | sec;
}
function toDosDate(d: Date): number {
  return (((d.getFullYear() - 1980) & 0x7f) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
}

export async function dataUrlToUint8(dataUrl: string): Promise<Uint8Array> {
  const res = await fetch(dataUrl);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

